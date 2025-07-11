/// <reference types="chrome"/>
import type { ChromeMessage } from "./types"

// content.ts
// This script runs on every page and can interact with the DOM.

console.log("[Content Script] Started.")

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
    if (message.type === "GET_PAGE_INFO") {
        const pageInfo = {
            title: document.title,
            url: window.location.href,
            timestamp: new Date().toISOString()
        }
        sendResponse(pageInfo)
    } else if (message.type === "GET_VIDEO_INFO" && window.location.href.includes("youtube.com/watch")) {
        // Stub: In a real scenario, you'd scrape the video player for duration and current time
        const videoElement = document.querySelector("video")
        let videoLength = 0
        let watchedLength = 0

        if (videoElement) {
            videoLength = videoElement.duration || 0
            watchedLength = videoElement.currentTime || 0
            console.log(`[Content Script] Found video: Length=${videoLength}s, Watched=${watchedLength}s`)
        } else {
            console.log("[Content Script] No video element found on YouTube page.")
        }
        sendResponse({ videoLength, watchedLength })
    }
    return true // Keep the message channel open for async response
})

// You can also inject scripts or interact with the DOM directly here
// For example, to observe changes on the page or inject UI elements.
