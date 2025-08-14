from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import base64
import time
import os

# Create folder if not exists
os.makedirs("captchas", exist_ok=True)

driver = webdriver.Chrome()
driver.get("https://sand.telangana.gov.in/TGSandBazaar/CommonPages/BEZLoginPage.aspx")  # Replace with actual page URL

for i in range(1000):
    try:
        # Wait for captcha image to be present
        captcha_img = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "MainContent_imgCaptcha"))
        )

        # Get base64 data from <img> src
        captcha_base64 = captcha_img.get_attribute("src")
        if captcha_base64.startswith("data:image"):
            img_data = base64.b64decode(captcha_base64.split(",")[1])
            with open(f"captchas/captcha_{i}.png", "wb") as f:
                f.write(img_data)
            print(f"[✅] Saved captcha_{i}.png")
        else:
            print("[⚠️] No captcha found!")

        # Click refresh button
        refresh_btn = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "MainContent_btnRefresh"))
        )
        refresh_btn.click()

        # Small delay to let new captcha load
        time.sleep(1)

    except Exception as e:
        print(f"[❌] Error at captcha {i}: {e}")
        break

driver.quit()
