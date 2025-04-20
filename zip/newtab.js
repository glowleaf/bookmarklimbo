// Initialize storage with default values
async function initializeStorage() {
    const result = await chrome.storage.local.get(['visitedBookmarks', 'bookmarkCount']);
    if (!result.visitedBookmarks) {
        await chrome.storage.local.set({ visitedBookmarks: {} });
    }
    if (!result.bookmarkCount) {
        await chrome.storage.local.set({ bookmarkCount: 0 });
    }
}

// Update the bookmark counter display
function updateBookmarkCounter(count) {
    const counter = document.getElementById('bookmark-count');
    if (counter) {
        counter.textContent = count;
    }
}

// Show congratulations message when all bookmarks are visited
function showCongratulations() {
    const container = document.getElementById('bookmark-container');
    if (container) {
        container.innerHTML = `
            <div class="congratulations">
                <h2>🎉 Congratulations! 🎉</h2>
                <p>You've visited all your bookmarks!</p>
                <p>Time to add some new ones!</p>
            </div>
        `;
    }
}

// Get emoji and description based on days in limbo
function getLimboStatus(days) {
    if (days < 7) {
        return { emoji: '🆕', description: 'Fresh' };
    } else if (days < 30) {
        return { emoji: '⏳', description: 'Getting stale' };
    } else if (days < 90) {
        return { emoji: '📅', description: 'Been a while' };
    } else if (days < 180) {
        return { emoji: '⌛', description: 'Getting old' };
    } else {
        return { emoji: '💀', description: 'Ancient' };
    }
}

// Check if a URL is a Telegram message
function isTelegramMessage(url) {
    return url.includes('t.me/') || url.includes('telegram.org/');
}

// Create an Intersection Observer for lazy loading summaries
const summaryObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const bookmarkItem = entry.target;
            const url = bookmarkItem.dataset.url;
            const summaryElement = bookmarkItem.querySelector('.bookmark-summary');
            
            if (!bookmarkItem.dataset.summaryLoaded) {
                loadSummary(url, summaryElement);
                bookmarkItem.dataset.summaryLoaded = 'true';
            }
        }
    });
}, {
    rootMargin: '100px' // Start loading when item is 100px from viewport
});

// Function to load summary for a bookmark
async function loadSummary(url, summaryElement) {
    try {
        summaryElement.textContent = 'Loading summary...';
        const summary = await window.summarise(url);
        summaryElement.textContent = summary;
    } catch (error) {
        console.error('Error loading summary:', error);
        summaryElement.textContent = 'Failed to load summary';
    }
}

// Function to create bookmark item
function createBookmarkItem(bookmark) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.url = bookmark.url;
    
    const title = document.createElement('h3');
    title.textContent = bookmark.title;
    
    const link = document.createElement('a');
    link.href = bookmark.url;
    link.textContent = bookmark.url;
    
    // Calculate days in limbo
    const daysInLimbo = Math.floor((Date.now() - bookmark.dateAdded) / (1000 * 60 * 60 * 24));
    const status = getLimboStatus(daysInLimbo);
    
    const daysInLimboText = document.createElement('p');
    daysInLimboText.className = 'days-in-limbo';
    daysInLimboText.textContent = `${status.emoji} ${daysInLimbo} days in limbo (${status.description})`;
    
    const summary = document.createElement('p');
    summary.className = 'bookmark-summary';
    summary.textContent = 'Loading summary...';
    
    item.appendChild(title);
    item.appendChild(link);
    item.appendChild(daysInLimboText);
    item.appendChild(summary);
    
    // Add click handler to mark as visited and update counter
    item.addEventListener('click', async () => {
        // Open the bookmark
        window.open(bookmark.url, '_blank');
        
        // Mark as visited
        const result = await chrome.storage.local.get('visitedBookmarks');
        const visitedBookmarks = result.visitedBookmarks || {};
        visitedBookmarks[bookmark.id] = true;
        await chrome.storage.local.set({ visitedBookmarks });
        
        // Get current count and decrement
        const countResult = await chrome.storage.local.get('bookmarkCount');
        const currentCount = countResult.bookmarkCount || 0;
        const newCount = Math.max(0, currentCount - 1); // Ensure it doesn't go below 0
        await chrome.storage.local.set({ bookmarkCount: newCount });
        
        // Update counter display
        updateBookmarkCounter(newCount);
        
        // Remove the item
        item.remove();
        
        // Check if all bookmarks are visited
        const remainingItems = document.querySelectorAll('.bookmark-item');
        if (remainingItems.length === 0) {
            showCongratulations();
        }
    });
    
    // Observe this item for lazy loading
    summaryObserver.observe(item);
    
    return item;
}

// Load and display bookmarks
async function loadBookmarks() {
    try {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        const bookmarkList = document.getElementById('bookmark-list');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (errorElement) errorElement.style.display = 'none';
        
        await initializeStorage();
        
        const result = await chrome.storage.local.get('visitedBookmarks');
        const visitedBookmarks = result.visitedBookmarks || {};
        
        // Get ALL bookmarks, not just recent ones
        const bookmarks = await chrome.bookmarks.getTree();
        const allBookmarks = [];
        
        // Flatten the bookmark tree
        function flattenBookmarks(node) {
            if (node.url) {
                allBookmarks.push(node);
            }
            if (node.children) {
                node.children.forEach(flattenBookmarks);
            }
        }
        
        bookmarks.forEach(flattenBookmarks);
        
        // Filter unvisited bookmarks
        const unvisitedBookmarks = allBookmarks.filter(b => !visitedBookmarks[b.id]);
        
        // Sort by date added (oldest first)
        const sortedBookmarks = unvisitedBookmarks.sort((a, b) => a.dateAdded - b.dateAdded);
        
        // Select 3 random bookmarks from different age ranges
        const selectedBookmarks = [];
        if (sortedBookmarks.length > 0) {
            // Split bookmarks into three groups
            const totalBookmarks = sortedBookmarks.length;
            const third = Math.floor(totalBookmarks / 3);
            
            // Get random bookmark from oldest third
            if (third > 0) {
                const oldestIndex = Math.floor(Math.random() * third);
                selectedBookmarks.push(sortedBookmarks[oldestIndex]);
            }
            
            // Get random bookmark from middle third
            if (third > 0 && totalBookmarks > third) {
                const middleIndex = third + Math.floor(Math.random() * third);
                selectedBookmarks.push(sortedBookmarks[middleIndex]);
            }
            
            // Get random bookmark from newest third
            if (third > 0 && totalBookmarks > third * 2) {
                const newestIndex = (third * 2) + Math.floor(Math.random() * (totalBookmarks - (third * 2)));
                selectedBookmarks.push(sortedBookmarks[newestIndex]);
            }
        }
        
        if (bookmarkList) {
            bookmarkList.innerHTML = '';
            selectedBookmarks.forEach(bookmark => {
                const item = createBookmarkItem(bookmark);
                bookmarkList.appendChild(item);
            });
        }
        
        updateBookmarkCounter(sortedBookmarks.length); // Show total count of bookmarks in limbo
        
        if (loadingElement) loadingElement.style.display = 'none';
    } catch (error) {
        console.error('Error loading bookmarks:', error);
        const errorElement = document.getElementById('error');
        if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.textContent = 'Error loading bookmarks. Please try again.';
        }
    }
}

// Add settings button
function addSettingsButton() {
    const settingsButton = document.querySelector('.settings-button');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadBookmarks();
    addSettingsButton();
}); 