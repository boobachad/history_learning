/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/

/// <reference types="chrome"/>
// Constants
const BATCH_SIZE = 50;
const API_ENDPOINT = "http://localhost:3000/api/entries/submit";
// Current sync status
let currentStatus = {
    status: 'idle',
    currentBatch: 0,
    totalBatches: 0,
    processedEntries: 0,
    error: undefined
};
// Check if Chrome API is available
function isChromeAPIAvailable() {
    return typeof chrome !== 'undefined' &&
        typeof chrome.runtime !== 'undefined' &&
        typeof chrome.history !== 'undefined';
}
// Update and broadcast sync status
function updateSyncStatus(status) {
    console.log('[Background] Updating status:', status);
    currentStatus = { ...currentStatus, ...status };
    // Broadcast to all extension views (popup, etc)
    chrome.runtime.sendMessage({
        type: 'SYNC_STATUS',
        status: currentStatus
    }).catch((error) => {
        console.error('[Background] Failed to broadcast status:', error);
    });
}
// Helper function to chunk array into batches
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}
// Process history entries in batches
async function processHistoryInBatches(startTime, endTime) {
    try {
        console.log('[Background] Starting history processing:', { startTime, endTime });
        // Convert times to milliseconds
        const startTimeMs = new Date(startTime).getTime();
        const endTimeMs = new Date(endTime).getTime();
        console.log('[Background] Converted times:', { startTimeMs, endTimeMs });
        // Fetch history entries
        const historyEntries = await new Promise((resolve, reject) => {
            if (!chrome.history?.search) {
                console.error('[Background] Chrome history API not available');
                reject(new Error("Chrome history API is not available"));
                return;
            }
            console.log('[Background] Searching history...');
            chrome.history.search({
                text: "",
                startTime: startTimeMs,
                endTime: endTimeMs,
                maxResults: 10000
            }, (entries) => {
                if (chrome.runtime.lastError) {
                    console.error('[Background] History search error:', chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                    return;
                }
                console.log('[Background] Found entries:', entries.length);
                // Filter out entries with missing required fields
                const validEntries = entries.filter(entry => entry.url &&
                    entry.title &&
                    entry.lastVisitTime);
                console.log('[Background] Valid entries:', validEntries.length);
                resolve(validEntries);
            });
        });
        if (!historyEntries.length) {
            console.log('[Background] No history entries found');
            return;
        }
        // Process entries in batches
        const batches = chunkArray(historyEntries, BATCH_SIZE);
        console.log(`[Background] Processing ${batches.length} batches`);
        // Process each batch
        for (let i = 0; i < batches.length; i++) {
            try {
                console.log(`[Background] Processing batch ${i + 1}/${batches.length}`);
                await processHistoryBatch(batches[i], startTime, endTime, i + 1, batches.length);
            }
            catch (error) {
                console.error(`[Background] Batch ${i + 1} failed:`, error);
                throw new Error(`Failed to process batch ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        console.log('[Background] All batches processed successfully');
    }
    catch (error) {
        console.error('[Background] Processing failed:', error);
        throw error;
    }
}
// Process a single batch of history entries
async function processHistoryBatch(entries, startTime, endTime, batchNumber, totalBatches) {
    try {
        console.log(`[Background] Processing batch ${batchNumber}/${totalBatches} with ${entries.length} entries`);
        // Update status
        updateSyncStatus({
            status: 'processing',
            currentBatch: batchNumber,
            totalBatches,
            processedEntries: entries.length
        });
        // Send batch to API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                startTime,
                stopTime: endTime,
                history: entries.map(entry => ({
                    url: entry.url,
                    title: entry.title,
                    timestamp: new Date(entry.lastVisitTime).toISOString(),
                    visitTime: 0, // We don't have this info from history API
                    videoLength: 0, // We don't have this info from history API
                    watchedLength: 0, // We don't have this info from history API
                }))
            })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || 'Failed to process batch');
        }
        const result = await response.json();
        console.log(`[Background] Batch ${batchNumber} processed:`, result);
        // Update status with processed entries
        updateSyncStatus({
            processedEntries: (currentStatus.processedEntries || 0) + entries.length
        });
        console.log(`[Background] Batch ${batchNumber} completed successfully`);
    }
    catch (error) {
        console.error(`[Background] Batch ${batchNumber} failed:`, error);
        throw error;
    }
}
// Main message handler
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received message:', message);
    // Handle status requests
    if (message.type === 'GET_STATUS') {
        console.log('[Background] Sending current status:', currentStatus);
        sendResponse({ status: currentStatus });
        return true;
    }
    // Handle history processing requests
    if (message.type === 'PROCESS_HISTORY') {
        const { startTime, endTime } = message;
        if (!startTime || !endTime) {
            const error = 'Missing start or end time';
            console.error('[Background]', error);
            updateSyncStatus({ status: 'error', error });
            sendResponse({ success: false, error });
            return true;
        }
        // Start processing
        updateSyncStatus({
            status: 'processing',
            currentBatch: 0,
            totalBatches: 0,
            processedEntries: 0,
            error: undefined
        });
        processHistoryInBatches(startTime, endTime)
            .then(() => {
            console.log('[Background] Processing completed successfully');
            updateSyncStatus({
                status: 'completed',
                error: undefined
            });
            sendResponse({ success: true });
        })
            .catch((error) => {
            console.error('[Background] Processing error:', error);
            updateSyncStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep the message channel open for async response
    }
});
// Listen for external connections
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    console.log('[Background] Received external message:', message, 'from:', sender);
    // Handle history processing requests
    if (message.type === 'PROCESS_HISTORY') {
        const { startTime, endTime } = message;
        if (!startTime || !endTime) {
            sendResponse({ success: false, error: 'Missing start or end time' });
            return true;
        }
        // Start processing
        updateSyncStatus({ status: 'processing', currentBatch: 0, totalBatches: 0, processedEntries: 0 });
        processHistoryInBatches(startTime, endTime)
            .then(() => {
            updateSyncStatus({ status: 'completed' });
            sendResponse({ success: true });
        })
            .catch((error) => {
            console.error('[Background] Processing error:', error);
            updateSyncStatus({
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep the message channel open for async response
    }
});

/******/ })()
;
//# sourceMappingURL=background.js.map