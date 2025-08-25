// ==UserScript==
// @name         SAND BAZAAR Auto-Captcha Solver (No Reload)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Auto-solve captchas and login on Telangana SAND BAZAAR without reloads
// @match        https://sand.telangana.gov.in/TGSandBazaar/CommonPages/BEZLoginPage.aspx
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Prevent duplicate script runs using a lock via localStorage
    if (localStorage.getItem('sb_captcha_lock') === 'true') return;
    localStorage.setItem('sb_captcha_lock', 'true');

    function getCaptchaBase64() {
        const img = document.querySelector('#MainContent_imgCaptcha');
        if (!img) return null;
        return img.src.split(',')[1] || "";
    }

    function postToOCR(base64) {
        // You must use a CORS-proxy if this API blocks browser requests
        return fetch('https://reader.hariworks.in/one/ocr', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({image: base64})
        })
        .then(r => r.text())
        .then(txt => txt.trim());
    }

    function setCaptchaField(value) {
        const captchaBox = document.querySelector('#MainContent_txtCaptha');
        if (captchaBox) captchaBox.value = value;
    }

    function clickLogin() {
        const btn = document.querySelector('#MainContent_btnsubmit');
        if (btn) btn.click();
    }

    function clickRefresh() {
        const refreshBtn = document.querySelector('#MainContent_btnRefresh');
        if (refreshBtn) refreshBtn.click();
    }

    function handlePopupAndRetry() {
        let interval = setInterval(() => {
            // Detect the "Please Enter Correct Captcha..." popup
            let popups = document.querySelectorAll('div[role="dialog"], .modal-content');
            let hasPopup = false;
            for (let p of popups) {
                if (p.innerText && p.innerText.includes('Please Enter Correct Captcha')) {
                    hasPopup = true;
                    // Close popup
                    let btn = p.querySelector('button, input[type="button"], input[type="submit"]');
                    if (btn) btn.click();
                }
            }

            if (hasPopup) {
                setTimeout(() => {
                    clickRefresh();
                    // Wait for new captcha to load and call solveCaptcha again
                    setTimeout(solveCaptcha, 900);
                }, 400);
                clearInterval(interval);
            } else {
                // If OTP appears, unlock so next script can work
                const otpBox = document.querySelector('input#MainContent_txtOTP');
                if (otpBox && otpBox.closest('div[style*="display: block"]')) {
                    localStorage.setItem('sb_captcha_lock', 'false');
                    clearInterval(interval);
                }
            }
        }, 650);
    }

    function solveCaptcha() {
        let base64 = getCaptchaBase64();
        if (!base64) {
            setTimeout(solveCaptcha, 500);
            return;
        }
        postToOCR(base64).then(captchaText => {
            setCaptchaField(captchaText);
            setTimeout(() => {
                clickLogin();
                handlePopupAndRetry();
            }, 250);
        }).catch(() => {
            // Retry on error
            setTimeout(solveCaptcha, 1200);
        });
    }

    // Script only runs once per page (lock mechanism)
    window.addEventListener('load', () => {
        solveCaptcha();
    });

    // Unlock lock on page exit
    window.addEventListener('beforeunload', function() {
        localStorage.setItem('sb_captcha_lock', 'false');
    });
})();
