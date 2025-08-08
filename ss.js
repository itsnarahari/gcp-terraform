// @name         Sand bazar Captcha Solver
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Autofill credentials and prepare for Captcha automation
// @author       API Maker
// @match        https://sand.telangana.gov.in/TGSandBazaar/CommonPages/BEZLoginPage.aspx
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Example: Bitmap patterns for 'A', 'B', ..., '9', '0'
    // You NEED to update/add these based on your own captcha font images!
    // Each is an array of bitmap columns (integers). For demo, only 'B', '6', 'F' are approximate.
    const CHAR_BITMAPS = {
        'B': [0b11110,0b10001,0b10001,0b11110,0b10001,0b10001,0b11110],
        'F': [0b11111,0b10000,0b10000,0b11110,0b10000,0b10000,0b10000],
            '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
    '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
    '2': [0b01110, 0b10001, 0b00001, 0b00010, 0b00100, 0b01000, 0b11111],
    '3': [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
    '4': [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
    '5': [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
    '6': [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
    '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b10000],
    '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
    '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
        // Add entries for A-Z 0-9 as needed:
        // 'A': [...], ...
        // '0': [...], ...
    };

    // Params—set these to match your page:
    const CAPTCHA_IMG_ID = 'MainContent_imgCaptcha';
    const CAPTCHA_INPUT_ID = 'MainContent_txtCaptha';
    const CANVAS_WIDTH = 110; // Adjust as per your actual image size
    const CANVAS_HEIGHT = 36; // Adjust as per your actual image size
    const CHAR_WIDTH = 7; // Approximate columns per char—customize for your font!

    function getPixelBitmap(ctx, w, h, threshold = 120) {
        const data = ctx.getImageData(0, 0, w, h).data;
        let bitmap = [];
        for (let y = 0; y < h; y++) {
            let row = [];
            for (let x = 0; x < w; x++) {
                let idx = (y * w + x) * 4;
                let avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                row.push(avg < threshold ? 1 : 0);
            }
            bitmap.push(row);
        }
        return bitmap;
    }

    // Slice bitmap vertically into character regions; you may need to tune this for your captcha
    function sliceCharacters(bitmap, charWidth) {
        let slices = [];
        let x = 0;
        while (x + charWidth <= bitmap[0].length) {
            let charSlice = [];
            for (let y = 0; y < bitmap.length; y++) {
                charSlice.push(bitmap[y].slice(x, x + charWidth));
            }
            slices.push(charSlice);
            x += charWidth;
        }
        return slices;
    }

    // Convert a character bitmap (matrix) to array of column bitmasks (integers)
    function bitmapToColumns(slice) {
        let cols = [];
        for (let col = 0; col < slice[0].length; col++) {
            let colVal = 0;
            for (let row = 0; row < slice.length; row++) {
                colVal = (colVal << 1) | slice[row][col];
            }
            cols.push(colVal);
        }
        // Remove leading/trailing all-zero columns
        while(cols[0] === 0) cols.shift();
        while(cols[cols.length - 1] === 0) cols.pop();
        return cols;
    }

    // Find best match in CHAR_BITMAPS for a column pattern
    function matchColumns(cols) {
        let bestChar = '?', minDiff = 1e9;
        for (const [ch, template] of Object.entries(CHAR_BITMAPS)) {
            let diff = 0;
            let len = Math.max(cols.length, template.length);
            for (let i = 0; i < len; i++) {
                let a = cols[i] || 0, b = template[i] || 0;
                diff += (a ^ b).toString(2).split('1').length - 1;
            }
            if (diff < minDiff) {
                minDiff = diff;
                bestChar = ch;
            }
        }
        return bestChar;
    }

function solveCaptcha() {
    const img = document.getElementById(CAPTCHA_IMG_ID);
    const input = document.getElementById(CAPTCHA_INPUT_ID);
    if (!img || !img.complete) {
        // Try again in 300ms if not loaded
        setTimeout(solveCaptcha, 300);
        return;
    }

    // Ensure image is loaded and drawn
    const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    document.body.appendChild(canvas);

        // 1. Get binary bitmap
        const bitmap = getPixelBitmap(ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Slice characters
        const chars = sliceCharacters(bitmap, CHAR_WIDTH);
        console.log('Character slices:', chars);

        // 3. Pattern match for each character
        let result = '';
        for (const slice of chars) {
            const colPattern = bitmapToColumns(slice);
            const ch = matchColumns(colPattern);
            result += ch;
        }

        // 4. Fill result in field
        if (result.replace(/\?/g, '').length >= 4) { // at least 4 chars, no '?'
            input.value = result;
            input.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Decoded captcha:', result);
        } else {
            console.warn('Captcha not recognized:', result);
        }
    }

function setupSolverWatcher() {
    console.log("🔍 Setting up captcha solver watcher...");
    let prevSrc = "";
    setInterval(() => {
        const img = document.getElementById(CAPTCHA_IMG_ID);
        if (img && img.src !== prevSrc) {
            // Make sure the image is loaded:
            img.onload = () => setTimeout(solveCaptcha, 250);
            if (img.complete) setTimeout(solveCaptcha, 250);
            prevSrc = img.src;
        }
    }, 1000);
}


    window.addEventListener('load', setupSolverWatcher);
})();
