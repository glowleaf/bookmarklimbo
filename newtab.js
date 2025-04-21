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

// Load summary with user consent
async function loadSummary(url, summaryElement) {
    try {
        // Show loading state
        summaryElement.textContent = 'Loading summary...';
        
        // Check if we have permission for this URL
        const hasPermission = await checkPermission(url);
        if (!hasPermission) {
            summaryElement.innerHTML = `
                <button class="load-summary-btn" onclick="requestSummary('${url}', this)">
                    Click to load summary
                </button>
            `;
            return;
        }

        // If we have permission, load the summary
        const summary = await window.summarise(url);
        summaryElement.textContent = summary || 'No summary available';
    } catch (error) {
        console.error('Error loading summary:', error);
        summaryElement.textContent = 'Error loading summary';
    }
}

// Check if we have permission for a URL
async function checkPermission(url) {
    try {
        const urlObj = new URL(url);
        const origin = urlObj.origin;
        
        // Check if the URL matches our host permissions
        const hasHostPermission = await chrome.permissions.contains({
            origins: [origin + '/*']
        });
        
        return hasHostPermission;
    } catch (error) {
        console.error('Error checking permission:', error);
        return false;
    }
}

// Request summary with user consent
async function requestSummary(url, button) {
    try {
        const urlObj = new URL(url);
        const origin = urlObj.origin;
        
        // Request permission for this domain
        const granted = await chrome.permissions.request({
            origins: [origin + '/*']
        });
        
        if (granted) {
            // Update button to show loading
            button.textContent = 'Loading...';
            button.disabled = true;
            
            // Load the summary
            const summary = await window.summarise(url);
            const summaryElement = button.parentElement;
            summaryElement.textContent = summary || 'No summary available';
        } else {
            button.textContent = 'Permission denied';
        }
    } catch (error) {
        console.error('Error requesting summary:', error);
        button.textContent = 'Error loading summary';
    }
}

// Function to create bookmark item
function createBookmarkItem(bookmark) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    
    const status = getLimboStatus(bookmark.daysInLimbo);
    
    item.innerHTML = `
        <div class="bookmark-header">
            <span class="emoji">${status.emoji}</span>
            <span class="days">${bookmark.daysInLimbo} days</span>
        </div>
        <h3 class="title">${bookmark.title}</h3>
        <p class="url">${bookmark.url}</p>
        <div class="summary"></div>
    `;
    
    // Add click handler that uses activeTab permission
    item.addEventListener('click', async () => {
        try {
            // Request activeTab permission
            const granted = await chrome.permissions.request({
                permissions: ['activeTab']
            });
            
            if (granted) {
                // Open the bookmark in a new tab
                chrome.tabs.create({ url: bookmark.url });
                
                // Mark as visited
                const result = await chrome.storage.local.get('visitedBookmarks');
                const visitedBookmarks = result.visitedBookmarks || {};
                visitedBookmarks[bookmark.id] = true;
                await chrome.storage.local.set({ visitedBookmarks });
                
                // Update counter
                const countResult = await chrome.storage.local.get('bookmarkCount');
                const newCount = Math.max(0, (countResult.bookmarkCount || 0) - 1);
                await chrome.storage.local.set({ bookmarkCount: newCount });
                updateBookmarkCounter(newCount);
                
                // Remove the item
                item.remove();
                
                // Check if all bookmarks are visited
                if (newCount === 0) {
                    showCongratulations();
                }
            }
        } catch (error) {
            console.error('Error opening bookmark:', error);
        }
    });
    
    // Load summary
    const summaryElement = item.querySelector('.summary');
    loadSummary(bookmark.url, summaryElement);
    
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