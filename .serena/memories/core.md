# Core

## Project Map
- `manifest.json`: Manifest V3. Permissions: `contextMenus`, `storage`. Host permissions: `<all_urls>`.
- `background.js`: Service worker. Handles context menu creation and event routing.
- `content.js`: Main logic for data extraction and n8n communication. Injected into all pages.
- `options.html`/`options.js`: Configuration UI for n8n Webhook URL.
- `marked.min.js`: Markdown parsing library.

## Project-Wide Invariants
- Extension targets real estate sites (sahibinden, funda, etc.).
- Long-running tasks (>30s) are handled in `content.js` to avoid Service Worker timeouts.
- All AI responses are rendered as Markdown in a shadow-styled overlay injected by `content.js`.

## Domain Overviews
- Extension Frontend: `mem:frontend/core`
- Backend Integration: `mem:backend/core`
- Conventions: `mem:conventions`
