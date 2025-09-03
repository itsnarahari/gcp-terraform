// ==UserScript==
// @name         Sand Bazar - 2nd Attempt Script Fill Booking Form Autofill
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Auto-fill Telangana Sand Booking form with cascading dropdown waits and reload protection
// @match        https://sand.telangana.gov.in/TGSandBazaar/InnerPages/SandBazaarBookingNew.aspx
// @grant        none
// @author       API Maker
// ==/UserScript==

(function () {
  "use strict";

  // GLOBAL CONFIGURATION
  const area = "Adibatla SB Coarse"; // Change this to your target area
  const vehicleNumber = "TS30T3599";
  const address = "ZAHEERABAD"; // Change this to your address
  const purposeValue = "2"; // Commercial purpose
  const quantityValue = "32.00";
  const districtValue = "15"; // Hyderabad
  const mandalValue = "74";
  const villageValue = "108"; // Adjust if needed
  const paymentMode = "PAYU"; // Payment mode
  const DROPDOWN_WAIT_INTERVAL = 5; // ms between checks for dropdown options
  const quantityCandidates = ["32.00", "32"]; // Could add more if needed

  window.confirm = function (msg) {
    return true;
  };

  const originalAlert = window.alert;

  window.alert = function (msg) {
    const lowerMsg = msg.toLowerCase();

    const knownErrors = [
      "stockyard is not active",
      "quantity is less",
      "other orders in queue",
      "please try after some time",
      "another order was in queue for booking with this vehicle no",
    ];

    if (knownErrors.some((err) => lowerMsg.includes(err))) {
      setTimeout(() => {
        window.location.href =
          "https://sand.telangana.gov.in/TGSandBazaar/InnerPages/SandBazaarBookingNew.aspx";
      }, 0);
    } else {
      originalAlert(msg); // Show alert normally for other messages
    }
  };

  // Helper: Trigger native change event on element
  function triggerChange(element) {
    const event = new Event("change", { bubbles: true });
    element.dispatchEvent(event);
  }

  // Helper: Keep checking until dropdown has more than minOptions options (no timeout)
  function waitForOptions(selector, minOptions) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        const select = document.querySelector(selector);
        if (select && select.options.length > minOptions) {
          clearInterval(interval);
          resolve();
        }
      }, DROPDOWN_WAIT_INTERVAL);
    });
  }

  // Check if the detail panel (stockyard detail) is loaded by presence of Stockyard label text
  function isDetailPanelLoaded() {
    const stockyardName = document.querySelector(
      "#MainContent_lblStockyardName"
    );
    return stockyardName && stockyardName.innerText.trim().length > 0;
  }

  // The main autofill flow
  async function autoFillSandBooking() {
    // Prevent infinite autofill loop
    if (sessionStorage.getItem("sandAutoFilled") === "yes") {
      return;
    }

    // Step 1: Select Sand Bazaar row if detail panel not loaded
    if (!isDetailPanelLoaded()) {
      const rows = document.querySelectorAll("#gvStockyard tr");
      let clicked = false;
      for (const row of rows) {
        if (row.innerText.includes(area) && row.querySelector("a")) {
          row.querySelector("a").click();
          clicked = true;
          break;
        }
      }
      if (clicked) {
        try {
          await waitForOptions("#MainContent_ddlDistrict", 1, 40); // Wait for district dropdown presence
        } catch (e) {
          return;
        }
      } else {
        return;
      }
    }

    // Step 2: Fill form fields including cascading selects

    // Select Purpose of Sand = Commercial (value "2")
    const purposeSelect = document.querySelector("#MainContent_ddlsandpurpose");
    if (purposeSelect) {
      purposeSelect.value = purposeValue;
    }

    // Select Quantity = 32 (value "32")
    const quantitySelect = document.querySelector("#MainContent_ddlQuantity");
    if (quantitySelect) {
      quantitySelect.value = quantityValue;
      triggerChange(quantitySelect);
    }

    // Find the current valid value present in the options
    let foundQuantityValue = null;
    if (quantitySelect) {
      for (const val of quantityCandidates) {
        if ([...quantitySelect.options].some((opt) => opt.value == val)) {
          foundQuantityValue = val;
          break;
        }
      }
      if (foundQuantityValue) {
        quantitySelect.value = foundQuantityValue;
        triggerChange(quantitySelect);
      }
    }

    // Vehicle Number
    const vehicleInput = document.querySelector("#MainContent_txtVehicelNo");
    if (vehicleInput) {
      vehicleInput.value = vehicleNumber;
    }

    function waitAndSelect(selector, value, interval = 5) {
      return new Promise((resolve) => {
        let retry = setInterval(() => {
          const select = document.querySelector(selector);
          if (
            select &&
            Array.from(select.options).some((o) => o.value == value)
          ) {
            select.value = value;
            triggerChange(select);
            clearInterval(retry);
            resolve(select);
          }
        }, interval);
      });
    }

    // Usage in your async autofill func:
    const districtSelect = document.querySelector("#MainContent_ddlDistrict");
    if (districtSelect) {
      districtSelect.value = districtValue;
      triggerChange(districtSelect);

      // This will now wait until Mandal is selected
      await waitAndSelect("#MainContent_ddlMandal", mandalValue);

      // Then wait until Village is selected
      await waitAndSelect("#MainContent_ddlVillage", villageValue);
    } else {
      return;
    }

    // Address
    const addressInput = document.querySelector("#MainContent_txtAddress");
    if (addressInput) {
      addressInput.value = address;
    }

    const payuRadio = document.querySelector(
      `input[name="ctl00$MainContent$rbtPG"][value="${paymentMode}"]`
    );
    if (payuRadio) {
      payuRadio.checked = true;
    }

    const mandalSelect = document.querySelector("#MainContent_ddlMandal");
    const villageSelect = document.querySelector("#MainContent_ddlVillage");
    const allFieldsFilled =
      purposeSelect &&
      purposeSelect.value === purposeValue &&
      quantitySelect &&
      quantitySelect.value === quantityValue &&
      vehicleInput &&
      vehicleInput.value &&
      districtSelect &&
      districtSelect.value === districtValue &&
      mandalSelect &&
      mandalSelect.value === mandalValue &&
      villageSelect &&
      villageSelect.value === villageValue &&
      addressInput &&
      addressInput.value &&
      payuRadio &&
      payuRadio.checked;

    if (allFieldsFilled) {
      const submitBtn = document.querySelector("#MainContent_btnRegister");
      if (submitBtn) {
        submitBtn.click();
      } else {
      }
    } else {
    }

    // Set flag so script doesn't rerun endlessly
    sessionStorage.setItem("sandAutoFilled", "yes");
  }

  window.addEventListener("load", () => {
    autoFillSandBooking();
  });
})();
