import re
from playwright.sync_api import sync_playwright
import time
import sys

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Try to connect to localhost:5173
        try:
            page.goto("http://localhost:5173")
            print(f"Page title: {page.title()}")
            
            # Check for main elements
            if page.get_by_text("Panel de Control").is_visible():
                print("SUCCESS: 'Panel de Control' text found.")
            else:
                print("WARNING: 'Panel de Control' text not found.")
                
            page.screenshot(path="e2e_screenshot.png")
            print("Screenshot saved to e2e_screenshot.png")
            
        except Exception as e:
            print(f"Error accessing page: {e}")
            sys.exit(1)
            
        browser.close()

if __name__ == "__main__":
    run()
