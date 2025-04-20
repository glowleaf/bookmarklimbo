// Make functions available globally
window.getXBookmarks = async function(bearerToken) {
    if (!bearerToken) return [];
    try {
        const response = await fetch('https://api.twitter.com/2/users/me/bookmarks', {
            headers: {
                'Authorization': `Bearer ${bearerToken}`
            }
        });
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching X bookmarks:', error);
        return [];
    }
};

window.getFacebookSaved = async function(accessToken) {
    if (!accessToken) return [];
    try {
        const response = await fetch(`https://graph.facebook.com/v12.0/me/saved?access_token=${accessToken}`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching Facebook saved items:', error);
        return [];
    }
};

window.getRedditSaved = async function(accessToken) {
    if (!accessToken) return [];
    try {
        const response = await fetch('https://oauth.reddit.com/user/me/saved', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const data = await response.json();
        return data.data.children.map(item => item.data) || [];
    } catch (error) {
        console.error('Error fetching Reddit saved items:', error);
        return [];
    }
};

window.getPocket = async function(accessToken, consumerKey) {
    if (!accessToken || !consumerKey) return [];
    try {
        const response = await fetch(`https://getpocket.com/v3/get?consumer_key=${consumerKey}&access_token=${accessToken}&state=all`);
        const data = await response.json();
        return Object.values(data.list || {});
    } catch (error) {
        console.error('Error fetching Pocket items:', error);
        return [];
    }
};

window.getGitHubStars = async function(accessToken) {
    if (!accessToken) return [];
    try {
        const response = await fetch('https://api.github.com/user/starred', {
            headers: {
                'Authorization': `token ${accessToken}`
            }
        });
        return await response.json();
    } catch (error) {
        console.error('Error fetching GitHub stars:', error);
        return [];
    }
};

window.getYouTubeWL = async function(apiKey, oauthToken) {
    if (!apiKey && !oauthToken) return [];
    try {
        const token = oauthToken ? `&access_token=${oauthToken}` : `&key=${apiKey}`;
        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=WL&maxResults=50${token}`);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error('Error fetching YouTube watch later:', error);
        return [];
    }
};

window.getPinboard = async function(apiToken) {
    if (!apiToken) return [];
    try {
        const response = await fetch(`https://api.pinboard.in/v1/posts/all?auth_token=${apiToken}&format=json`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching Pinboard bookmarks:', error);
        return [];
    }
}; 