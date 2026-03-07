# n8n web scraper extension - Project Context

## Overview
This project is a Chrome Extension (Manifest V3) paired with an n8n + Gemini backend. It provides users with right-click context menu tools to analyze web content using AI. The core features currently include a Real Estate Ad Analyzer and a two-tier Bullshit/Discourse Detector (Macro Thread Analysis and Targeted Claim Analysis).

## 1. Extension Architecture (Frontend)
The extension is designed to handle long-running AI tasks (60-90+ seconds) without falling victim to Chrome's Manifest V3 Service Worker timeouts.

* **`manifest.json`:** Uses Manifest V3. Permissions: `contextMenus`, `storage`. Host permissions for `<all_urls>`. Loads `content.js` and `marked.min.js` into all pages via `content_scripts`.
* **`background.js` (The Router):** Extremely lightweight. Creates three context menus (`analyze-property`, `detect-bs-thread`, `detect-bs-targeted`). On click, it sends a message (`chrome.tabs.sendMessage`) to the active tab's content script with the action type and any highlighted text.
* **`content.js` (The Engine):** * Runs in the active tab to bypass Service Worker lifecycle limits.
    * Extracts DOM data (`document.body.innerText`) without truncation.
    * Retrieves the n8n Webhook URL from `chrome.storage.sync`.
    * Executes the `fetch` request to n8n.
    * Injects a floating, shadow-styled UI overlay into the DOM to render the AI's Markdown response.
    * Features an active `setInterval` timer (e.g., `⏳ Running analysis... (45s)`) that ticks while waiting for the n8n response.
* **`options.html` & `options.js` (Configuration):** Provides a UI for the user to securely save their n8n Production Webhook URL to Chrome Sync Storage, avoiding hardcoded URLs in the source code.

## 2. n8n Backend Architecture
The backend is a single n8n workflow that routes requests based on the `action` payload.

* **Webhook Trigger:** Set to `POST`. Crucially, "Respond to CORS Preflight" is **ENABLED** (required because `content.js` makes the request from the context of external websites like Reddit/Twitter). "Respond" is set to "Using 'Respond to Webhook' Node".
* **Payload Schema:**
    ```json
    {
      "action": "detect-bs-targeted", // or "analyze-property", "detect-bs-thread"
      "source": "Chrome Extension",
      "listingUrl": "...",
      "pageTitle": "...",
      "content": "...", // The highlighted text OR full page text
      "pageContext": "..." // Full page text (if targeted) or empty
    }
    ```
* **Switch Node (The Router):** Placed immediately after the Webhook. It inspects `{{ $json.body.action }}` and routes the payload to the appropriate AI model path:
    * **Path 1 (`analyze-property`):** Routes to the Real Estate Analyzer AI Node.
    * **Path 2 (`detect-bs-thread`, `detect-bs-targeted`):** Routes to the BS Detector AI Node.

* **BS Detector AI Node (Gemini):** * Has the "Google Search" tool enabled for live fact-checking.
    * **System Prompt:** Instructs the AI on formal logic, cognitive biases, and explicitly requires grading arguments using **Paul Graham's Hierarchy of Disagreement**. Also mandates the calculation of a mathematical **Discourse Quality Score (DQS)** out of 10.
    * **User Prompt (Dynamic):** Uses an n8n ternary expression (`{{ $json.body.action === 'detect-bs-targeted' ? 'TARGETED...' : 'MACRO...' }}`) to swap instructions and required Markdown headers based on whether it is a specific highlight or a whole thread.

* **Parallel Execution & Output Routing:** * **Respond to Webhook (Always runs):** Both AI paths eventually merge or individually route to a "Respond to Webhook" node, returning `{ "text": "{{ $json.text }}" }` to the Chrome extension UI.
    * **Notion Integration (Conditional):** If the action is `analyze-property`, the workflow splits and routes the data to a Notion HTTP Request node to silently log the real estate analysis to a database. The BS detector outputs are NOT saved to Notion.

## 3. Known Quirks & Design Decisions
* **Why Content Scripts for Fetch:** Service Workers die after ~30 seconds of inactivity. LLM analysis of massive DOMs takes 60-90 seconds. Moving the `fetch` to `content.js` tethers the network request to the active tab, preventing silent `504` timeouts.
* **DOM Injection over React/Vue:** The UI is vanilla JS injecting a `div` and a `<style>` tag directly into the page. This keeps the extension exceptionally lightweight.
* **Update Handling:** If the extension updates, previously opened tabs will throw a "Receiving end does not exist" error until they are hard-refreshed, because the new `content.js` hasn't been injected into the stale DOM yet.
