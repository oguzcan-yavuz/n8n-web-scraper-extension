// Load the saved URL when the options page opens
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['webhookUrl'], (result) => {
    if (result.webhookUrl) {
      document.getElementById('webhookUrl').value = result.webhookUrl;
    }
  });
});

// Save the URL when the button is clicked
document.getElementById('saveBtn').addEventListener('click', () => {
  const url = document.getElementById('webhookUrl').value.trim();
  
  chrome.storage.sync.set({ webhookUrl: url }, () => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    setTimeout(() => {
      status.textContent = '';
    }, 2500);
  });
});
