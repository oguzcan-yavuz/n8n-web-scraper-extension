// 1. Setup the Right-Click Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "analyze-property", title: "🏠 Analyze Real Estate Ad", contexts: ["page"] });
  chrome.contextMenus.create({ id: "detect-bs-thread", title: "🕵️ Analyze Entire Thread", contexts: ["page"] });
  chrome.contextMenus.create({ id: "detect-bs-targeted", title: "🔎 Detect BS in Selected Text", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "analyze-hn-full", title: "🧠 Deep Dive HN Article / Comments", contexts: ["page"] });
});

// 2. Pass the action to the Content Script
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Send a message to the content.js running in the active tab
  chrome.tabs.sendMessage(tab.id, {
    action: info.menuItemId,
    selectedText: info.selectionText || ""
  });
});

// 3. Handle image fetching and conversion to Base64 (Bypassing CORS)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetch-images-base64') {
    fetchImagesAsBase64(request.urls).then(images => {
      sendResponse({ images });
    });
    return true; // Keep the message channel open for async response
  }
});

async function fetchImagesAsBase64(urls) {
  const fetchPromises = urls.map(async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);
      return base64;
    } catch (error) {
      console.error(`Failed to fetch image ${url}:`, error);
      return null;
    }
  });

  const results = await Promise.all(fetchPromises);
  return results.filter(img => img !== null);
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return `data:${blob.type};base64,${base64}`;
}
