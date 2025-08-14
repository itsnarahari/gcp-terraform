// ==UserScript==
// @name         Sand Bazar Login & OTP Automation
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Autofill login, poll OTP API, resend if no OTP in 30s, try multiple OTPs sequentially, auto-submit OTP on Sand Bazar portal with alert dismissal
// @author       API Maker + Perplexity AI + GPT-5
// @match        https://sand.telangana.gov.in/TGSandBazaar/CommonPages/BEZLoginPage.aspx
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // === Configuration ===
    const username = '9908506952';
    const password = '11221122';
    const OTP_API_URL = 'https://dev.hariworks.in/one/otp/latest/' + username;

    const POLL_INTERVAL = 1000;      // ms between poll attempts
    const MAX_POLL_ATTEMPTS = 20;    // max polls before forcing resend
    const RESEND_WAIT_TIME = 30000;  // 30 seconds before resend triggered if no OTP

    // === Selectors for elements ===
    const otpInputSelector = 'input[id$="MainContent_txtOTP"]';
    const proceedButtonSelector = 'input[id$="MainContent_btnSend"]';
    const resendButtonSelector = 'input[id$="MainContent_btnResend"]';

    // === State variables ===
    let pollAttempts = 0;
    let otpReceived = false;
    let otpSubmitted = false;
    let pollingActive = false;
    let pollTimer = null;
    let pollingStartTime = null;
    let resendClicked = false;

    // --- Autofill the login form ---
    function fillLoginForm() {
        const uname = document.querySelector('input[id$="MainContent_txtUser"]');
        const pwd = document.querySelector('input[id$="MainContent_txtPassword"]');
        if (uname && pwd) {
            uname.value = username;
            pwd.value = password;
            console.log("[✅] Username and Password autofilled.");
        } else {
            console.warn("[❌] Username or password input not found.");
        }
    }

    // --- Safe setTimeout that clears previous timers ---
    function safeSetTimeout(fn, delay) {
        if (pollTimer) clearTimeout(pollTimer);
        pollTimer = setTimeout(fn, delay);
    }

    // --- Poll the OTP API ---
    function pollOTP() {
        if (otpReceived || otpSubmitted) {
            pollingActive = false;
            return;
        }

        if (!pollingStartTime) pollingStartTime = Date.now();

        // If 30+ seconds elapsed and resend not clicked
        if (!resendClicked && Date.now() - pollingStartTime > RESEND_WAIT_TIME) {
            const resendBtn = document.querySelector(resendButtonSelector);
            if (resendBtn) {
                resendBtn.click();
                resendClicked = true;
                pollAttempts = 0;
                console.log("[🔄] Resend clicked after 30 seconds without OTP.");

                let originalAlert = window.alert;
                window.alert = function (msg) {
                    console.log("[🔔] Alert detected after resend: " + msg);
                    window.alert = originalAlert;
                };
            } else {
                console.warn("[❌] Resend button not found when trying to resend.");
            }
        }

        fetch(OTP_API_URL, { method: 'GET' })
            .then(response => response.json()) // Expect array or string
            .then(data => {
                let otps = [];
                if (Array.isArray(data)) {
                    otps = data.map(o => String(o).trim()).filter(o => o.length >= 4);
                } else if (typeof data === 'string') {
                    otps = [data.trim()];
                }

                if (otps.length > 0) {
                    console.log(`[✅] OTPs received: ${JSON.stringify(otps)}`);
                    tryOTPsSequentially(otps);
                } else {
                    handleNoOTP();
                }
            })
            .catch(err => {
                console.warn("[❌] Error fetching OTP:", err);
                handleNoOTP();
            });
    }

    // --- Try each OTP until success ---
    function tryOTPsSequentially(otps) {
        let index = 0;

        const tryNext = () => {
            if (index >= otps.length || otpSubmitted) return;

            const otp = otps[index];
            console.log(`[🔄] Trying OTP: "${otp}"`);

            fillAndSubmitOTP(otp);

            // Wait a bit for possible success detection
            setTimeout(() => {
                // TODO: Replace with your actual success detection logic
                if (!otpSubmitted) { 
                    index++;
                    tryNext();
                }
            }, 600);
        };

        tryNext();
    }

    // --- Fill OTP input and submit ---
    function fillAndSubmitOTP(otp) {
        if (otpSubmitted) return;

        const otpInput = document.querySelector(otpInputSelector);
        const proceedBtn = document.querySelector(proceedButtonSelector);
        if (otpInput && proceedBtn) {
            otpInput.value = otp;
            otpSubmitted = true;
            clearTimeout(pollTimer);
            proceedBtn.click();
            console.log("[🚀] OTP filled and 'Proceed' clicked.");
        } else {
            console.warn("[❌] OTP input or Proceed button not found.");
        }
    }

    // --- Handle no OTP received ---
    function handleNoOTP() {
        if (otpReceived || otpSubmitted) {
            pollingActive = false;
            return;
        }
        pollAttempts++;
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
            pollAttempts = 0;
        }
        safeSetTimeout(pollOTP, POLL_INTERVAL);
    }

    // === Main logic ===
    window.addEventListener('DOMContentLoaded', () => {
        fillLoginForm();

        let modalPoller = setInterval(() => {
            const modal = document.getElementById('myModal');
            if (modal) {
                const modalStyle = window.getComputedStyle(modal);
                if (modalStyle.display === "block" && modalStyle.visibility !== "hidden" && modalStyle.opacity !== "0") {
                    if (!pollingActive) {
                        const otpInput = document.getElementById("MainContent_txtOTP");
                        const proceedBtn = document.getElementById("MainContent_btnSend");
                        if (
                            otpInput && !otpInput.disabled && otpInput.offsetParent !== null &&
                            proceedBtn && !proceedBtn.disabled && proceedBtn.offsetParent !== null &&
                            !otpReceived
                        ) {
                            console.log("[🔎] OTP Modal is open and visible, starting poll...");
                            clearInterval(modalPoller);
                            pollingActive = true;

                            pollingStartTime = null;
                            resendClicked = false;
                            pollAttempts = 0;
                            otpReceived = false;
                            otpSubmitted = false;

                            pollOTP();
                        }
                    }
                }
            }
        }, 500);
    });

})();
