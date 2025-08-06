// ==UserScript==
// @name         Sand Bazar - Fill Booking Form Autofill
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Auto-fill Telangana Sand Booking form with cascading dropdown waits and reload protection
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/SandBazaarBookingNew.aspx
// @grant        none
// @author       API Maker
// ==/UserScript==

(function () {
    'use strict';

    // GLOBAL CONFIGURATION
    const area= 'Adibatla SB Fine'; // Change this to your target area
    const vehicleNumber = 'TS30T3599'; 
    const address = "Narahari's Address"; // Change this to your address
    const purposeValue = "2"; // Commercial purpose
    const quantityValue = "32";
    const districtValue = "16"; // Hyderabad
    const mandalValue = "82";
    const villageValue = "167"; // Adjust if needed
    const paymentMode = 'PAYU'; // Payment mode


    window.confirm = function (msg) {
        console.log('Intercepted confirm:', msg);
        return true;
    };


    // Helper: Trigger native change event on element
    function triggerChange(element) {
        const event = new Event('change', { bubbles: true });
        element.dispatchEvent(event);
    }

    // Helper: Wait until dropdown has more than minOptions options
    function waitForOptions(selector, minOptions, timeout = 1500) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const interval = setInterval(() => {
                const select = document.querySelector(selector);
                if (select && select.options.length > minOptions) {
                    clearInterval(interval);
                    resolve();
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(interval);
                    reject(new Error(`Timeout waiting for options: ${selector}`));
                }
            }, 200);
        });
    }

    // Check if the detail panel (stockyard detail) is loaded by presence of Stockyard label text
    function isDetailPanelLoaded() {
        const stockyardName = document.querySelector('#MainContent_lblStockyardName');
        return stockyardName && stockyardName.innerText.trim().length > 0;
    }

    // The main autofill flow
    async function autoFillSandBooking() {
        // Prevent infinite autofill loop
        if (sessionStorage.getItem('sandAutoFilled') === 'yes') {
            console.log("✅ Autofill already done, skipping further execution.");
            return;
        }

        // Step 1: Select Sand Bazaar row if detail panel not loaded
        if (!isDetailPanelLoaded()) {
            const rows = document.querySelectorAll('#gvStockyard tr');
            let clicked = false;
            for (const row of rows) {
                if (row.innerText.includes(area) && row.querySelector('a')) {
                    console.log(`🟢 Found target Sand Bazaar row: ${area}`);
                    console.log("🟢 Clicking 'Select' for Adibatla SB Fine to load details.");
                    row.querySelector('a').click();
                    clicked = true;
                    break;
                }
            }
            if (clicked) {
                try {
                    console.log("⏳ Waiting for detail panel to load...");
                    await waitForOptions('#MainContent_ddlDistrict', 1, 1500); // Wait for district dropdown presence
                    console.log("✅ Detail panel loaded.");
                } catch (e) {
                    console.error("❌ Detail panel load timed out.", e);
                    return;
                }
            } else {
                console.warn("⚠️ Target Sand Bazaar row not found.");
                return;
            }
        }

        // Step 2: Fill form fields including cascading selects

        // Select Purpose of Sand = Commercial (value "2")
        const purposeSelect = document.querySelector('#MainContent_ddlsandpurpose');
        if (purposeSelect) {
            purposeSelect.value = purposeValue;
        }

        // Select Quantity = 32 (value "32")
        const quantitySelect = document.querySelector('#MainContent_ddlQuantity');
        if (quantitySelect) {
            quantitySelect.value = quantityValue;
            triggerChange(quantitySelect);
        }

        // Vehicle Number
        const vehicleInput = document.querySelector('#MainContent_txtVehicelNo');
        if (vehicleInput) {
            vehicleInput.value = vehicleNumber;
        }

        // Cascading selection: District (value="16" for Hyderabad here)
        const districtSelect = document.querySelector('#MainContent_ddlDistrict');
        if (!districtSelect) {
            console.error("District dropdown not found.");
            return;
        }
        districtSelect.value = districtValue;
        triggerChange(districtSelect);

        // Wait for Mandal options to load (>82 options expected)
        try {
            await waitForOptions('#MainContent_ddlMandal', mandalValue, 1500);
        } catch (e) {
            console.warn("Timeout or error waiting for Mandal options", e);
        }

        // Select Mandal with value "82" (adjust if needed)
        const mandalSelect = document.querySelector('#MainContent_ddlMandal');
        if (!mandalSelect) {
            console.error("Mandal dropdown not found.");
            return;
        }
        mandalSelect.value = mandalValue
        triggerChange(mandalSelect);

        // Wait for Village options to load (>167 options expected)
        try {
            await waitForOptions('#MainContent_ddlVillage', 1500, villageValue);
        } catch (e) {
            console.warn("Timeout or error waiting for Village options", e);
        }

        // Select Village with value "167" (adjust if needed)
        const villageSelect = document.querySelector('#MainContent_ddlVillage');
        if (!villageSelect) {
            console.error("Village dropdown not found.");
            return;
        }
        villageSelect.value = villageValue;
        triggerChange(villageSelect);

        // Address
        const addressInput = document.querySelector('#MainContent_txtAddress');
        if (addressInput) {
            addressInput.value = address;
        }

        // Payment Mode = PAYU
        const payuRadio = document.querySelector('input[name="ctl00$MainContent$rbtPG"][value="PAYU"]');
        if (payuRadio) {
            payuRadio.checked = true;
        }

        console.log("✅ All fields filled. Ready to submit.");
const allFieldsFilled =
    purposeSelect && purposeSelect.value === purposeValue &&
    quantitySelect && quantitySelect.value === quantityValue &&
    vehicleInput && vehicleInput.value &&
    districtSelect && districtSelect.value === districtValue &&
    mandalSelect && mandalSelect.value === mandalValue &&
    villageSelect && villageSelect.value === villageValue &&
    addressInput && addressInput.value &&
    payuRadio && payuRadio.checked;

    console.log("All fields filled:", allFieldsFilled);

    if (allFieldsFilled) {
    setTimeout(() => {
        const submitBtn = document.querySelector('#MainContent_btnRegister');
        if (submitBtn) {
            submitBtn.click();
            console.log("🚀 Submit button clicked automatically.");
        } else {
            console.error("❌ Submit button not found!");
        }
    }, 1000);
} else {
    console.warn("⚠️ Some fields missing, not submitting form.");
}

        // Set flag so script doesn't rerun endlessly
        sessionStorage.setItem('sandAutoFilled', 'yes');
        console.log("✅ Form fields filled successfully.");
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            autoFillSandBooking()
                .catch(e => console.error("Error during autofill:", e));
        }, 1500);
    });

})();
