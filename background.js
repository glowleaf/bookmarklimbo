// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  // Initialize storage with default values
  chrome.storage.local.get(['visitedBookmarks'], (result) => {
    if (!result.visitedBookmarks) {
      chrome.storage.local.set({ visitedBookmarks: [] });
    }
  });
}); 