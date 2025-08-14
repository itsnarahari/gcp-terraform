// ==UserScript==
// @name         Sand Bazar OWN TRANSPORT BOOKING Ultra-Fast Auto-Click with "No Records Found" Handler
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Starts retry clicking OWN TRANSPORT BOOKING at given precise time with millisecond accuracy, reloads on error, and retries booking page if "No Records Found" appears
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/InnerHome.aspx
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/SandBazaarBookingNew.aspx
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    /*** USER CONFIG ***/
    const RETRY_START_TIME_STR = '20:23:00:000';      // Format: HH:MM:SS:ms
    const CLICK_RETRY_INTERVAL = 1;                   // ms between retries when clicking transport link
    const MAX_RETRY_DURATION = 5000;                   // Stop after 5 seconds if not navigated to booking page
    const OWN_TRANSPORT_TEXT = 'OWN TRANSPORT BOOKING';

    const NO_RECORDS_TEXT = 'No Records Found';        // Text found when no stock yard data
    const NO_RECORDS_RETRY_INTERVAL = 1;
    const FAILURE_PAGE_RETRIVAL_INTERVAL=1;          // ms gap between reloads for "No Records Found"

    /*** ERROR DETECTION OPTIONS ***/
    const failPageTitles = [
        '502 Bad Gateway', '504 Gateway Time-out', 'Problem loading page',
        '503 Service Temporarily Unavailable', 'Service Unavailable', '500 Internal Server Error',
        'Database error', 'FastCGI Error', 'The connection has timed out',
        'Problemas al cargar la página', 'Error 502 (Server Error)!!1'
    ];
    const failPageH1s = [
        '502 Bad Gateway', 'Service Unavailable', 'Error 503 Service Unavailable',
        '404 Not Found', '504 Gateway Time-out'
    ];

    /*** STATE VARS ***/
    let retryIntervalId = null;
    let clickDone = false;
    let noRecordsIntervalId = null;

    /*** HELPERS ***/
    function parseTimeString(timeStr) {
        const [hh, mm, ss, ms] = timeStr.split(':').map(Number);
        return { hh, mm, ss, ms };
    }

    function getDelayUntilStart() {
        const now = new Date();
        const { hh, mm, ss, ms } = parseTimeString(RETRY_START_TIME_STR);
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, ss, ms);
        let delay = target - now;
        return delay > 0 ? delay : 0;
    }

    function isErrorPage() {
        const title = document.title;
        const h1 = (document.getElementsByTagName('h1')[0] || {}).innerText || '';
        return failPageTitles.includes(title) || failPageH1s.includes(h1);
    }

function checkErrorAndReload() {
    if (isErrorPage()) {
        setTimeout(() => location.reload(), FAILURE_PAGE_RETRIVAL_INTERVAL);
        return true;
    }
    return false;
}

    function isBookingPage() {
        return window.location.href.includes('/InnerPages/SandBazaarBookingNew.aspx');
    }

    /*** MAIN ACTION ***/
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
            if (checkErrorAndReload()) {
                clearInterval(retryIntervalId);
                retryIntervalId = null;
                return;
            }
            if (!clickDone) {
                tryClickOwnTransport();
            }
        }, CLICK_RETRY_INTERVAL);

        // Stop after MAX_RETRY_DURATION
        setTimeout(() => {
            if (retryIntervalId !== null) {
                clearInterval(retryIntervalId);
                retryIntervalId = null;
            }
        }, MAX_RETRY_DURATION);
    }

function retryOnNoRecordsFound() {
    if (noRecordsIntervalId) return;
    noRecordsIntervalId = setInterval(() => {
        if (checkErrorAndReload()) return;
        if (document.body.innerText.includes(NO_RECORDS_TEXT))
            setTimeout(() => location.reload(), 0);
        else {
            clearInterval(noRecordsIntervalId);
            noRecordsIntervalId = null;
        }
    }, NO_RECORDS_RETRY_INTERVAL);
}

    function initAutomationAtScheduledTime() {
        const delay = getDelayUntilStart();
        if (delay === 0) {
            startRetryClicking();
        } else {
            setTimeout(() => startRetryClicking(), delay);
        }
    }

    /*** PAGE ENTRY POINT ***/
    window.addEventListener('DOMContentLoaded', () => {
        sessionStorage.setItem('sandAutoFilled', 'no');
        const url = window.location.href;

        if (url.includes('/InnerPages/InnerHome.aspx')) {
            initAutomationAtScheduledTime();
        } 
        else if (url.includes('/InnerPages/SandBazaarBookingNew.aspx')) {
            if (retryIntervalId !== null) {
                clearInterval(retryIntervalId);
                retryIntervalId = null;
            }
            if (!checkErrorAndReload()) {
                retryOnNoRecordsFound();
            }
        }
    });
})();
