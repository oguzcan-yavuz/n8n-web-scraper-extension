# Frontend Core

## Architecture
- Context menus in `background.js` trigger `content.js` via `chrome.tabs.sendMessage`.
- `content.js` manages state (timers, overlays) and network requests to n8n.
- UI is vanilla JS DOM manipulation with injected CSS.
- Configuration stored in `chrome.storage.sync`.

## Key Files
- `content.js`: Extraction logic, fetch, and UI.
- `background.js`: Menu setup and message routing.
- `options.js`: Storage management.

## State Management
- `analysisTimerInterval`: Global variable in `content.js` tracking the duration of the current analysis.
- Webhook URL retrieved from `chrome.storage.sync` via `getWebhookUrl()`.
