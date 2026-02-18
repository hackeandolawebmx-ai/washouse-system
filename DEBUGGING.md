# Debugging Guide for Laundry Platform

This guide outlines systematic strategies for troubleshooting issues in the React + Vite + Tailwind application.

## 1. Core Debugging Workflow

### Phase 1: Reproduce
*   **Isolate**: Can you reproduce the issue on a clean shift?
*   **Minimal Repro**: If possible, create a minimal React component that demonstrates the bug.
*   **Environment**: Does it happen in local dev (`npm run dev`) only or also in build (`npm run build && npm run preview`)?

### Phase 2: Analyze
*   **Console Logs**: Check Browser Console (F12) for React errors or Network failures.
*   **Network Tab**: Verify API requests to `localStorage` or external services.
*   **React DevTools**: Inspect Component Hierarchy and State/Props.

## 2. Specific Strategies

### React Component Issues
*   **State Issues**: Use React DevTools to view state changes.
*   **Re-renders**: Enable "Highlight updates when components render" in React DevTools to find performance bottlenecks.
*   **Context**: Verify `AuthProvider` or `StorageContext` values if data isn't propagating.

### Styling Issues (Tailwind)
*   **Inspection**: Use Element Inspector to see computed styles.
*   **Class Conflicts**: Check for `!important` overrides or conflicting utility classes.
*   **Responsive**: Use Device Mode to test breakpoints defined in `index.css` (fluid variables).

### Logic & Data
*   **Rubber Ducking**: Explain the logic to a colleague or writes it down.
*   **Logging**: Use `console.log` strategically (remove before commit) or `debugger;` statement to pause execution.

## 3. Common Issues & Fixes
*   **White Screen / Crash**: Usually an unhandled JS error. Check console. Wrap components in ErrorBoundaries.
*   **Build Errors**: Check strict mode in `vite.config.js` or dependency version mismatches.
*   **Hot Reload Failing**: Restart the dev server (`npm run dev`).

## 4. Tools
*   **VS Code Debugger**: Configure `.vscode/launch.json` for debugging Chrome directly from VS Code.
*   **Playwright**: Run E2E tests (`python tests/e2e.py`) to verify critical flows work as expected.
