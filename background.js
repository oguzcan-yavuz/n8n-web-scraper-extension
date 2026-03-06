chrome.action.onClicked.addListener((tab) => {
  // 1. Show the loading overlay immediately
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: showLoadingOverlay
  });

  // 2. Extract the text
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: extractPageText
  }, async (injectionResults) => {
    if (injectionResults && injectionResults[0]) {
      const rawText = injectionResults[0].result;
      
      // 3. Send to n8n and wait for the response
      const analysis = await sendToN8n(rawText, tab.url, tab.title);
      
      // 4. Update the overlay with the final analysis
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: updateOverlayWithAnalysis,
        args: [analysis]
      });
    }
  });
});

function extractPageText() {
  return document.body.innerText;
}

async function sendToN8n(text, url, title) {
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
    
    // Assuming n8n returns a JSON object with the AI's response in a "text" field.
    // Adjust this based on exactly how your "Respond to Webhook" node is configured.
    const data = await response.json();
    return data.text || JSON.stringify(data); 

  } catch (error) {
    console.error("Error from n8n:", error);
    return "❌ Error connecting to n8n. Check the console.";
  }
}

// --- INJECTED UI FUNCTIONS ---
// Note: These run entirely in the context of the Sahibinden page

function showLoadingOverlay() {
  // Prevent duplicate overlays
  if (document.getElementById("n8n-analysis-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "n8n-analysis-overlay";
  
  // Clean, modern, dark-mode styling
  Object.assign(overlay.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "400px",
    maxHeight: "80vh",
    backgroundColor: "#1e1e1e",
    color: "#e0e0e0",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    zIndex: "999999",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.5",
    overflowY: "auto",
    border: "1px solid #333"
  });

  overlay.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">
      <h3 style="margin: 0; font-size: 16px; color: #fff;">Listing Analysis</h3>
      <button id="n8n-close-btn" style="background: none; border: none; color: #888; cursor: pointer; font-size: 18px;">&times;</button>
    </div>
    <div id="n8n-content" style="white-space: pre-wrap;">⏳ Analyzing listing and calculating metrics...</div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("n8n-close-btn").addEventListener("click", () => {
    overlay.remove();
  });
}

function updateOverlayWithAnalysis(analysisText) {
  const contentDiv = document.getElementById("n8n-content");
  if (contentDiv) {
    // white-space: pre-wrap handles basic markdown formatting naturally in standard HTML
    contentDiv.textContent = analysisText;
  }
}
