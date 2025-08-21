#!/usr/bin/env python3
"""
Stronger multi-pass deobfuscator for JS obfuscation patterns:
 - var _0x... = [ ... ];
 - function decoders that subtract offsets and index arrays
 - nested array tokens like pT(250) inside arrays
 - bracket property -> dot conversion when safe

Usage:
    python3 deobfuscate_stronger.py obf.js deobf.js
"""
import re, sys, json

if len(sys.argv) < 3:
    print("Usage: python3 deobfuscate_stronger.py <input.js> <output.js>")
    sys.exit(1)

INFILE = sys.argv[1]
OUTFILE = sys.argv[2]

with open(INFILE, "r", encoding="utf-8") as f:
    code = f.read()

# helper: parse JS array literal tokens (keeps non-quoted tokens as raw)
token_re = re.compile(r'''
    "([^"\\]*(?:\\.[^"\\]*)*)" |   # double quoted
    '([^'\\]*(?:\\.[^'\\]*)*)' |   # single quoted
    ([^,\r\n]+)                    # unquoted token
''', re.X)

def parse_array_literal(text):
    # input: string like [ "a","b", pT(250), "c" ]
    inner = text.strip()
    if inner.startswith('[') and inner.endswith(']'):
        inner = inner[1:-1]
    items = []
    for m in token_re.finditer(inner):
        if m.group(1) is not None:
            items.append(m.group(1))
        elif m.group(2) is not None:
            items.append(m.group(2))
        else:
            items.append(m.group(3).strip().rstrip(','))
    return items

# 1) collect simple var array declarations
var_array_pattern = re.compile(r'var\s+([A-Za-z0-9_$]+)\s*=\s*(\[[\s\S]*?\])\s*;', re.M)
array_vars = {}
for m in var_array_pattern.finditer(code):
    name = m.group(1)
    arr_text = m.group(2)
    try:
        array_vars[name] = parse_array_literal(arr_text)
    except Exception:
        pass

# 2) collect function-returning-array patterns (function name returns array variable)
# e.g. function _0x1002(){ var _0x32d09d = ["...",...]; _0x1002 = function(){ return _0x32d09d; }; return _0x1002(); }
func_arr_pattern = re.compile(r'function\s+([A-Za-z0-9_$]+)\s*\(\)\s*\{\s*var\s+([A-Za-z0-9_$]+)\s*=\s*(\[[\s\S]*?\])\s*;[\s\S]*?return\s+[A-Za-z0-9_$]+\s*\(\s*\)\s*;', re.M)
func_arrays = {}
for m in func_arr_pattern.finditer(code):
    fname = m.group(1)
    internal_var = m.group(2)
    arr_text = m.group(3)
    items = parse_array_literal(arr_text)
    func_arrays[fname] = items
    array_vars[internal_var] = items

# 3) discover decoder functions that use an array (or a function that returns an array) and an offset
# Typical pattern:
# function _0x5838(a,b) { var _0x100209 = _0x1002(); return _0x5838 = function(_0x5838ee,_0x2a720d){ _0x5838ee = _0x5838ee - 497; var _0x1a0309 = _0x100209[_0x5838ee]; return _0x1a0309; }, _0x5838(a,b); }
# We'll capture decoder name -> (array_source, offset)
decoder_pattern = re.compile(
    r'function\s+([A-Za-z0-9_$]+)\s*\([^\)]*\)\s*\{\s*var\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+\(\))\s*;[\s\S]{0,200}return\s+[^\=]+=\s*function\s*\([^\)]*\)\s*\{\s*[^\}]*=\s*[A-Za-z0-9_$]+\s*-\s*([0-9]+)\s*;', re.M)
# fallback pattern if array source is just a var name (not a call)
decoder_pattern2 = re.compile(
    r'function\s+([A-Za-z0-9_$]+)\s*\([^\)]*\)\s*\{\s*var\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+)\s*\(\)\s*;[\s\S]{0,200}=\s*[A-Za-z0-9_$]+\s*-\s*([0-9]+)\s*;', re.M)

