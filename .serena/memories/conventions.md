# Conventions

## Code Style
- Vanilla JS, no build step (ES6 modules not used in this project).
- Async/Await for promises.
- Terse UI injection (literal strings for HTML/CSS).
- Snake-case or Kebab-case for IDs/Classes in DOM.
- CamelCase for JS variables/functions.

## Error Handling
- Use `try/catch` around `fetch` and JSON parsing.
- Display errors to user via the overlay using `marked.parse("❌ **Error...**")`.

## Communication
- `background.js` -> `content.js`: `chrome.tabs.sendMessage`.
- `content.js` -> `background.js`: `chrome.runtime.sendMessage`.
