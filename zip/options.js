// Load saved settings
document.addEventListener('DOMContentLoaded', async () => {
    const prefs = await chrome.storage.local.get(null);
    
    // Set OpenAI settings
    document.getElementById('apiKey').value = prefs.apiKey || '';
    document.getElementById('customUrl').value = prefs.customUrl || '';
    
    // Set social media settings
    document.getElementById('xBearer').value = prefs.xBearer || '';
    document.getElementById('fbToken').value = prefs.fbToken || '';
    document.getElementById('redditToken').value = prefs.redditToken || '';
    document.getElementById('pocketToken').value = prefs.pocketToken || '';
    document.getElementById('pocketConsumer').value = prefs.pocketConsumer || '';
    document.getElementById('ghToken').value = prefs.ghToken || '';
    document.getElementById('ytApiKey').value = prefs.ytApiKey || '';
    document.getElementById('ytOauth').value = prefs.ytOauth || '';
    document.getElementById('pinboardToken').value = prefs.pinboardToken || '';

    // Set new settings
    chrome.storage.sync.get({
        enableTelegramBookmarks: false,
        enableTelegramNotifications: false,
        showAISummaries: true,
        limboDuration: 30
    }, (settings) => {
        document.getElementById('enable-telegram').checked = settings.enableTelegramBookmarks;
        document.getElementById('telegram-notifications').checked = settings.enableTelegramNotifications;
        document.getElementById('show-summaries').checked = settings.showAISummaries;
        document.getElementById('limbo-duration').value = settings.limboDuration;
    });
});

// Save OpenAI settings
document.getElementById('saveOpenAI').addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value;
    const customUrl = document.getElementById('customUrl').value;
    
    try {
        await chrome.storage.local.set({
            apiKey,
            customUrl,
            provider: 'openai'
        });
        
        document.getElementById('openAIStatus').textContent = 'Settings saved successfully!';
        document.getElementById('openAIStatus').className = 'status success';
    } catch (error) {
        document.getElementById('openAIStatus').textContent = 'Error saving settings: ' + error.message;
        document.getElementById('openAIStatus').className = 'status error';
    }
});

// Save social media settings
document.getElementById('saveSocial').addEventListener('click', async () => {
    const settings = {
        xBearer: document.getElementById('xBearer').value,
        fbToken: document.getElementById('fbToken').value,
        redditToken: document.getElementById('redditToken').value,
        pocketToken: document.getElementById('pocketToken').value,
        pocketConsumer: document.getElementById('pocketConsumer').value,
        ghToken: document.getElementById('ghToken').value,
        ytApiKey: document.getElementById('ytApiKey').value,
        ytOauth: document.getElementById('ytOauth').value,
        pinboardToken: document.getElementById('pinboardToken').value
    };
    
    try {
        await chrome.storage.local.set(settings);
        document.getElementById('socialStatus').textContent = 'Settings saved successfully!';
        document.getElementById('socialStatus').className = 'status success';
    } catch (error) {
        document.getElementById('socialStatus').textContent = 'Error saving settings: ' + error.message;
        document.getElementById('socialStatus').className = 'status error';
    }
});

// Save new settings
document.getElementById('save-settings').addEventListener('click', () => {
    const settings = {
        enableTelegramBookmarks: document.getElementById('enable-telegram').checked,
        enableTelegramNotifications: document.getElementById('telegram-notifications').checked,
        showAISummaries: document.getElementById('show-summaries').checked,
        limboDuration: parseInt(document.getElementById('limbo-duration').value)
    };

    chrome.storage.sync.set(settings, () => {
        // Show success message
        const button = document.getElementById('save-settings');
        const originalText = button.textContent;
        button.textContent = 'Settings Saved!';
        button.style.backgroundColor = '#4caf50';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.backgroundColor = '#1976d2';
        }, 2000);
    });
}); 