decoders = {}   # name -> (arr_source_name, offset)
# More permissive approach: search for "x = x - NUMBER" inside function and find the var assigned to earlier that is arrsource
funcs = re.finditer(r'function\s+([A-Za-z0-9_$]+)\s*\([^\)]*\)\s*\{([\s\S]*?)\}', code)
for fm in funcs:
    fname = fm.group(1)
    body = fm.group(2)
    # try to find a var assignment that calls some function or references a var
    varcall = re.search(r'var\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+\(\))', body)
    varref = re.search(r'var\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+)\s*;', body)
    minus = re.search(r'([A-Za-z0-9_$]+)\s*=\s*\1\s*-\s*([0-9]+)', body) or re.search(r'([A-Za-z0-9_$]+)\s*=\s*[A-Za-z0-9_$]+\s*-\s*([0-9]+)', body)
    if minus:
        try:
            offset = int(minus.group(2))
        except:
            offset = None
        # find name of array source variable used later like arr[x]
        arr_access = re.search(r'([A-Za-z0-9_$]+)\s*\[\s*' + re.escape(minus.group(1)) + r'\s*\]', body)
        arrsrc = None
        if varcall:
            arrsrc = varcall.group(2).rstrip('()')
        elif varref:
            arrsrc = varref.group(2)
        elif arr_access:
            arrsrc = arr_access.group(1)
        if arrsrc and offset is not None:
            decoders[fname] = (arrsrc, offset)

# also include decoders referencing known function arrays (e.g. L uses u())
# try to find simple pattern "return L = function(...){ ... = u(); ... = v - 412; ... }"
# (we already scanned functions generally above so decoders likely captured)

# 4) find simple aliases var f = L;
aliases = dict(re.findall(r'var\s+([A-Za-z0-9_$]+)\s*=\s*([A-Za-z0-9_$]+)\s*;', code))

def resolve_alias(name):
    seen = set()
    while name in aliases and name not in seen:
        seen.add(name)
        name = aliases[name]
    return name

# helper to resolve a decoder call name(idx) -> string if possible
def resolve_decoder_call(name, idx):
    name0 = resolve_alias(name)
    if name0 in decoders:
        arrsrc, offset = decoders[name0]
        arr = None
        # arrsrc could be a function name that returns an array (func_arrays), or a var name in array_vars
        if arrsrc in func_arrays:
            arr = func_arrays[arrsrc]
        if arrsrc in array_vars:
            arr = array_vars[arrsrc]
        # sometimes arrsrc is like _0x1002() captured earlier as varcall's function call; we normalized to function name
        if arr is None and arrsrc.endswith('()'):
            fname = arrsrc[:-2]
            if fname in func_arrays:
                arr = func_arrays[fname]
        if arr is not None:
            pos = idx - offset
            if 0 <= pos < len(arr):
                return arr[pos]
    # also if the decoder name itself maps directly to a func_arrays
    if name0 in func_arrays:
        arr = func_arrays[name0]
        if 0 <= idx < len(arr):
            return arr[idx]
    # if name is a plain array var
    if name0 in array_vars:
        arr = array_vars[name0]
        if 0 <= idx < len(arr):
            return arr[idx]
    return None

# Generic replacement helpers
def replace_decoder_calls_once(s):
    # replace NAME(NUM) where NAME is a decoder or array function
    def repl(m):
        nm = m.group(1)
        idx = int(m.group(2))
        val = resolve_decoder_call(nm, idx)
        if val is not None:
            return json.dumps(val)
        return m.group(0)
    new = re.sub(r'([A-Za-z0-9_$]+)\s*\(\s*([0-9]+)\s*\)', repl, s)
    return new

