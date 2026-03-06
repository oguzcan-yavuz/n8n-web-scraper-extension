// 1. Import the bundled Marked.js library into the Service Worker
importScripts('marked.min.js');

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: showLoadingOverlay
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractPageText
  }, async (injectionResults) => {
    if (injectionResults && injectionResults[0]) {
      const rawText = injectionResults[0].result;
      
      // 2. Fetch the raw markdown from your n8n AI
      const rawMarkdown = await sendToN8n(rawText, tab.url, tab.title);
      
      // 3. Use the bundled library to parse the Markdown into HTML
      const htmlContent = marked.parse(rawMarkdown);
      
      // 4. Send the perfectly formatted HTML to the overlay
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: updateOverlayWithAnalysis,
        args: [htmlContent]
      });
    }
  });
});

function extractPageText() {
  return document.body.innerText;
}

async function sendToN8n(text, url, title) {
  // test url
  // const webhookUrl = "http://localhost:5678/webhook-test/21cdf2aa-6f97-4fe4-b886-334858415a39";
  const webhookUrl = "http://localhost:5678/webhook/21cdf2aa-6f97-4fe4-b886-334858415a39";

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "Chrome Extension",
        listingUrl: url,
        pageTitle: title,
        content: text
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data.text || JSON.stringify(data); 

  } catch (error) {
    console.error("Error from n8n:", error);
    return "❌ **Error connecting to n8n.** Check the console.";
  }
}

// --- INJECTED UI FUNCTIONS ---

function showLoadingOverlay() {
  if (document.getElementById("n8n-analysis-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "n8n-analysis-overlay";
  
  // Notice we added a few specific CSS resets here so Sahibinden's 
  // native CSS doesn't break the Markdown formatting.
  Object.assign(overlay.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "450px",
    maxHeight: "85vh",
    backgroundColor: "#1e1e1e",
    color: "#e0e0e0",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: "999999",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "14px",
    lineHeight: "1.6",
    overflowY: "auto",
    border: "1px solid #333"
  });

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
      <h3 style="margin: 0; font-size: 16px; color: #fff;">Listing Analysis</h3>
      <button id="n8n-close-btn" style="background: none; border: none; color: #888; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div id="n8n-content" class="n8n-markdown-container">⏳ Analyzing listing and calculating metrics...</div>
  `;

  // Inject a quick style block so the Markdown elements (lists, bolding, headers) render cleanly
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

  document.getElementById("n8n-close-btn").addEventListener("click", () => {
    overlay.remove();
  });
}

// Notice how clean this function is now!
function updateOverlayWithAnalysis(htmlContent) {
  const contentDiv = document.getElementById("n8n-content");
  if (contentDiv) {
    contentDiv.innerHTML = htmlContent;
  }
}
