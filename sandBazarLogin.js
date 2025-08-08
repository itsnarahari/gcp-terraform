// ==UserScript==
// @name         Sand Bazar Login & OTP Automation
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Autofill login, poll OTP API, resend if no OTP in 30s, auto-submit OTP on Sand Bazar portal with alert dismissal
// @author       API Maker + Perplexity AI
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
        // Stop polling if OTP already received/submitted
        if (otpReceived || otpSubmitted) {
            pollingActive = false;
            return;
        }

        // Start polling timer on first poll
        if (!pollingStartTime) pollingStartTime = Date.now();

        // If 30+ seconds elapsed and resend not clicked, click resend
        if (!resendClicked && Date.now() - pollingStartTime > RESEND_WAIT_TIME) {
            const resendBtn = document.querySelector(resendButtonSelector);
            if (resendBtn) {
                resendBtn.click();
                resendClicked = true;
                pollAttempts = 0; // reset attempts after resend
                console.log("[🔄] Resend clicked after 30 seconds without OTP.");

                // Override window.alert to auto-dismiss alert popup after resend
                let originalAlert = window.alert;
                window.alert = function (msg) {
                    console.log("[🔔] Alert detected after resend: " + msg);
                    // Automatically suppress alert popup (do nothing)
                    // Restore default alert after suppressing once
                    window.alert = originalAlert;
                };
            } else {
                console.warn("[❌] Resend button not found when trying to resend.");
            }
        }

        fetch(OTP_API_URL, { method: 'GET' })
            .then(response => response.text())
            .then(otp => {
                otp = otp.trim();
                console.log(`[✅] OTP received: "${otp}"`);
                if (otp && otp.length >= 4) {
                    otpReceived = true;
                    pollingActive = false;
                    fillAndSubmitOTP(otp);
                } else {
                    handleNoOTP();
                }
            })
            .catch(err => {
                console.warn("[❌] Error fetching OTP:", err);
                handleNoOTP();
            });
    }

    // --- Fill OTP input and submit the form ---
    function fillAndSubmitOTP(otp) {
        if (otpSubmitted) return; // Prevent submitting twice

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

    // --- Handle no OTP received in a single poll attempt ---
    function handleNoOTP() {
        if (otpReceived || otpSubmitted) {
            pollingActive = false;
            return;
        }
        pollAttempts++;
        if (pollAttempts >= MAX_POLL_ATTEMPTS) {
            // Optionally resend here if you want extra retries,
            // but planned resend is handled via timeout above
            pollAttempts = 0; 
        }
        safeSetTimeout(pollOTP, POLL_INTERVAL);
    }

    // === Main logic triggered when page loads ===
    window.addEventListener('DOMContentLoaded', () => {
        fillLoginForm();

        // Poll/check for modal visibility every 500ms
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

                            // Reset tracking variables on modal open
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