def replace_array_indexes_once(s):
    # for each known array var, replace var[NUM] with literal when possible
    new = s
    for arrname, items in list(array_vars.items()):
        pat = re.compile(re.escape(arrname) + r'\s*\[\s*([0-9]+)\s*\]')
        def a_repl(m):
            i = int(m.group(1))
            if 0 <= i < len(items):
                v = items[i]
                # if item looks like funcCall e.g. pT(250), keep it (it will be resolved by decoder pass)
                if re.match(r'^[A-Za-z0-9_$]+\(\d+\)$', v):
                    return v
                # otherwise inline as string (safe)
                return json.dumps(v)
            return m.group(0)
        new = pat.sub(a_repl, new)
    return new

def resolve_tokens_in_arrays():
    # array entries sometimes contain tokens like pT(250). Try to resolve those into strings.
    changed = False
    for arrname, items in list(array_vars.items()):
        new_items = []
        for it in items:
            if isinstance(it, str) and re.match(r'^([A-Za-z0-9_$]+)\((\d+)\)$', it):
                m = re.match(r'^([A-Za-z0-9_$]+)\((\d+)\)$', it)
                nm, idx = m.group(1), int(m.group(2))
                resolved = resolve_decoder_call(nm, idx)
                if resolved is not None:
                    new_items.append(resolved)
                    changed = True
                    continue
            new_items.append(it)
        array_vars[arrname] = new_items
    # also resolve inside func_arrays
    for fname, items in list(func_arrays.items()):
        new_items = []
        for it in items:
            if isinstance(it, str) and re.match(r'^([A-Za-z0-9_$]+)\((\d+)\)$', it):
                m = re.match(r'^([A-Za-z0-9_$]+)\((\d+)\)$', it)
                nm, idx = m.group(1), int(m.group(2))
                resolved = resolve_decoder_call(nm, idx)
                if resolved is not None:
                    new_items.append(resolved)
                    changed = True
                    continue
            new_items.append(it)
        func_arrays[fname] = new_items
    return changed

def bracket_to_dot_once(code_str):
    # convert x["y"] -> x.y when y is simple identifier and safe
    def repl(m):
        left = m.group(1)
        prop = m.group(2)
        if re.match(r'^[A-Za-z_$][A-Za-z0-9_$]*$', prop):
            return left + '.' + prop
        return m.group(0)
    # note: left capture is approximate (allow many forms)
    code2 = re.sub(r'([A-Za-z0-9_$\)\]\.]+)\s*\[\s*"([A-Za-z0-9_$]+)"\s*\]', repl, code_str)
    code2 = re.sub(r"([A-Za-z0-9_$\)\]\.]+)\s*\[\s*'([A-Za-z0-9_$]+)'\s*\]", repl, code2)
    return code2

# Multi-pass loop
max_passes = 60
pass_no = 0
while True:
    pass_no += 1
    changed = False
    before = code

    # 1) resolve decoder calls like _0x5838(550)
    new = replace_decoder_calls_once(code)
    if new != code:
        changed = True
        code = new

    # 2) resolve array index lookups var[NUM]
    new = replace_array_indexes_once(code)
    if new != code:
        changed = True
        code = new

    # 3) attempt to resolve tokens inside array declarations (pT(250) etc)
    if resolve_tokens_in_arrays():
        changed = True

    # 4) another round of decoder calls (inlined arrays might expose more)
    new = replace_decoder_calls_once(code)
    if new != code:
        changed = True
        code = new

    # 5) replace array indexes one more time
    new = replace_array_indexes_once(code)
    if new != code:
        changed = True
        code = new

    # 6) convert bracket notation to dot where safe
    new = bracket_to_dot_once(code)
    if new != code:
        changed = True
        code = new

    # stop conditions
    if not changed or pass_no >= max_passes:
        break

print("passes:", pass_no)

with open(OUTFILE, "w", encoding="utf-8") as f:
    f.write(code)

print("Wrote:", OUTFILE)
