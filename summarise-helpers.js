// Make functions available globally
window.summariseFree = async function(url) {
    try {
        // First, fetch the webpage content
        const response = await fetch(url);
        const html = await response.text();
        
        // Extract text content from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const textContent = doc.body.textContent || '';
        
        // Truncate text to a reasonable length for summarization
        const truncatedText = textContent.substring(0, 2000);
        
        // Use a simple summarization approach for the free version
        const sentences = truncatedText.split(/[.!?]+/);
        const summary = sentences.slice(0, 3).join('. ') + '.';
        
        return summary;
    } catch (error) {
        console.error('Error summarizing:', error);
        return 'Unable to generate summary. Please try again later.';
    }
};

window.summarise = async function(url) {
    try {
        // Get API key from storage
        const result = await chrome.storage.local.get(['openaiApiKey']);
        const apiKey = result.openaiApiKey;

        if (!apiKey) {
            return window.summariseFree(url);
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that summarizes web content."
                    },
                    {
                        role: "user",
                        content: `Please summarize this webpage: ${url}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error summarizing:', error);
        return window.summariseFree(url);
    }
};

window.summariseWithKey = async function(url, provider, apiKey, customUrl) {
    try {
        const endpoint = customUrl || `https://api.openai.com/v1/chat/completions`;
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that summarizes web content."
                    },
                    {
                        role: "user",
                        content: `Please summarize this webpage: ${url}`
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error summarizing:', error);
        throw new Error('Failed to summarize the content');
    }
}; 