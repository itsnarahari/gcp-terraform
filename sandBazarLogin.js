// ==UserScript==
// @name         Sand Bazar Login Autofill
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Autofill credentials and prepare for Captcha automation
// @author       API Maker
// @match        https://sand.telangana.gov.in/TGSandBazaar/CommonPages/BEZLoginPage.aspx
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Global username & password
    const username = '9908506952';  // ← Change this
    const password = '11221122'; // ← Change this

    function fillLoginForm() {
        const uname = document.querySelector('input[id$="MainContent_txtUser"]');
        const pwd = document.querySelector('input[id$="MainContent_txtPassword"]');

        if (uname && pwd) {
            uname.value = username;
            pwd.value = password;
            console.log("[✅] Username and Password autofilled.");
        } else {
            console.log("[❌] Username or password input not found.");
        }
    }
    
    // Run once page is ready
    window.addEventListener('load', () => {
        setTimeout(fillLoginForm, 1000);
    });

})();
