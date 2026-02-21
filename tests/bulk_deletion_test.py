from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # 1. Setup Auth & navigating to admin/staff
        page.goto("http://localhost:5173/")
        
        # Set admin user
        user_data = '{"name":"Admin","role":"admin"}'
        page.evaluate(f"localStorage.setItem('washouse_user', '{user_data}')")
        
        # Go to staff management
        print("Navigating to /admin/staff...")
        page.goto("http://localhost:5173/admin/staff")
        page.wait_for_timeout(1000)

        # 2. Check if bulk selection works
        print("Testing bulk selection...")
        # Check all
        page.locator("th input[type='checkbox']").click()
        
        # Check if "Eliminar" button appears
        delete_btn = page.get_by_text("Eliminar (", exact=False)
        if delete_btn.is_visible():
            print("SUCCESS: Bulk delete button visible after selection.")
            print(f"Text: {delete_btn.inner_text()}")
        else:
            print("FAILURE: Bulk delete button NOT visible.")
            page.screenshot(path="bulk_delete_fail.png")
            browser.close()
            return

        # 3. Test deletion cancellation
        print("Testing deletion cancellation...")
        page.once("dialog", lambda dialog: dialog.dismiss())
        delete_btn.click()
        print("Dismissed confirmation dialog.")

        # 4. Test actual deletion (we mock the dialog to accept)
        # Note: In a real test we'd check count before/after
        print("Testing bulk deletion execution...")
        page.once("dialog", lambda dialog: dialog.accept())
        delete_btn.click()
        
        page.wait_for_timeout(500)
        print("Accepted confirmation dialog.")

        # Take final screenshot
        page.screenshot(path="staff_after_deletion.png")
        print("Screenshot saved to staff_after_deletion.png")

        browser.close()

if __name__ == "__main__":
    run()
