/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	// The require scope
/******/ 	var __webpack_require__ = {};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./src/content.ts ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
// content.ts
// This script runs on every page and can interact with the DOM.
console.log("[Content Script] Started.");
// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PAGE_INFO") {
        const pageInfo = {
            title: document.title,
            url: window.location.href,
            timestamp: new Date().toISOString()
        };
        sendResponse(pageInfo);
    }
    else if (message.type === "GET_VIDEO_INFO" && window.location.href.includes("youtube.com/watch")) {
        // Stub: In a real scenario, you'd scrape the video player for duration and current time
        const videoElement = document.querySelector("video");
        let videoLength = 0;
        let watchedLength = 0;
        if (videoElement) {
            videoLength = videoElement.duration || 0;
            watchedLength = videoElement.currentTime || 0;
            console.log(`[Content Script] Found video: Length=${videoLength}s, Watched=${watchedLength}s`);
        }
        else {
            console.log("[Content Script] No video element found on YouTube page.");
        }
        sendResponse({ videoLength, watchedLength });
    }
    return true; // Keep the message channel open for async response
});

// You can also inject scripts or interact with the DOM directly here
// For example, to observe changes on the page or inject UI elements.

/******/ })()
;
//# sourceMappingURL=content.js.map