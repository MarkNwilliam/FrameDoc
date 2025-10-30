console.log('Frame Docs content script loaded');

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    buttonId: 'frame-docs-fab',
    buttonSize: 60,
    iconSize: 28,
    primaryColor: '#667eea',
    hoverColor: '#5a6fd8',
    maxContentLength: 10000,
    animationDuration: '0.2s'
};

const DOCUMENTATION_KEYWORDS = [
    'docs', 'documentation', 'api', 'guide', 'tutorial',
    'rfc', 'spec', 'specification', 'reference', 'manual',
    'wiki', 'readme', 'developer', 'getting-started',
    'learn', 'introduction', 'overview', 'handbook',
    'knowledge', 'help', 'support', 'faq', 'how-to'
];

const DOCUMENTATION_DOMAINS = [
    'github.com',
    'readthedocs.io',
    'readthedocs.org',
    'docs.',
    'developer.',
    'datatracker.ietf.org',
    'w3.org',
    'mozilla.org/docs',
    'stackoverflow.com',
    'dev.to',
    'medium.com',
    'hashnode.dev'
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if an element already exists in the DOM
 * @param {string} elementId - The ID to check for
 * @returns {boolean}
 */
function elementExists(elementId) {
    return document.getElementById(elementId) !== null;
}

/**
 * Extract clean text content from the page
 * @returns {string} - Cleaned page content
 */
function extractPageContent() {
    // Remove script and style elements
    const clone = document.body.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(el => el.remove());
    
    // Get text content
    let content = clone.innerText || clone.textContent || '';
    
    // Clean up whitespace
    content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();
    
    return content;
}

/**
 * Get structured page data for processing
 * @returns {Object} - Page data object
 */
function getPageData() {
    const content = extractPageContent();
    
    return {
        title: document.title || 'Untitled Document',
        url: window.location.href,
        content: content.substring(0, CONFIG.maxContentLength),
        fullLength: content.length,
        domain: window.location.hostname,
        timestamp: new Date().toISOString()
    };
}

/**
 * Build URL with query parameters
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Parameters object
 * @returns {string} - Complete URL with parameters
 */
function buildUrlWithParams(baseUrl, params) {
    const queryParams = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
    
    return `${baseUrl}?${queryParams}`;
}

// ============================================
// DETECTION FUNCTIONS
// ============================================

/**
 * Check if current page is a documentation page
 * @returns {boolean}
 */
function isDocumentationPage() {
    const url = window.location.href.toLowerCase();
    const title = document.title.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase().substring(0, 1000);
    
    // Check URL for keywords
    const urlMatch = DOCUMENTATION_KEYWORDS.some(keyword => url.includes(keyword));
    if (urlMatch) {
        console.log('Documentation detected via URL keyword');
        return true;
    }
    
    // Check title for keywords
    const titleMatch = DOCUMENTATION_KEYWORDS.some(keyword => title.includes(keyword));
    if (titleMatch) {
        console.log('Documentation detected via title keyword');
        return true;
    }
    
    // Check page content for keywords
    const contentMatch = DOCUMENTATION_KEYWORDS.some(keyword => bodyText.includes(keyword));
    if (contentMatch) {
        console.log('Documentation detected via content keyword');
        return true;
    }
    
    // Check if domain is a known documentation site
    const domainMatch = DOCUMENTATION_DOMAINS.some(domain => url.includes(domain));
    if (domainMatch) {
        console.log('Documentation detected via domain');
        return true;
    }
    
    // Check for common documentation meta tags
    const metaTags = document.querySelectorAll('meta[name*="doc"], meta[property*="doc"]');
    if (metaTags.length > 0) {
        console.log('Documentation detected via meta tags');
        return true;
    }
    
    return false;
}

/**
 * Check if the page has sufficient content to process
 * @returns {boolean}
 */
function hasValidContent() {
    const content = extractPageContent();
    const minContentLength = 100; // Minimum characters
    
    if (content.length < minContentLength) {
        console.warn('Page content too short for processing');
        return false;
    }
    
    return true;
}

// ============================================
// BUTTON CREATION AND STYLING
// ============================================

/**
 * Create the icon element for the button
 * @returns {HTMLImageElement}
 */
function createButtonIcon() {
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icons/icon32.png');
    icon.alt = 'Frame Docs';
    icon.style.cssText = `
        width: ${CONFIG.iconSize}px;
        height: ${CONFIG.iconSize}px;
        display: block;
        pointer-events: none;
    `;
    return icon;
}

/**
 * Apply styles to the floating button
 * @param {HTMLButtonElement} button
 */
function styleFloatingButton(button) {
    button.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${CONFIG.primaryColor};
        color: white;
        border: none;
        padding: 16px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 10000;
        width: ${CONFIG.buttonSize}px;
        height: ${CONFIG.buttonSize}px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
        transition: all ${CONFIG.animationDuration} ease;
        font-size: 0;
        line-height: 0;
    `;
}

/**
 * Add hover effects to the button
 * @param {HTMLButtonElement} button
 */
function addButtonHoverEffects(button) {
    button.addEventListener('mouseenter', () => {
        button.style.background = CONFIG.hoverColor;
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2), 0 3px 6px rgba(0, 0, 0, 0.15)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.background = CONFIG.primaryColor;
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
    });
    
    // Add active state
    button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.95)';
    });
    
    button.addEventListener('mouseup', () => {
        button.style.transform = 'scale(1.05)';
    });
}

/**
 * Handle button click - open generator with page data
 */
function handleButtonClick() {
    console.log('Frame Docs button clicked');
    
    // Check if page has valid content
    if (!hasValidContent()) {
        alert('This page does not have enough content to generate a video tutorial.');
        return;
    }
    
    try {
        // Get page data
        const pageData = getPageData();
        
        console.log('Extracting page data:', {
            title: pageData.title,
            url: pageData.url,
            contentLength: pageData.content.length,
            fullLength: pageData.fullLength
        });
        
        // Build generator URL with parameters
        const generatorBaseUrl = chrome.runtime.getURL('generator.html');
        const generatorUrl = buildUrlWithParams(generatorBaseUrl, {
            title: pageData.title,
            url: pageData.url,
            content: pageData.content,
            domain: pageData.domain
        });
        
        // Open generator in new tab
        console.log('Opening generator...');
        window.open(generatorUrl, '_blank', 'noopener,noreferrer');
        
    } catch (error) {
        console.error('Error processing page:', error);
        alert('An error occurred while processing this page. Please try again.');
    }
}

/**
 * Create and inject the floating action button
 */
function createFloatingButton() {
    // Prevent duplicate buttons
    if (elementExists(CONFIG.buttonId)) {
        console.log('Button already exists, skipping creation');
        return;
    }
    
    console.log('Creating floating button...');
    
    // Create button element
    const button = document.createElement('button');
    button.id = CONFIG.buttonId;
    button.title = 'Generate AI Video from Documentation';
    button.setAttribute('aria-label', 'Generate AI Video Tutorial');
    
    // Create and append icon
    const icon = createButtonIcon();
    button.appendChild(icon);
    
    // Apply styles
    styleFloatingButton(button);
    
    // Add interactions
    addButtonHoverEffects(button);
    button.addEventListener('click', handleButtonClick);
    
    // Add to page
    try {
        document.body.appendChild(button);
        console.log('Floating button created successfully');
    } catch (error) {
        console.error('Error appending button to body:', error);
    }
}

/**
 * Remove the floating button from the page
 */
function removeFloatingButton() {
    const button = document.getElementById(CONFIG.buttonId);
    if (button) {
        button.remove();
        console.log('Floating button removed');
    }
}

// ============================================
// PAGE DETECTION AND INITIALIZATION
// ============================================

/**
 * Detect if page is documentation and show button accordingly
 */
function detectAndShowButton() {
    console.log('Detecting documentation page...');
    console.log('Current URL:', window.location.href);
    console.log('Page title:', document.title);
    
    // Check if this is a documentation page
    const isDocPage = isDocumentationPage();
    
    if (isDocPage) {
        console.log('✓ Documentation page detected');
        
        // Wait for page to be fully loaded
        if (document.readyState === 'complete') {
            createFloatingButton();
        } else {
            window.addEventListener('load', createFloatingButton);
        }
    } else {
        console.log('✗ Not detected as documentation page');
    }
}

/**
 * Initialize the content script
 */
function initialize() {
    console.log('Initializing Frame Docs content script');
    console.log('Document ready state:', document.readyState);
    
    // Run detection based on current document state
    if (document.readyState === 'loading') {
        // Still loading, wait for DOM
        document.addEventListener('DOMContentLoaded', detectAndShowButton);
    } else {
        // DOM already loaded
        detectAndShowButton();
    }
}

// ============================================
// MESSAGE LISTENERS
// ============================================

/**
 * Listen for messages from background script or popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    if (request.action === 'generateFromPage') {
        // Triggered from context menu or popup
        handleButtonClick();
        sendResponse({ success: true });
    } else if (request.action === 'checkIfDocumentation') {
        // Check if current page is documentation
        const isDoc = isDocumentationPage();
        sendResponse({ isDocumentation: isDoc });
    } else if (request.action === 'toggleButton') {
        // Toggle button visibility
        const button = document.getElementById(CONFIG.buttonId);
        if (button) {
            removeFloatingButton();
            sendResponse({ action: 'removed' });
        } else {
            createFloatingButton();
            sendResponse({ action: 'created' });
        }
    }
    
    return true; // Keep message channel open for async response
});

// ============================================
// START EXECUTION
// ============================================

// Initialize when script loads
initialize();

// Log successful initialization
console.log('Frame Docs content script initialization complete');