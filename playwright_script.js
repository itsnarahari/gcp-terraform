// run.js
const { chromium } = require('playwright');

(async () => {
  const instances = 5; // You can change to 24

  for (let i = 0; i < instances; i++) {
    (async () => {
      const browser = await chromium.launch({ headless: false }); // false = visible
      const context = await browser.newContext();
      const page = await context.newPage();

      // Step 1: Open first page
      await page.goto('https://ssotp3.online/');
      await page.waitForTimeout(5000);

      // Step 2: Go to final page
      await page.goto('https://sand.telangana.gov.in/TGSandBazaar/Masters/OuterHome.aspx');

      // Step 3: Wait and inject your logic
      await page.waitForTimeout(2000);

      await page.evaluate(() => {
        (function () {
          try {
            document.getElementsByClassName('Dropdown')[0].value = 24;
            PopulateGrid(24);

            const intId = setInterval(() => {
              for (let i = 0; i < 30; i++) {
                const row = document.getElementsByClassName("GridviewScrollItem")[i];
                if (!row) continue;
                const data = row.cells[2].innerHTML;
                if (data.includes("Veerapuram De-Siltation(2025)")) {
                  document.querySelectorAll("input[type='radio']")[i].click();
                  clearInterval(intId);
                  alert("Auto-selected Veerapuram ✅");
                  break;
                }
              }
            }, 1500);
          } catch (e) {
            console.error("Script error:", e);
          }
        })();
      });
    })();
  }
})();
