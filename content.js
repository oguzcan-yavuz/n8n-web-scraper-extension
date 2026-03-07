let analysisTimerInterval;

// 1. Listen for messages from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { action, selectedText } = request;

  // Show the UI immediately with the timer
  showLoadingOverlay();

  // Grab the full context directly from the DOM (No truncation!)
  const fullPageText = document.body.innerText;
  
  const url = window.location.href;
  const title = document.title;

  let targetText = "";
  let contextText = "";

  // Route the text to the correct JSON variables based on the tool
  if (action === "analyze-property" || action === "detect-bs-thread") {
    // For whole-page tools, the page IS the content. Context is empty.
    targetText = fullPageText;
    contextText = "";
  } else if (action === "detect-bs-targeted") {
    // For targeted tools, the highlight is the content. The page is the context.
    targetText = selectedText;
    contextText = fullPageText;
  }

  // Fire the fetch asynchronously
  processWithN8n(action, targetText, contextText, url, title).then(htmlContent => {
    updateOverlayWithAnalysis(htmlContent);
  });
});

// 2. The Fetch Function (Immune to Service Worker timeouts)
async function processWithN8n(actionType, targetText, contextText, url, title) {
  const webhookUrl = "http://localhost:5678/webhook/21cdf2aa-6f97-4fe4-b886-334858415a39"; 

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: actionType,
        source: "Chrome Extension",
        listingUrl: url,
        pageTitle: title,
        content: targetText,
        pageContext: contextText 
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    
    // Parse the markdown returned by n8n
    return marked.parse(data.text || JSON.stringify(data)); 

  } catch (error) {
    console.error("Error from n8n:", error);
    return marked.parse(`❌ **Error connecting to n8n:** ${error.message}`);
  }
}

// 3. UI Functions
function showLoadingOverlay() {
  // Clear any existing timer from a previous run
  if (analysisTimerInterval) clearInterval(analysisTimerInterval);

  let overlay = document.getElementById("n8n-analysis-overlay");

  if (overlay) {
    // If it exists, just update the text and reset the timer UI
    document.getElementById("n8n-content").innerHTML = `⏳ Running analysis... <strong id="n8n-timer" style="color: #00aaee;">(0s)</strong><br><br><span style="color: #888; font-size: 12px;">This might take up to 90 seconds for massive threads.</span>`;
  } else {
    // Create the overlay from scratch
    overlay = document.createElement("div");
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
      <div id="n8n-content" class="n8n-markdown-container">
        ⏳ Running analysis... <strong id="n8n-timer" style="color: #00aaee;">(0s)</strong><br><br><span style="color: #888; font-size: 12px;">This might take up to 90 seconds for massive threads.</span>
      </div>
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

    // Make sure to kill the timer if the user closes the window early
    document.getElementById("n8n-close-btn").addEventListener("click", () => {
      if (analysisTimerInterval) clearInterval(analysisTimerInterval);
      overlay.remove();
    });
  }

  // Start the tick
  let secondsElapsed = 0;
  analysisTimerInterval = setInterval(() => {
    secondsElapsed++;
    const timerElement = document.getElementById("n8n-timer");
    if (timerElement) {
      timerElement.innerText = `(${secondsElapsed}s)`;
    } else {
      // Failsafe: if the element is gone, kill the loop
      clearInterval(analysisTimerInterval);
    }
  }, 1000);
}

function updateOverlayWithAnalysis(htmlContent) {
  // The data has arrived! Kill the timer immediately.
  if (analysisTimerInterval) clearInterval(analysisTimerInterval);
  
  const contentDiv = document.getElementById("n8n-content");
  if (contentDiv) contentDiv.innerHTML = htmlContent;
}
