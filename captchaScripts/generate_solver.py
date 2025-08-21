from PIL import Image
import numpy as np
import os

def image_to_templates(image_path, threshold=185, template_w=10, template_h=13):
    img = Image.open(image_path).convert('L')
    arr = np.array(img)
    binary = (arr < threshold).astype(np.uint8)
    proj = binary.sum(axis=0)
    proj_thresh = 2
    char_min_width = 6
    blocks, in_char = [], False
    for i, val in enumerate(proj):
        if val > proj_thresh and not in_char:
            start = i
            in_char = True
        elif (val <= proj_thresh or i == len(proj)-1) and in_char:
            end = i if val <= proj_thresh else i+1
            if end - start >= char_min_width:
                blocks.append((start, end))
            in_char = False

    templates = []
    for start, end in blocks:
        block = binary[:, start:end]
        resized = np.array(Image.fromarray(block * 255).resize((template_w, template_h), Image.NEAREST))
        bin_arr = (resized < threshold).astype(int)
        js_arr = []
        for x in range(template_w):
            col = ''.join(str(bin_arr[y, x]) for y in range(template_h))
            js_arr.append(int(col, 2))
        templates.append(js_arr)
    return templates

def unique_templates(all_templates):
    unique = []
    for tpl in all_templates:
        if not any(np.array_equal(tpl, u) for u in unique):
            unique.append(tpl)
    return unique

# ==== Read from your folder ====
folder = "captchaScripts/captchas"
file_count = 100   # from 0.png to 99.png
filenames = [os.path.join(folder, f"{i}.png") for i in range(file_count)]

all_templates = []
for fname in filenames:
    if os.path.exists(fname):
        templates = image_to_templates(fname)
        all_templates.extend(templates)

out_templates = unique_templates(all_templates)

js_map = "[\n" + ',\n'.join(str(arr) for arr in out_templates) + "\n]"
js_chars = "['?', '?', '?', '?', '?', '?', '?', '?', '?', '?']"[:len(out_templates)]  # Fill with actual chars manually

js_code = f"""
(function() {{
    'use strict';
    var map = {js_map};
    var ch = {js_chars};

    function solve(img) {{
        var c = document.createElement('canvas');
        var ctx = c.getContext('2d');
        var width = img.width;
        var height = img.height;
        c.width = width;
        c.height = height;
        ctx.drawImage(img, 0, 0);
        var d = ctx.getImageData(0, 0, width, height).data;
        var bin = Array.from(Array(width * height), (v, k) =>
            (d[k*4] + d[k*4+1] + d[k*4+2])/3 > 185 ? 0 : 1
        );
        var proj = [];
        for (var x = 0; x < width; x++) {{
            var sum = 0;
            for (var y = 0; y < height; y++) {{
                if (bin[y * width + x]) sum++;
            }}
            proj.push(sum);
        }}
        var blocks = [];
        var threshold_p = 2;
        var minWidth = 6;
        var start = null;
        for (var i = 0; i < proj.length; i++) {{
            if (proj[i] > threshold_p && start === null) {{
                start = i;
            }} else if ((proj[i] <= threshold_p || i === proj.length - 1) && start !== null) {{
                var end = (proj[i] <= threshold_p) ? i : (i + 1);
                if (end - start >= minWidth) {{
                    blocks.push([start, end]);
                }}
                start = null;
            }}
        }}
        function charToBinaryArray(data, charW, charH) {{
            var out = [];
            for (var x = 0; x < charW; ++x) {{
                var col = '';
                for (var y = 0; y < charH; ++y) {{
                    var idx = Math.floor(y * data.length / charH) * charW + x;
                    col += data[idx] ? '1' : '0';
                }}
                out.push(parseInt(col, 2));
            }}
            return out;
        }}
        var charTemplateW = 10;
        var charTemplateH = 13;
        var chars = blocks.map(function(bidx) {{
            var bw = bidx[1] - bidx;
            var charData = [];
            for (var y = 0; y < height; y++) {{
                for (var x = bidx; x < bidx[1]; x++) {{
                    charData.push(bin[y * width + x]);
                }}
            }}
            return charToBinaryArray(charData, charTemplateW, charTemplateH);
        }});
        var result = chars.map(function(dd, k) {{
            return map.map(function(mapRow, kk) {{
                var diff = mapRow.map(function(val, idx) {{
                    return (((dd[idx] || 4096) ^ val).toString(2).replace(/0/g,"").length);
                }}).reduce(function(a, b) {{ return a + b; }}, 0);
                return [diff, ch[kk], k];
            }}).reduce(function(a, b){{return b[0]<a?b:a;}});
        }});
        return result.sort(function(a, b) {{ return a[2] - b[2]; }}).map(function(v){{return v[1];}}).join('');
    }}
    var img = document.getElementById('MainContent_imgCaptcha');
    var txt = document.getElementById('MainContent_txtCaptha');
    if(img && txt){{
        txt.value = solve(img);
        img.addEventListener('load', function(){{ txt.value = solve(img); }});
    }}
}})();
"""

print(js_code)
