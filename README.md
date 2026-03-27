# n8n Web Scraper Extension

A Chrome browser extension that provides AI-powered content analysis via right-click context menus. It integrates with [n8n](https://n8n.io) workflow automation and Google Gemini AI to analyze web pages, detect logical fallacies, and perform deep-dive analysis — all rendered inline as a floating overlay.

## Features

- **Real Estate Analysis** — Analyze property listings for patterns and insights
- **BS Detector** — Detect logical fallacies and rhetorical tricks in selected text or entire pages
- **Hacker News Deep Dive** — Analyze HN articles and comment threads, including the original linked article
- **Floating Overlay UI** — Markdown-rendered results injected directly into the page, no popup required
- **Live Timer** — Shows elapsed time while waiting for AI responses (up to 90 seconds)
- **Configurable Webhook** — Connects to your own n8n instance via a user-defined webhook URL

## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked** and select the extension directory
5. The extension icon appears in your Chrome toolbar

## Configuration

Before using the extension, you need to point it at your n8n webhook:

1. Right-click the extension icon → **Options** (or navigate to the extension's options page)
2. Enter your n8n Production Webhook URL
3. Click **Save Configuration**

The URL is saved to Chrome Sync Storage, so it syncs across your signed-in Chrome devices.

## Usage

| Action | How to trigger |
|---|---|
| Analyze Real Estate Ad | Right-click anywhere on the page |
| Analyze Entire Thread | Right-click anywhere on the page |
| Detect BS in Selected Text | Highlight text, then right-click |
| Deep Dive HN Article / Comments | Right-click on a Hacker News page |

Results appear in a floating dark overlay. Click **✕** to dismiss it.

## Backend Setup (n8n)

Your n8n webhook must:

- Have **Respond to CORS Preflight** enabled
- Route on an `action` field in the JSON body:
  - `analyze-property` — real estate analysis
  - `detect-bs-thread` — full page BS detection
  - `detect-bs-targeted` — targeted BS detection on selected text

The extension sends a JSON payload containing `action`, `content` (page HTML/text), and optionally `selectedText`.

A Google Gemini AI node with Google Search tool enabled is recommended for best results. An optional Notion integration can log real estate analyses to a database.

## Architecture

```
manifest.json      # Chrome MV3 extension config
background.js      # Service worker — registers context menus, routes actions
content.js         # Injected into pages — sends requests to n8n, renders overlay
options.html/js    # Settings page for webhook URL
marked.min.js      # Bundled Markdown parser
```

**Why content scripts handle fetch calls:** Chrome Service Workers time out after ~30 seconds. By delegating the network request to `content.js` (which runs in the page context), the extension can handle AI responses that take 60–90+ seconds.

## Requirements

- Google Chrome (Manifest V3 compatible)
- A running n8n instance with a configured webhook workflow
- A Google Gemini API key configured in your n8n workflow
