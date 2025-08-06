// ==UserScript==
// @name         Sand bazar Auto-Click OWN TRANSPORT BOOKING (with Const)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically clicks "OWN TRANSPORT BOOKING" in the SAND BAZAAR dropdown
// @author       API Maker
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/InnerHome.aspx
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const ownTransportText = 'OWN TRANSPORT BOOKING'; // Text to match in dropdown (case-insensitive)

    function clickOwnTransport() {
        // Look for every dropdown <li>
        const dropdowns = document.querySelectorAll('li.dropdown');
        for (let li of dropdowns) {
            // Find anchor for dropdown toggle
            const a = li.querySelector('a.dropdown-toggle');
            if (a && /SAND\s*BAZAAR\s*BOOKINGS/i.test(a.textContent)) {
                // Find dropdown menu inside this li
                const menu = li.querySelector('ul.dropdown-menu');
                if (menu && menu.children.length) {
                    // Make sure it's visible (if hidden)
                    menu.style.display = 'block';

                    // Find the "OWN TRANSPORT BOOKING" link
                    const ownLink = Array.from(menu.querySelectorAll('a')).find(link =>
                        link.textContent.trim().toUpperCase() === ownTransportText.toUpperCase()
                    );
                    if (ownLink) {
                        ownLink.style.background = '#ffff99'; // Optionally highlight

                        setTimeout(() => {
                            ownLink.click();
                        }, 1000);

                        setTimeout(() => {
                            menu.style.display = 'none';
                        }, 1500);
                        return; // Done!
                    }
                }
            }
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
                console.log(sessionStorage.getItem('sandAutoFilled'));
                    sessionStorage.setItem('sandAutoFilled','no');
        setTimeout(clickOwnTransport, 1000);
                console.log(sessionStorage.getItem('sandAutoFilled'));
    });
})();
