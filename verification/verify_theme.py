import os
from playwright.sync_api import sync_playwright

def verify_theme():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate
        print("Navigating to http://localhost:3007")
        page.goto("http://localhost:3007")
        page.wait_for_load_state("networkidle")

        # 0. Initialize Research
        if page.is_visible("button:has-text('Initialize Research')"):
            print("Clicking 'Initialize Research'...")
            page.click("button:has-text('Initialize Research')")
            page.wait_for_selector("text=Theoretical Physics")

        # 1. Select Field (Physics -> Violet)
        print("Selecting Physics...")
        page.click("text=Theoretical Physics")

        # 2. Select Task
        print("Selecting Task...")
        page.click("text=Literature Review")

        # 3. Select Model
        print("Selecting Model...")
        # Assuming the model selection might be multi-select or single, usually just clicking it works if it's visible.
        # If it's already selected or not needed, we might need to adjust.
        # Based on previous context, user selects models then launches.
        if page.is_visible("text=Gemini 2.5 Flash"):
            page.click("text=Gemini 2.5 Flash")

        # 4. Launch
        print("Launching Workspace...")
        page.click("button:has-text('Launch Workspace')")

        # Wait for Chat Interface
        print("Waiting for Chat Interface...")
        page.wait_for_selector("text=SILLOGIC INTELLIGENCE")

        # Take Screenshot
        os.makedirs("verification", exist_ok=True)
        screenshot_path = "verification/final_refactor_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        # Optional: Check computed style of the title "Theoretical Physics" or "SILLOGIC INTELLIGENCE"
        # In the chat interface, the title is usually displayed.
        # Let's check for the presence of a violet-colored element which confirms the theme.
        # The title 'Theoretical Physics' should be in the header.
        title_locator = page.locator("h2:has-text('Theoretical Physics')").first
        if title_locator.count() > 0:
            color = title_locator.evaluate("element => getComputedStyle(element).color")
            print(f"Title Color: {color}")
            # Violet-400 is roughly rgb(167, 139, 250)
        else:
            print("Could not find 'Theoretical Physics' header in workspace.")

        browser.close()

if __name__ == "__main__":
    verify_theme()
