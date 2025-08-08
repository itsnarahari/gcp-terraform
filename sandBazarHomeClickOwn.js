// ==UserScript==
// @name         Sand Bazar OWN TRANSPORT BOOKING Auto-Click with Timed Start & Retry
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Starts retry clicking OWN TRANSPORT BOOKING from 09:59:58 AM local time until booking page loads, reload on error pages
// @author       Perplexity AI
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/InnerHome.aspx
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/SandBazaarBookingNew.aspx
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Config
    const RETRY_START_HOUR = 22;
    const RETRY_START_MINUTE = 42;
    const RETRY_START_SECOND = 0;
    const CLICK_RETRY_INTERVAL = 500; // ms between retries
    const ERROR_RELOAD_DELAY = 500;   // ms delay before reload on error page

    const OWN_TRANSPORT_TEXT = 'OWN TRANSPORT BOOKING';

    // Known error page titles and h1 texts
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

    let retryIntervalId = null;

    // Calculate delay until target start time today
    function getDelayUntilStart() {
        const now = new Date();
        const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(),
            RETRY_START_HOUR, RETRY_START_MINUTE, RETRY_START_SECOND, 0);
        let delay = target - now;
        return delay > 0 ? delay : 0; // If already passed, start immediately
    }

    function isErrorPage() {
        const title = document.title;
        const h1 = (document.getElementsByTagName('h1')[0] || {}).innerText || '';
        return failPageTitles.includes(title) || failPageH1s.includes(h1);
    }

    // Reload page if error detected
    function checkErrorAndReload() {
        if (isErrorPage()) {
            console.warn(`[Error] Detected error page "${document.title}". Reloading in ${ERROR_RELOAD_DELAY}ms...`);
            setTimeout(() => window.location.reload(), ERROR_RELOAD_DELAY);
            return true;
        }
        return false;
    }

    function isBookingPage() {
        return window.location.href.includes('/InnerPages/SandBazaarBookingNew.aspx');
    }

    // Try clicking OWN TRANSPORT BOOKING link
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
                        ownLink.style.background = '#ffff99'; // highlight
                        setTimeout(() => {
                            ownLink.click();
                            console.log('[RetryClick] OWN TRANSPORT BOOKING clicked!');
                        }, 50);
                        setTimeout(() => {
                            menu.style.display = 'none';
                        }, 100);
                        return true;
                    }
                }
            }
        }
        return false;
    }

// Called to start retry clicking
function startRetryClicking() {
    if (retryIntervalId !== null) return; // already running

    // Immediately check if already on booking page — if yes, stop
    if (isBookingPage()) {
        console.log('[RetryClick] Already on booking page at start. Not starting retry loop.');
        return;
    }

    retryIntervalId = setInterval(() => {
        if (isBookingPage()) {
            console.log('[RetryClick] Booking page detected, stopping retry.');
            clearInterval(retryIntervalId);
            retryIntervalId = null;
            return;
        }
        if (checkErrorAndReload()) {
            clearInterval(retryIntervalId);
            retryIntervalId = null;
            return;
        }

        if (!tryClickOwnTransport()) {
            console.warn('[RetryClick] Own Transport Booking link not found this attempt.');
        }
    }, CLICK_RETRY_INTERVAL);
}


    // Start automation precisely at configured time
    function initAutomationAtScheduledTime() {
        const delay = getDelayUntilStart();
        if (delay === 0) {
            console.log(`[START] Time passed or now, starting retry clicking immediately.`);
            startRetryClicking();
        } else {
            console.log(`[WAIT] Waiting ${Math.round(delay / 1000)}s until ${RETRY_START_HOUR}:${RETRY_START_MINUTE}:${RETRY_START_SECOND} to start retry.`);
            setTimeout(() => {
                console.log(`[START] Scheduled time reached, starting retry clicking.`);
                startRetryClicking();
            }, delay);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
    const url = window.location.href;
    sessionStorage.setItem('sandAutoFilled','no');
    if (url.includes('/InnerPages/InnerHome.aspx')) {
        console.log('[Init] Home page loaded.');
        initAutomationAtScheduledTime();
    } else if (url.includes('/InnerPages/SandBazaarBookingNew.aspx')) {
        if (retryIntervalId !== null) {
            clearInterval(retryIntervalId);
            retryIntervalId = null;
            console.log('[Init] Booking page loaded, stopped retry loop.');
        }
        checkErrorAndReload();
        // No retry clicking on booking page.
    }
});

})();
