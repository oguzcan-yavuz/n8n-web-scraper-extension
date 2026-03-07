// 1. Setup the Right-Click Menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "analyze-property", title: "🏠 Analyze Real Estate Ad", contexts: ["page"] });
  chrome.contextMenus.create({ id: "detect-bs-thread", title: "🕵️ Analyze Entire Thread", contexts: ["page"] });
  chrome.contextMenus.create({ id: "detect-bs-targeted", title: "🔎 Detect BS in Selected Text", contexts: ["selection"] });
});

// 2. Pass the action to the Content Script
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Send a message to the content.js running in the active tab
  chrome.tabs.sendMessage(tab.id, {
    action: info.menuItemId,
    selectedText: info.selectionText || ""
  });
});
