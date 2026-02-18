from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        
        # 1. Simulate Auth & Shift in LocalStorage
        # We need to set this BEFORE navigating to the page or immediately after
        page = context.new_page()
        
        # Go to root first to set storage (domain matching)
        page.goto("http://localhost:5173/")
        
        user_data = '{"name":"TestHost","role":"host"}'
        shift_data = '{"id":123,"status":"open","initialCash":0,"startTime":"2023-01-01T00:00:00.000Z","branchId":"main"}'
        
        page.evaluate(f"localStorage.setItem('washouse_user', '{user_data}')")
        page.evaluate(f"localStorage.setItem('washouse_shift', '{shift_data}')")
        
        # Mock navigator.serial to force UI to show the button (Robust)
        page.add_init_script("""
            Object.defineProperty(navigator, 'serial', {
                get: () => ({ requestPort: async () => {} }),
                configurable: true
            });
        """)
        
        # 2. Navigate to Service Reception where NewOrderWizard is used
        print("Navigating to /services...")
        page.goto("http://localhost:5173/services")
        
        # Verify injection
        is_serial_mocked = page.evaluate("'serial' in navigator")
        print(f"DEBUG: 'serial' in navigator? {is_serial_mocked}")
        
        # Wait for load
        page.wait_for_timeout(1000)
        
        # 3. Open New Order Wizard
        print("Opening New Order Wizard...")
        # Look for button with "Nueva Orden"
        page.get_by_text("Nueva Orden").click()
        
        # Wait for wizard
        page.wait_for_timeout(1000)
        if page.get_by_text("Datos del Cliente").is_visible():
            print("DEBUG: Wizard opened successfully (Step 1).")
            
            # Fill Customer Data
            print("Filling Customer Data...")
            page.get_by_placeholder("Ej. Juan Pérez").fill("Test User")
            page.get_by_placeholder("Ej. 811 123 4567").fill("1234567890")
            
            # Click Siguiente
            print("Clicking Siguiente...")
            # Siguiente button text might have icon, so use partial text or class if needed
            # But get_by_text("Siguiente") usually works if distinct
            page.get_by_text("Siguiente").click()
            
            page.wait_for_timeout(500)
            
        else:
            print("DEBUG: Wizard did NOT open.")
            page.screenshot(path="debug_wizard_fail.png")
            
        # 4. Activate Demo Mode
        print("Activating Scale Demo Mode (Step 2)...")
        print("Activating Scale Demo Mode...")
        
        # Check for "USB no soportado"
        if page.get_by_text("USB no soportado").is_visible():
             print("DEBUG: 'USB no soportado' is visible.")
        
        # Try finding by text "Demo"
        demo_btn = page.get_by_text("Demo", exact=True)
        
        if demo_btn.is_visible():
            demo_btn.click()
            print("Clicked Demo button (found by text).")
        else:
            print("Demo button NOT found by text.")
            # Dump content to find out what IS there
            print("DUMPING FILTERED HTML:")
            content = page.content()
            # simple filter to show only relevant part
            if "Datos del Cliente" in content:
                start = content.find("Datos del Cliente")
                print(content[start:start+2000])
            else:
                print("Could not find 'Datos del Cliente' in content dump.")
            
        # 5. Verify Scale Connection UI
            
        # 5. Verify Scale Connection UI
        # Check for "Báscula Conectada" text
        if page.get_by_text("Báscula Conectada").is_visible():
            print("SUCCESS: Scale connection text visible.")
        else:
            print("FAILURE: Scale connection text NOT visible.")

        # Wait for weight simulation to kick in
        page.wait_for_timeout(2000)

        # Check for the floating weight badge (green)
        # It contains "kg"
        weight_badge = page.locator("span:has-text('kg')").first
        if weight_badge.is_visible():
            text = weight_badge.inner_text()
            print(f"SUCCESS: Weight badge visible with value: {text}")
        else:
            print("FAILURE: Weight badge NOT visible.")
            
        # Take screenshot
        page.screenshot(path="scale_demo_test.png")
        print("Screenshot saved to scale_demo_test.png")

        browser.close()

if __name__ == "__main__":
    run()
