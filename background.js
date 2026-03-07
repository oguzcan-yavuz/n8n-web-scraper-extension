importScripts('marked.min.js');

// 1. Setup the Unified Right-Click Menu
chrome.runtime.onInstalled.addListener(() => {
  // Option A: Real Estate (Shows on page background)
  chrome.contextMenus.create({
    id: "analyze-property",
    title: "🏠 Analyze Real Estate Ad",
    contexts: ["page"] 
  });

  // Option B: Thread Analyzer (Shows on page background)
  chrome.contextMenus.create({
    id: "detect-bs-thread",
    title: "🕵️ Analyze Entire Thread",
    contexts: ["page"]
  });

  // Option C: Targeted BS (Shows ONLY when text is highlighted)
  chrome.contextMenus.create({
    id: "detect-bs-targeted",
    title: "🔎 Detect BS in Selected Text",
    contexts: ["selection"]
  });
});

// 2. The Unified Click Handler
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Show the loading UI immediately
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: showLoadingOverlay
  });

  // Handle the different menu actions
  if (info.menuItemId === "analyze-property" || info.menuItemId === "detect-bs-thread") {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => document.body.innerText
    }, async (results) => {
      const fullText = results[0] ? results[0].result : "";
      const htmlContent = await processWithN8n(info.menuItemId, fullText, "", tab.url, tab.title);
      updateOverlay(tab.id, htmlContent);
    });
    
  } else if (info.menuItemId === "detect-bs-targeted") {
    const selectedText = info.selectionText;
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => document.body.innerText
    }, async (results) => {
      const pageContext = results[0] ? results[0].result : "";
      const htmlContent = await processWithN8n(info.menuItemId, selectedText, pageContext, tab.url, tab.title);
      updateOverlay(tab.id, htmlContent);
    });
  }
});

// Helper to inject the updated HTML content back into the overlay
function updateOverlay(tabId, htmlContent) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    func: (html) => {
      const contentDiv = document.getElementById("n8n-content");
      if (contentDiv) contentDiv.innerHTML = html;
    },
    args: [htmlContent]
  });
}

// 3. The n8n Sender Function
async function processWithN8n(actionType, targetText, contextText, url, title) {
  const webhookUrl = "http://localhost:5678/webhook/21cdf2aa-6f97-4fe4-b886-334858415a39";
  // test url
  // const webhookUrl = "http://localhost:5678/webhook-test/21cdf2aa-6f97-4fe4-b886-334858415a39";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: actionType, // "analyze-property", "detect-bs-thread", or "detect-bs-targeted"
        source: "Chrome Extension",
        listingUrl: url,
        pageTitle: title,
        content: targetText,
        pageContext: contextText 
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return marked.parse(data.text || JSON.stringify(data)); 

  } catch (error) {
    console.error("Error from n8n:", error);
    return marked.parse("❌ **Error connecting to n8n.** Check the console.");
  }
}

// --- INJECTED UI FUNCTIONS ---
// This runs inside the context of the actual web page
function showLoadingOverlay() {
  // If it already exists, just reset the text to loading
  if (document.getElementById("n8n-analysis-overlay")) {
    document.getElementById("n8n-content").innerHTML = "⏳ Running analysis...";
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "n8n-analysis-overlay";
  
  Object.assign(overlay.style, {
    position: "fixed", top: "20px", right: "20px", width: "450px", maxHeight: "85vh",
    backgroundColor: "#1e1e1e", color: "#e0e0e0", borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: "999999", padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "14px",
    lineHeight: "1.6", overflowY: "auto", border: "1px solid #333"
  });

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
      <h3 style="margin: 0; font-size: 16px; color: #fff;">AI Analysis</h3>
      <button id="n8n-close-btn" style="background: none; border: none; color: #888; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div id="n8n-content" class="n8n-markdown-container">⏳ Running analysis...</div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .n8n-markdown-container h1, .n8n-markdown-container h2, .n8n-markdown-container h3 { color: #fff; margin-top: 1em; margin-bottom: 0.5em; }
    .n8n-markdown-container h2 { border-bottom: 1px solid #444; padding-bottom: 5px; }
    .n8n-markdown-container ul, .n8n-markdown-container ol { margin-left: 20px; margin-bottom: 1em; }
    .n8n-markdown-container p { margin-bottom: 1em; }
    .n8n-markdown-container strong { color: #fff; }
  `;
  document.head.appendChild(style);
  document.body.appendChild(overlay);

  document.getElementById("n8n-close-btn").addEventListener("click", () => overlay.remove());
}

