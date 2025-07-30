// ==UserScript==
// @name         Fetch and Display Data1
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Fetch data from an API and display it on the webpage
// @author       You
// @match        https://onlinebooking.sand.telangana.gov.in/Order/NEWBOOKING.aspx?KLM=*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const vehicles = [
        "",
        "",              // index 0 unused
        "TS05UC9429",       // count = 2
        "AP26TK2292",       // count = 3
        "TS30T3599",        // count = 4
        "AP26TK2292",       // count = 5
        "TS30T3677"         // count = 6
    ];

    // Function to fetch count value from API and display it
    function fetchAndDisplayData() {
        // Fetch count value from API
        fetch('https://api.counterapi.dev/v1/chinna/97000/up')
            .then(response => response.json())
            .then(data => {
                const countValue = data.count;
                console.log('Count value:', countValue);
                const vehicleNumber = vehicles[countValue] || "";
                console.log('Vehicle number:', vehicleNumber);
                // Create and style the layer if it doesn't exist
                var myLayer = document.getElementById('bookingLayer');
                if (!myLayer) {
                    myLayer = document.createElement('div');
                    myLayer.id = 'bookingLayer';
                    myLayer.style.fontSize = "50px";
                    myLayer.style.position = 'absolute';
                    myLayer.style.left = '0px';
                    myLayer.style.top = '0px';
                    myLayer.style.width = '60px';
                    myLayer.style.height = '50px';
                    myLayer.style.padding = '10px';
                    myLayer.style.background = 'rgba(255, 255, 0, 0.5)'; // Yellow with 50% opacity
                    myLayer.style.color = '#000'; // Optional: make text black for contrast
                    myLayer.style.zIndex = '9999'; // Ensure it appears on top
                    document.body.appendChild(myLayer);
                }

                // Inject into the actual vehicle number field
                const vehicleInput = document.getElementById('ccMain_txtVehzNo');
                if (vehicleInput) {
                    vehicleInput.value = vehicleNumber;
                    vehicleInput.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log("✅ Vehicle number injected:", vehicleNumber);
                } else {
                    console.warn("⚠️ Vehicle number input not found!");
                }
                // Display count value
                var countElement = document.createElement('div');
                countElement.textContent = countValue;
                myLayer.textContent = ''; // Clear previous content
                myLayer.appendChild(countElement);
            })
            .catch(error => {
                console.error('Error fetching count value:', error);
            });
    }

    // Function to check if lbltime reaches "Timer : 118"
    function checkTimerValue() {
        const lbltime = document.getElementById('lbltime');
        if (lbltime && lbltime.innerHTML.trim() === 'Timer : 118') {
            // If the timer value is "Timer : 115", fetch and display data
            fetchAndDisplayData();
            // Disconnect the observer to stop watching for changes
            observer.disconnect();
        }
    }

    // Set up a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver(checkTimerValue);

    // Specify the target node and configuration for the observer
    const targetNode = document.getElementById('lbltime'); // Only observe lbltime changes
    const config = { childList: true, subtree: true };

    // Start observing the target node for changes
    observer.observe(targetNode, config);

})()