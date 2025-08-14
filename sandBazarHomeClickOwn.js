// ==UserScript==
// @name     Sand Bazar OWN TRANSPORT BOOKING Ultra-Fast Auto-Click with Only "No Records Found" Handler (No Retry Limit)
// @namespace  http://tampermonkey.net/
// @version   3.3
// @description Starts retry clicking OWN TRANSPORT BOOKING at given precise time with millisecond accuracy, retries booking page if "No Records Found" appears, no retry time limit
// @match    https://sand.telangana.gov.in/TGSandBazaar/InnerPages/InnerHome.aspx
// @match    https://sand.telangana.gov.in/TGSandBazaar/InnerPages/SandBazaarBookingNew.aspx
// @grant    none
// ==/UserScript==


(function () {
    'use strict';


    /*** USER CONFIG ***/
    const RETRY_START_TIME_STR = '08:23:00:000'; // Format: HH:MM:SS:ms
    const CLICK_RETRY_INTERVAL = 1;       // ms between retries when clicking transport link
    const OWN_TRANSPORT_TEXT = 'OWN TRANSPORT BOOKING';

    const NO_RECORDS_TEXT = 'No Records Found'; // Text to trigger reload
    const NO_RECORDS_RETRY_INTERVAL = 10;


    let retryIntervalId = null;
    let clickDone = false;
    let noRecordsIntervalId = null;


    /*** FASTER TIME FUNCTION ***/
    function getDelayUntilStart() {
        const [hh, mm, ss, ms] = RETRY_START_TIME_STR.split(':').map(Number);
        const target = new Date();
        target.setHours(hh, mm, ss, ms);
        const delay = target.getTime() - Date.now();
        return delay > 0 ? delay : 0;
    }


    function isBookingPage() {
        return location.pathname.includes('/InnerPages/SandBazaarBookingNew.aspx');
    }

    function tryClickOwnTransport() {
        const dropdowns = document.querySelectorAll('li.dropdown');
        for (const li of dropdowns) {
            const toggleAnchor = li.querySelector('a.dropdown-toggle');
            if (toggleAnchor && /SAND\s*BAZAAR\s*BOOKINGS/i.test(toggleAnchor.textContent)) {
                const menu = li.querySelector('ul.dropdown-menu');
                if (menu && menu.children.length) {
                    menu.style.display = 'block';
                    const ownLink = Array.from(menu.querySelectorAll('a')).find(link =>
                        link.textContent.trim().toUpperCase() === OWN_TRANSPORT_TEXT
                    );
                    if (ownLink) {
                        ownLink.click();
                        clickDone = true;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    function startRetryClicking() {
        if (retryIntervalId !== null) return;
        retryIntervalId = setInterval(() => {
            if (isBookingPage()) {
                clearInterval(retryIntervalId);
                retryIntervalId = null;
                return;
            }
            if (!clickDone) {
                tryClickOwnTransport();
            }
        }, CLICK_RETRY_INTERVAL);
    }


    function retryOnNoRecordsFound() {
        if (noRecordsIntervalId) return;
        noRecordsIntervalId = setInterval(() => {
            if (document.body && document.body.textContent.includes(NO_RECORDS_TEXT)) {
                clearInterval(noRecordsIntervalId);
                noRecordsIntervalId = null;
                location.reload();
            }

        }, NO_RECORDS_RETRY_INTERVAL);
    }

    function initAutomationAtScheduledTime() {

        const delay = getDelayUntilStart();
        if (delay == 0) {
            startRetryClicking();
        } else {
            setTimeout(() => startRetryClicking(), delay);
        }
    }


    /*** PAGE ENTRY ***/
    window.addEventListener('DOMContentLoaded', () => {
        sessionStorage.setItem('sandAutoFilled', 'no');
        const url = location.href;
        if (url.includes('/InnerPages/InnerHome.aspx')) {
            initAutomationAtScheduledTime();
        } else if (url.includes('/InnerPages/SandBazaarBookingNew.aspx')) {
            if (retryIntervalId !== null) {
                clearInterval(retryIntervalId);
                retryIntervalId = null;
            }
            retryOnNoRecordsFound();
        }
    });
})();