# Backend Core

## n8n Integration
- Webhook URL is dynamic, provided by the user in the Options page.
- Action-based routing via `action` field in the JSON payload.
- Backend handles CORS Preflight (required for `content.js` fetch).

## Payload Schema
```json
{
  "action": "...",
  "source": "Chrome Extension",
  "listingUrl": "...",
  "pageTitle": "...",
  "content": "...",
  "pageContext": "..."
}
```

## AI Logic
- AI instructions vary by action.
- Property analysis routes to real estate specific model.
- BS detector uses Gemini with Google Search tool.
