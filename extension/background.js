// Frame Docs - Enhanced Background Script
console.log('Frame Docs background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Frame Docs extension installed/updated');
    
    // Create context menu items
    chrome.contextMenus.create({
        id: "generateVideoFromSelection",
        title: "Generate video from selection",
        contexts: ["selection"]
    });
    
    chrome.contextMenus.create({
        id: "generateVideoFromPage",
        title: "Generate video from this page",
        contexts: ["page"]
    });
    
    // Initialize storage
    chrome.storage.local.get(['videoHistory', 'settings'], (result) => {
        if (!result.videoHistory) {
            chrome.storage.local.set({ videoHistory: [] });
        }
        if (!result.settings) {
            chrome.storage.local.set({ 
                settings: {
                    autoExtract: true,
                    useAI: true,
                    defaultVoice: 'en-US-AriaNeural',
                    videoQuality: 'standard'
                }
            });
        }
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "generateVideoFromSelection") {
        handleSelectionVideoGeneration(info.selectionText, tab);
    } else if (info.menuItemId === "generateVideoFromPage") {
        handlePageVideoGeneration(tab);
    }
});

// Handle selection-based video generation
async function handleSelectionVideoGeneration(selectionText, tab) {
    try {
        // Show notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: 'Frame Docs',
            message: 'Generating video from selection...'
        });

        // Store selection for popup to use
        await chrome.storage.local.set({ 
            lastSelection: selectionText,
            lastSelectionUrl: tab.url
        });

        // Open popup or trigger generation
        chrome.action.openPopup();
    } catch (error) {
        console.error('Error handling selection:', error);
    }
}

// Handle page-based video generation
async function handlePageVideoGeneration(tab) {
    try {
        // Inject content script if not already present
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
        });

        // Trigger content extraction
        const response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'extractContent',
            source: 'contextMenu'
        });

        if (response && response.success) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Frame Docs',
                message: 'Content extracted! Open popup to generate video.'
            });
        }
    } catch (error) {
        console.error('Error handling page generation:', error);
    }
}

// Handle tab updates to manage content scripts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        try {
            // Auto-inject content script on documentation sites
            if (isDocumentationSite(tab.url)) {
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['content.js']
                });
                
                console.log('Auto-injected content script on documentation site:', tab.url);
            }
        } catch (error) {
            console.log('Could not auto-inject content script:', error);
        }
    }
});

// Detect documentation sites
function isDocumentationSite(url) {
    const docPatterns = [
        /docs?\./,
        /documentation/,
        /readme/i,
        /wiki/,
        /developer\./,
        /api\./,
        /guide/,
        /tutorial/
    ];
    
    return docPatterns.some(pattern => pattern.test(url));
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request);
    
    switch (request.action) {
        case 'getTabInfo':
            chrome.tabs.get(sender.tab.id, (tab) => {
                sendResponse({
                    title: tab.title,
                    url: tab.url,
                    id: tab.id
                });
            });
            return true;
            
        case 'createTab':
            chrome.tabs.create({ url: request.url }, (tab) => {
                sendResponse({ tabId: tab.id });
            });
            return true;
            
        case 'showNotification':
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: request.title || 'Frame Docs',
                message: request.message
            });
            sendResponse({ success: true });
            break;
            
        case 'saveToHistory':
            chrome.storage.local.get(['videoHistory'], (result) => {
                const history = result.videoHistory || [];
                history.unshift(request.videoData);
                if (history.length > 50) history.splice(50);
                chrome.storage.local.set({ videoHistory: history });
            });
            sendResponse({ success: true });
            break;
            
        case 'ping':
            sendResponse({ status: 'alive', timestamp: Date.now() });
            break;
    }
    
    return true;
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Frame Docs starting up...');
});

// Keep service worker alive
let keepAliveInterval;
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === 'keepAlive') {
        keepAliveInterval = setInterval(() => {
            port.postMessage({ keepAlive: true });
        }, 20000);
        
        port.onDisconnect.addListener(() => {
            clearInterval(keepAliveInterval);
        });
    }
});