/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!**********************!*\
  !*** ./src/popup.ts ***!
  \**********************/

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message) => {
    console.log('[Popup] Received message:', message);
    if (message.type === 'SYNC_STATUS') {
        updateStatus(message.status);
    }
});
// Update the popup UI
function updateStatus(status) {
    console.log('[Popup] Updating status:', status);
    const statusEl = document.getElementById('status');
    const progressEl = document.getElementById('progress');
    if (!statusEl || !progressEl) {
        console.error('[Popup] Status elements not found');
        return;
    }
    // Remove all status classes
    statusEl.className = 'status';
    // Update status text and class
    switch (status.status) {
        case 'processing':
            statusEl.textContent = 'Processing...';
            statusEl.classList.add('processing');
            progressEl.textContent = `Batch ${status.currentBatch} of ${status.totalBatches} (${status.processedEntries} entries)`;
            break;
        case 'completed':
            statusEl.textContent = 'Sync Completed';
            statusEl.classList.add('completed');
            progressEl.textContent = `Processed ${status.processedEntries} entries`;
            break;
        case 'error':
            statusEl.textContent = 'Error';
            statusEl.classList.add('error');
            progressEl.textContent = status.error || 'An error occurred';
            break;
        default:
            statusEl.textContent = 'Idle';
            statusEl.classList.add('idle');
            progressEl.textContent = '';
    }
}
// Request current status when popup opens
console.log('[Popup] Requesting current status');
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
    console.log('[Popup] Received status response:', response);
    if (response?.status) {
        updateStatus(response.status);
    }
});

/******/ })()
;
//# sourceMappingURL=popup.js.map