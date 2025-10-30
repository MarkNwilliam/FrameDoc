// Frame Docs - Enhanced Popup Script with Chrome Built-in AI APIs
const API_URL = 'http://localhost:3000';

let currentPageContent = '';
let currentPageTitle = '';
let currentPageUrl = '';
let currentTabId = null;
let currentPageStructure = null;
let currentCodeExamples = [];

// Initialize popup with enhanced capabilities
document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentPageInfo();
    setupEventListeners();
    checkAIAvailability();
    setupKeepAlive();
    loadUserSettings();
});

// Keep service worker alive
function setupKeepAlive() {
    try {
        const port = chrome.runtime.connect({ name: 'keepAlive' });
        port.onMessage.addListener((msg) => {
            if (msg.keepAlive) {
                port.postMessage({ keepAlive: true });
            }
        });
        
        port.onDisconnect.addListener(() => {
            console.log('Keep-alive port disconnected');
        });
    } catch (error) {
        console.log('Could not setup keep-alive:', error);
    }
}

// Load user settings from storage
async function loadUserSettings() {
    try {
        const result = await chrome.storage.local.get(['frameDocsSettings']);
        if (result.frameDocsSettings) {
            const settings = result.frameDocsSettings;
            
            // Restore AI API preferences
            if (settings.usePrompt !== undefined) {
                document.getElementById('usePrompt').checked = settings.usePrompt;
            }
            if (settings.useSummarizer !== undefined) {
                document.getElementById('useSummarizer').checked = settings.useSummarizer;
            }
            if (settings.useWriter !== undefined) {
                document.getElementById('useWriter').checked = settings.useWriter;
            }
            if (settings.useRewriter !== undefined) {
                document.getElementById('useRewriter').checked = settings.useRewriter;
            }
            
            // Restore custom description if any
            if (settings.lastCustomDescription) {
                document.getElementById('customDescription').value = settings.lastCustomDescription;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save user settings to storage
async function saveUserSettings() {
    try {
        const settings = {
            usePrompt: document.getElementById('usePrompt').checked,
            useSummarizer: document.getElementById('useSummarizer').checked,
            useWriter: document.getElementById('useWriter').checked,
            useRewriter: document.getElementById('useRewriter').checked,
            lastCustomDescription: document.getElementById('customDescription').value,
            lastUpdated: Date.now()
        };
        
        await chrome.storage.local.set({ frameDocsSettings: settings });
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

// Enhanced page info loading
async function loadCurrentPageInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab) {
            currentTabId = tab.id;
            currentPageUrl = tab.url;
            currentPageTitle = tab.title;
            
            // Update UI with page info
            document.getElementById('pageTitle').textContent = currentPageTitle || 'Untitled Page';
            document.getElementById('pageUrl').textContent = currentPageUrl || '';
            document.getElementById('tabId').textContent = `Tab ID: ${tab.id}`;
            
            // Check for saved text selection
            await checkForSavedSelection(tab.url);
            
            // Try to get enhanced page structure info
            await loadEnhancedPageInfo(tab.id);
            
            // Auto-extract if enabled and page looks like documentation
            if (await shouldAutoExtract(tab)) {
                setTimeout(() => handleExtractContent(), 500);
            }
        } else {
            showStatus('No active tab found', 'error');
        }
    } catch (error) {
        console.error('Error loading page info:', error);
        showStatus('Failed to load page info', 'error');
    }
}

// Check for saved text selection from context menu
async function checkForSavedSelection(tabUrl) {
    try {
        const storage = await chrome.storage.local.get(['lastSelection', 'lastSelectionUrl']);
        if (storage.lastSelection && storage.lastSelectionUrl === tabUrl) {
            document.getElementById('customDescription').value = storage.lastSelection;
            showStatus('📝 Using your text selection', 'info');
            
            // Clear the saved selection after use
            await chrome.storage.local.remove(['lastSelection', 'lastSelectionUrl']);
        }
    } catch (error) {
        console.error('Error checking saved selection:', error);
    }
}

// Load enhanced page structure information
async function loadEnhancedPageInfo(tabId) {
    try {
        const pageInfo = await chrome.tabs.sendMessage(tabId, { action: 'getPageInfo' });
        if (pageInfo && pageInfo.structure) {
            currentPageStructure = pageInfo.structure;
            updatePageStructureDisplay(pageInfo.structure);
        }
    } catch (error) {
        console.log('Could not get enhanced page info:', error);
        currentPageStructure = null;
    }
}

// Update UI with page structure information
function updatePageStructureDisplay(structure) {
    const structureInfo = document.getElementById('pageStructure');
    if (!structureInfo) return;
    
    const elements = [];
    if (structure.hasHeadings) elements.push('📚 Headings');
    if (structure.hasCode) elements.push('💻 Code');
    if (structure.hasLists) elements.push('📝 Lists');
    if (structure.hasImages) elements.push('🖼️ Images');
    
    structureInfo.innerHTML = `
        <div class="structure-label">Page Structure:</div>
        <div class="structure-elements">${elements.join(' • ')}</div>
        <div class="structure-sections">${structure.estimatedSections} estimated sections</div>
    `;
}

// Determine if auto-extraction should occur
async function shouldAutoExtract(tab) {
    try {
        const settings = await chrome.storage.local.get(['frameDocsSettings']);
        if (!settings.frameDocsSettings?.autoExtract) return false;
        
        // Check if page looks like documentation
        return currentPageStructure && 
               (currentPageStructure.hasHeadings || currentPageStructure.hasCode);
    } catch (error) {
        return false;
    }
}

// Enhanced event listeners setup
function setupEventListeners() {
    // Main action buttons
    document.getElementById('generateBtn').addEventListener('click', handleGenerateVideo);
    document.getElementById('extractBtn').addEventListener('click', handleExtractContent);
    
    // Quick action buttons
    document.getElementById('quickTutorial').addEventListener('click', () => handleQuickVideo('tutorial'));
    document.getElementById('quickSummary').addEventListener('click', () => handleQuickVideo('summary'));
    document.getElementById('quickCode').addEventListener('click', () => handleQuickVideo('code'));
    
    // Advanced buttons
    document.getElementById('advancedBtn').addEventListener('click', showAdvancedOptions);
    document.getElementById('historyBtn').addEventListener('click', showVideoHistory);
    
    // Settings auto-save
    const aiCheckboxes = document.querySelectorAll('.api-option input[type="checkbox"]');
    aiCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', saveUserSettings);
    });
    
    // Custom description auto-save with debounce
    let descriptionTimeout;
    document.getElementById('customDescription').addEventListener('input', () => {
        clearTimeout(descriptionTimeout);
        descriptionTimeout = setTimeout(saveUserSettings, 1000);
    });
}

// Enhanced content extraction with comprehensive error handling
async function handleExtractContent() {
    showStatus('Extracting page content with enhanced analysis...', 'processing');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab) {
            showStatus('No active tab found', 'error');
            return;
        }

        // Ensure content script is available and responsive
        await ensureContentScript(tab.id);
        
        // Extract content with enhanced data
        const response = await chrome.tabs.sendMessage(tab.id, { 
            action: 'extractContent',
            source: 'popup'
        });
        
        if (response && response.success) {
            currentPageContent = response.content;
            currentPageStructure = response.structure;
            currentCodeExamples = response.codeExamples || [];
            
            // Store enhanced data for later use
            await chrome.storage.local.set({
                lastExtraction: {
                    content: response.content,
                    structure: response.structure,
                    codeExamples: response.codeExamples,
                    timestamp: Date.now(),
                    url: tab.url,
                    title: tab.title
                }
            });
            
            const successMessage = `✅ Extracted ${response.content.length} chars`;
            const extras = [];
            if (response.codeExamples.length > 0) extras.push(`${response.codeExamples.length} code examples`);
            if (response.structure.estimatedSections > 0) extras.push(`${response.structure.estimatedSections} sections`);
            
            showStatus(extras.length > 0 ? `${successMessage} (${extras.join(', ')})` : successMessage, 'success');
            
            // Auto-process with AI if content looks good
            if (response.content.length > 100) {
                await processContentWithAI(response.structure, response.codeExamples);
            }
            
        } else {
            throw new Error(response?.error || 'Extraction failed without error details');
        }
        
    } catch (error) {
        console.error('Error extracting content:', error);
        
        if (error.message.includes('Could not establish connection')) {
            showStatus('🔧 Extension context issue. Please refresh the page and try again.', 'error');
            showManualExtractionOption();
        } else {
            showStatus(`Failed to extract content: ${error.message}`, 'error');
            showManualExtractionOption();
        }
    }
}

// Ensure content script is available and responsive
async function ensureContentScript(tabId) {
    try {
        // Test if content script is responsive
        const pingResponse = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
        if (pingResponse && pingResponse.contextValid !== false) {
            return true;
        }
    } catch (error) {
        console.log('Content script not responsive, injecting fresh script...');
    }
    
    // Inject content script
    try {
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        
        // Wait for script to initialize
        await new Promise(resolve => setTimeout(resolve, 800));
        return true;
    } catch (injectError) {
        console.error('Failed to inject content script:', injectError);
        throw new Error('Could not establish connection with the page. Please refresh the page and try again.');
    }
}

// Show manual extraction option when automated extraction fails
function showManualExtractionOption() {
    const status = document.getElementById('status');
    const manualExtractDiv = document.createElement('div');
    manualExtractDiv.style.marginTop = '10px';
    manualExtractDiv.innerHTML = `
        <button id="manualExtract" class="button button-secondary" style="font-size: 12px; padding: 8px; margin-right: 8px;">
            Try Manual Extraction
        </button>
        <button id="refreshPage" class="button button-secondary" style="font-size: 12px; padding: 8px;">
            Refresh Page & Retry
        </button>
    `;
    
    status.appendChild(manualExtractDiv);
    
    document.getElementById('manualExtract').addEventListener('click', async () => {
        await performManualExtraction();
    });
    
    document.getElementById('refreshPage').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.reload(tab.id);
            showStatus('Refreshing page...', 'processing');
            setTimeout(() => {
                showStatus('Page refreshed. Please try extraction again.', 'info');
            }, 2000);
        }
    });
}

// Perform manual content extraction as fallback
async function performManualExtraction() {
    showStatus('Performing manual extraction...', 'processing');
    
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                try {
                    const clone = document.cloneNode(true);
                    const elementsToRemove = clone.querySelectorAll(
                        'script, style, nav, footer, header, aside, .ad, .advertisement, .navbar, .menu'
                    );
                    elementsToRemove.forEach(el => el.remove());
                    
                    const mainContent = clone.querySelector('main, article, .content, #content, .documentation, .doc-content');
                    const content = mainContent ? mainContent.innerText : clone.body.innerText;
                    
                    return {
                        success: true,
                        content: content.replace(/\s+/g, ' ').trim(),
                        manual: true
                    };
                } catch (error) {
                    return { success: false, error: error.message };
                }
            }
        });
        
        if (results[0]?.result?.success) {
            currentPageContent = results[0].result.content;
            showStatus(`✅ Manually extracted ${currentPageContent.length} characters`, 'success');
            await processContentWithAI();
        } else {
            throw new Error(results[0]?.result?.error || 'Manual extraction failed');
        }
    } catch (error) {
        console.error('Manual extraction failed:', error);
        showStatus('Manual extraction also failed. The page may be restricted.', 'error');
    }
}

// Enhanced AI processing with structure awareness
async function processContentWithAI(structure = null, codeExamples = []) {
    const usePrompt = document.getElementById('usePrompt').checked;
    const useSummarizer = document.getElementById('useSummarizer').checked;
    const useWriter = document.getElementById('useWriter').checked;
    const useRewriter = document.getElementById('useRewriter').checked;
    
    let processedContent = currentPageContent;
    let videoStructure = null;

    // Update structure and code examples if provided
    if (structure) currentPageStructure = structure;
    if (codeExamples) currentCodeExamples = codeExamples;

    try {
        // Step 1: Summarize content if enabled
        if (useSummarizer && 'ai' in window && 'summarizer' in window.ai) {
            showStatus('📄 Summarizing content with AI...', 'processing');
            
            try {
                const summarizer = await window.ai.summarizer.create({
                    type: 'key-points',
                    format: 'plain-text',
                    length: 'medium'
                });
                
                const summary = await summarizer.summarize(processedContent);
                processedContent = summary;
                console.log('Summarized content length:', summary.length);
            } catch (e) {
                console.log('Summarizer failed:', e.message);
            }
        }

        // Step 2: Use Prompt API to generate video JSON structure
        if (usePrompt && 'ai' in window && 'languageModel' in window.ai) {
            showStatus('💭 Generating video structure with AI...', 'processing');
            
            try {
                const session = await window.ai.languageModel.create({
                    systemPrompt: `You are an expert at creating educational video content from technical documentation. 
                    Generate a JSON structure for a Manim video with the following format:
                    
                    {
                        "title": "Main video title",
                        "subtitle": "Video subtitle", 
                        "title_voiceover": "Voiceover text for title section",
                        "output_filename": "video_filename",
                        "blocks": [
                            {
                                "type": "code",
                                "title": "Block title",
                                "code": "code content here",
                                "language": "python",
                                "voiceover": "Voiceover explanation"
                            },
                            {
                                "type": "list",
                                "title": "List title", 
                                "items": ["item1", "item2", "item3"],
                                "voiceover": "Voiceover explanation"
                            }
                        ]
                    }
                    
                    Rules for generating blocks:
                    - Include 3-6 blocks total
                    - Mix code and list blocks appropriately based on content type
                    - For technical content, include relevant code examples
                    - For conceptual content, use list blocks for key points
                    - Each block should have clear educational value
                    - Voiceovers should be concise and explanatory (10-20 words)
                    - Code blocks should show practical, runnable examples
                    - List blocks should highlight important concepts
                    - Ensure logical flow from introduction to conclusion`
                });
                
                // Build enhanced prompt with structure information
                let prompt = `Create a video JSON structure for this content about "${currentPageTitle}":\n\n`;
                prompt += `Content: ${processedContent.substring(0, 3500)}\n\n`;
                
                // Add structure hints to AI
                if (currentPageStructure) {
                    prompt += `Page Analysis:\n`;
                    if (currentPageStructure.hasCode) prompt += `- Contains code examples\n`;
                    if (currentPageStructure.hasHeadings) prompt += `- Has clear section structure\n`;
                    if (currentPageStructure.estimatedSections > 0) prompt += `- Approximately ${currentPageStructure.estimatedSections} main sections\n`;
                }
                
                if (currentCodeExamples.length > 0) {
                    prompt += `- ${currentCodeExamples.length} code examples available\n`;
                }
                
                prompt += `\nGenerate a complete, valid JSON structure following the exact format above. Focus on creating an engaging educational video.`;
                
                const response = await session.prompt(prompt);
                
                // Extract JSON from response with multiple fallback patterns
                const jsonMatch = response.match(/\{[\s\S]*\}/) || 
                                 response.match(/\{[\s\S]*\}$/) ||
                                 response.match(/```json\n([\s\S]*?)\n```/);
                
                let jsonString = jsonMatch ? jsonMatch[0] : null;
                if (jsonMatch && jsonMatch[1]) {
                    jsonString = jsonMatch[1]; // Handle ```json ``` blocks
                }
                
                if (jsonString) {
                    try {
                        videoStructure = JSON.parse(jsonString);
                        console.log('AI-generated video structure:', videoStructure);
                        
                        // Enhance structure with actual code examples if available
                        if (currentCodeExamples.length > 0) {
                            videoStructure = enhanceWithRealCodeExamples(videoStructure, currentCodeExamples);
                        }
                        
                    } catch (e) {
                        console.log('Failed to parse JSON from AI response:', e.message);
                        console.log('Raw JSON string:', jsonString);
                    }
                } else {
                    console.log('No JSON found in AI response');
                }
                
                await session.destroy();
            } catch (e) {
                console.log('Prompt API failed:', e.message);
            }
        }

        // Step 3: Enhance with Writer API if enabled and we have a structure
        if (useWriter && videoStructure && 'ai' in window && 'writer' in window.ai) {
            showStatus('✏️ Enhancing script quality...', 'processing');
            
            try {
                const writer = await window.ai.writer.create({
                    tone: 'educational',
                    format: 'plain-text',
                    length: 'medium'
                });
                
                // Enhance voiceovers
                for (const block of videoStructure.blocks) {
                    if (block.voiceover) {
                        const enhancedVoiceover = await writer.write(
                            `Improve this educational voiceover to be more engaging and clear: "${block.voiceover}"`
                        );
                        block.voiceover = enhancedVoiceover.substring(0, 150); // Limit length
                    }
                }
            } catch (e) {
                console.log('Writer API failed:', e.message);
            }
        }

        // If AI failed to generate structure, create an intelligent fallback
        if (!videoStructure) {
            videoStructure = createIntelligentFallbackStructure(processedContent);
        }

        // Display video summary to user
        displayVideoSummary(videoStructure);
        
        showStatus('✅ Video structure generated!', 'success');
        
    } catch (error) {
        console.error('AI processing error:', error);
        showStatus(`⚠️ AI processing error: ${error.message}`, 'error');
        
        // Show fallback structure even on AI errors
        const fallbackStructure = createIntelligentFallbackStructure(processedContent);
        displayVideoSummary(fallbackStructure);
    }
}

// Enhance AI structure with real code examples from the page
function enhanceWithRealCodeExamples(videoStructure, codeExamples) {
    // Find code blocks in the structure and replace with real examples
    const codeBlocks = videoStructure.blocks.filter(block => block.type === 'code');
    const availableExamples = [...codeExamples];
    
    codeBlocks.forEach((block, index) => {
        if (availableExamples.length > 0 && block.code.includes('Example code')) {
            const example = availableExamples.shift();
            block.code = example.code.substring(0, 500); // Limit code length
            if (example.language && example.language !== 'text') {
                block.language = example.language;
            }
            block.voiceover = block.voiceover.replace('example', 'actual example from the documentation');
        }
    });
    
    return videoStructure;
}

// Create intelligent fallback structure based on content analysis
function createIntelligentFallbackStructure(content) {
    const title = currentPageTitle || 'Documentation Video';
    const blocks = [];
    
    // Analyze content to create appropriate blocks
    const hasCode = content.includes('function') || content.includes('def ') || content.includes('class ') || 
                   content.includes('var ') || content.includes('const ') || currentCodeExamples.length > 0;
    
    const wordCount = content.split(' ').length;
    const isTechnical = hasCode || wordCount > 500;
    
    // Always start with introduction
    blocks.push({
        type: "list",
        title: "Introduction & Overview",
        items: [
            "What we'll cover in this video",
            "Key learning objectives",
            "Prerequisites and setup"
        ],
        voiceover: "Welcome! In this video, we'll explore the main concepts and practical applications."
    });
    
    // Add code block if technical
    if (hasCode && currentCodeExamples.length > 0) {
        const firstExample = currentCodeExamples[0];
        blocks.push({
            type: "code",
            title: "Practical Example",
            code: firstExample.code.substring(0, 300),
            language: firstExample.language !== 'text' ? firstExample.language : 'python',
            voiceover: "Let's look at a practical code example from the documentation."
        });
    } else if (hasCode) {
        blocks.push({
            type: "code",
            title: "Code Implementation",
            code: "// Practical code example\nfunction example() {\n  console.log('Hello, World!');\n}",
            language: "javascript",
            voiceover: "Here's how you can implement these concepts in code."
        });
    }
    
    // Add key concepts block
    blocks.push({
        type: "list",
        title: "Key Concepts",
        items: [
            "Core principles and fundamentals",
            "Important terminology",
            "Best practices to follow"
        ],
        voiceover: "Understanding these key concepts is essential for mastery."
    });
    
    // Add conclusion
    blocks.push({
        type: "list",
        title: "Summary & Next Steps",
        items: [
            "Key takeaways from this video",
            "How to apply this knowledge",
            "Recommended next learning steps"
        ],
        voiceover: "Let's recap what we've learned and discuss where to go from here."
    });
    
    return {
        title: title,
        subtitle: isTechnical ? 'Technical Guide' : 'Learning Guide',
        title_voiceover: `Welcome to this video about ${title}. We'll break down the concepts and show practical examples.`,
        output_filename: `frame_docs_${Date.now()}`,
        blocks: blocks
    };
}

// Quick video generation templates
// Quick video generation templates
async function handleQuickVideo(type) {
    const customDescription = document.getElementById('customDescription').value;
    
    const templates = {
        tutorial: {
            title: `${currentPageTitle} - Step by Step Tutorial`,
            subtitle: 'Complete Beginner Guide',
            title_voiceover: `Learn ${currentPageTitle} from scratch with this step-by-step tutorial.`,
            output_filename: `tutorial_${Date.now()}`,
            blocks: [
                {
                    type: "list",
                    title: "Getting Started",
                    items: [
                        "What you'll learn and build",
                        "Setup and installation",
                        "Basic concepts overview"
                    ],
                    voiceover: "Let's start from the beginning and build up your understanding step by step."
                },
                {
                    type: "code",
                    title: "First Steps",
                    code: "# Your first code here\nprint('Hello, Tutorial!')\n\n# Follow along and code with me",
                    language: "python",
                    voiceover: "Here's your first hands-on example. Feel free to code along with me."
                },
                {
                    type: "list",
                    title: "Core Concepts",
                    items: [
                        "Understanding the fundamentals",
                        "Common patterns and practices",
                        "Tips for success"
                    ],
                    voiceover: "These core concepts will form the foundation of your knowledge."
                },
                {
                    type: "list",
                    title: "Next Steps & Practice",
                    items: [
                        "Practice exercises to try",
                        "Real-world applications",
                        "Where to learn more"
                    ],
                    voiceover: "Now that you understand the basics, here's how to continue your learning journey."
                }
            ]
        },
        summary: {
            title: `${currentPageTitle} - Key Points Summary`,
            subtitle: 'Essential Concepts Overview',
            title_voiceover: `Quick summary of the most important concepts from ${currentPageTitle}.`,
            output_filename: `summary_${Date.now()}`,
            blocks: [
                {
                    type: "list",
                    title: "Main Takeaways",
                    items: [
                        "The most important concepts",
                        "Key insights and revelations",
                        "Critical things to remember"
                    ],
                    voiceover: "Here are the essential takeaways you need to remember."
                },
                {
                    type: "list",
                    title: "Practical Applications",
                    items: [
                        "How to use this in real projects",
                        "Common use cases",
                        "Integration with other tools"
                    ],
                    voiceover: "Let's look at how you can apply these concepts in practice."
                },
                {
                    type: "list",
                    title: "Quick Reference",
                    items: [
                        "Commands and syntax",
                        "Configuration examples",
                        "Troubleshooting tips"
                    ],
                    voiceover: "Keep this quick reference handy for when you need it."
                }
            ]
        },
        code: {
            title: `${currentPageTitle} - Code Examples & Patterns`,
            subtitle: 'Practical Implementation Guide',
            title_voiceover: `Deep dive into code examples and implementation patterns for ${currentPageTitle}.`,
            output_filename: `code_examples_${Date.now()}`,
            blocks: [
                {
                    type: "code",
                    title: "Basic Implementation",
                    code: "// Basic setup and configuration\nconst example = new Example();\n\nexample.configure({\n  setting: 'value',\n  enabled: true\n});",
                    language: "javascript",
                    voiceover: "Let's start with the basic setup and configuration you'll need."
                },
                {
                    type: "code",
                    title: "Advanced Patterns",
                    code: "// Advanced usage and patterns\nclass AdvancedExample {\n  constructor() {\n    this.feature = 'advanced';\n  }\n  \n  advancedMethod() {\n    return 'complex implementation';\n  }\n}",
                    language: "javascript",
                    voiceover: "Now let's look at more advanced patterns and best practices."
                },
                {
                    type: "list",
                    title: "Best Practices",
                    items: [
                        "Code organization tips",
                        "Performance considerations",
                        "Common pitfalls to avoid"
                    ],
                    voiceover: "Follow these best practices to write maintainable and efficient code."
                },
                {
                    type: "code",
                    title: "Real-world Example",
                    code: "// Complete working example\nfunction realWorldUsage() {\n  const data = fetchData();\n  const processed = processData(data);\n  return saveResults(processed);\n}",
                    language: "javascript",
                    voiceover: "Here's a complete example showing how this works in a real application."
                }
            ]
        }
    };
    
    const template = templates[type];
    if (template) {
        // Enhance template with custom description if available
        if (customDescription) {
            template.title_voiceover = customDescription.substring(0, 200);
        }
        
        displayVideoSummary(template);
        showStatus(`✅ ${type.charAt(0).toUpperCase() + type.slice(1)} template loaded!`, 'success');
    }
}

// Enhanced video summary display
function displayVideoSummary(videoStructure) {
    let summaryDiv = document.getElementById('videoSummary');
    
    if (!summaryDiv) {
        // Create summary section if it doesn't exist
        summaryDiv = document.createElement('div');
        summaryDiv.id = 'videoSummary';
        summaryDiv.className = 'video-summary';
        summaryDiv.innerHTML = `
            <div class="summary-header">
                <h3>🎬 Video Summary Preview</h3>
                <button id="hideSummary" class="summary-close">×</button>
            </div>
            <div id="summaryContent" class="summary-content"></div>
        `;
        
        document.querySelector('.controls').insertBefore(summaryDiv, document.getElementById('status'));
        
        // Add hide functionality
        document.getElementById('hideSummary').addEventListener('click', () => {
            summaryDiv.style.display = 'none';
            showStatus('Video summary hidden. Click "Generate Video" to show again.', 'info');
        });
    } else {
        summaryDiv.style.display = 'block';
    }
    
    // Populate summary content
    let summaryHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <label>Title:</label>
                <div class="summary-value">${videoStructure.title}</div>
            </div>
            <div class="summary-item">
                <label>Subtitle:</label>
                <div class="summary-value">${videoStructure.subtitle}</div>
            </div>
            <div class="summary-item">
                <label>Duration:</label>
                <div class="summary-value">${videoStructure.blocks.length} blocks (~${Math.round(videoStructure.blocks.length * 1.5)} minutes)</div>
            </div>
        </div>
        
        <div class="blocks-preview">
            <h4>Content Outline:</h4>
            <div class="blocks-list">
    `;
    
    videoStructure.blocks.forEach((block, index) => {
        const icon = block.type === 'code' ? '💻' : '📝';
        summaryHTML += `
            <div class="block-item">
                <div class="block-icon">${icon}</div>
                <div class="block-info">
                    <div class="block-title">${block.title}</div>
                    <div class="block-type">${block.type.toUpperCase()}</div>
                </div>
                <div class="block-number">${index + 1}</div>
            </div>
        `;
    });
    
    summaryHTML += `
            </div>
        </div>
        
        <div class="summary-actions">
            <button id="editStructure" class="button button-secondary">
                ✏️ Edit Structure
            </button>
            <button id="regenerateStructure" class="button button-secondary">
                🔄 Regenerate
            </button>
            <button id="proceedWithStructure" class="button button-primary">
                🚀 Generate Video
            </button>
        </div>
        
        <div class="summary-tips">
            <small>💡 Tip: The video will take 2-5 minutes to generate. You can close this popup while it processes.</small>
        </div>
    `;
    
    document.getElementById('summaryContent').innerHTML = summaryHTML;
    
    // Add event listeners for new buttons
    document.getElementById('editStructure').addEventListener('click', () => {
        showStructureEditor(videoStructure);
    });
    
    document.getElementById('regenerateStructure').addEventListener('click', () => {
        summaryDiv.remove();
        showStatus('Regenerating video structure...', 'processing');
        setTimeout(() => processContentWithAI(), 500);
    });
    
    document.getElementById('proceedWithStructure').addEventListener('click', () => {
        generateVideoWithStructure(videoStructure);
    });
    
    // Scroll to summary smoothly
    setTimeout(() => {
        summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

// Show structure editor for manual adjustments
function showStructureEditor(videoStructure) {
    // Simple editor for demo - in production, this would be more sophisticated
    const newTitle = prompt('Edit video title:', videoStructure.title);
    if (newTitle !== null) {
        videoStructure.title = newTitle;
        displayVideoSummary(videoStructure);
        showStatus('Title updated!', 'success');
    }
}

// Enhanced video generation with progress tracking
async function generateVideoWithStructure(videoStructure) {
    showStatus('🚀 Starting video generation...', 'processing');
    
    try {
        // Show generation overlay
        showGenerationOverlay();
        
        const response = await fetch(`${API_URL}/generate_manim_video`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(videoStructure)
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.status === 'success') {
            showStatus('✅ Video generated successfully!', 'success');
            
            // Display video result
            displayVideoResult(result);
            
            // Save to history
            await saveToHistory(result);
            
            // Show success notification
            await chrome.runtime.sendMessage({
                action: 'showNotification',
                title: 'Frame Docs - Video Ready!',
                message: `Your video "${videoStructure.title}" is ready to watch.`
            });
            
        } else {
            throw new Error(result.message || 'Video generation failed');
        }
        
    } catch (error) {
        console.error('Error generating video:', error);
        
        let errorMessage = 'Video generation failed: ';
        if (error.message.includes('Failed to fetch')) {
            errorMessage += 'Cannot connect to the video generation service. Make sure the backend server is running at ' + API_URL;
        } else if (error.message.includes('Server responded')) {
            errorMessage += error.message;
        } else {
            errorMessage += error.message;
        }
        
        showStatus(`❌ ${errorMessage}`, 'error');
        
        // Show retry option
        showRetryOption(videoStructure);
    } finally {
        hideGenerationOverlay();
    }
}

// Show generation progress overlay
function showGenerationOverlay() {
    let overlay = document.getElementById('generationOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'generationOverlay';
        overlay.className = 'generation-overlay';
        overlay.innerHTML = `
            <div class="generation-content">
                <div class="loading-spinner large"></div>
                <h3>Generating Your Video</h3>
                <p>This may take 2-5 minutes depending on video length...</p>
                <div class="progress-steps">
                    <div class="step active">🔄 Processing content</div>
                    <div class="step">🎬 Generating scenes</div>
                    <div class="step">🎵 Adding voiceovers</div>
                    <div class="step">📹 Rendering video</div>
                </div>
                <div class="progress-hint">
                    <small>You can close this popup - the video will continue generating in the background</small>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.classList.add('show');
}

// Hide generation overlay
function hideGenerationOverlay() {
    const overlay = document.getElementById('generationOverlay');
    if (overlay) {
        overlay.classList.remove('show');
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }
}

// Show retry option when generation fails
function showRetryOption(videoStructure) {
    const status = document.getElementById('status');
    const retryDiv = document.createElement('div');
    retryDiv.style.marginTop = '10px';
    retryDiv.innerHTML = `
        <button id="retryGeneration" class="button button-primary" style="font-size: 12px; padding: 8px; margin-right: 8px;">
            🔄 Retry Generation
        </button>
        <button id="tryDifferentStructure" class="button button-secondary" style="font-size: 12px; padding: 8px;">
            🎨 Try Different Structure
        </button>
    `;
    
    status.appendChild(retryDiv);
    
    document.getElementById('retryGeneration').addEventListener('click', () => {
        retryDiv.remove();
        generateVideoWithStructure(videoStructure);
    });
    
    document.getElementById('tryDifferentStructure').addEventListener('click', () => {
        retryDiv.remove();
        document.getElementById('videoSummary')?.remove();
        processContentWithAI();
    });
}

// Enhanced video result display
function displayVideoResult(result) {
    const videoResult = document.getElementById('videoResult');
    if (!videoResult) return;
    
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const videoLink = document.getElementById('videoLink');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // Set video source and load
    if (videoSource && videoPlayer) {
        videoSource.src = result.video_url;
        videoPlayer.load();
    }
    
    // Update links
    if (videoLink) {
        videoLink.href = result.video_url;
        videoLink.textContent = `🎬 Open ${result.filename || 'Video'}`;
    }
    
    if (downloadBtn) {
        downloadBtn.href = result.video_url;
        downloadBtn.download = result.filename || 'frame_docs_video.mp4';
        downloadBtn.textContent = '💾 Download Video';
    }
    
    // Update metadata
    if (result.file_size) {
        const sizeMB = (result.file_size / (1024 * 1024)).toFixed(2);
        const sizeElement = document.getElementById('videoSize');
        if (sizeElement) sizeElement.textContent = `${sizeMB} MB`;
    }
    
    const genTimeElement = document.getElementById('genTime');
    if (genTimeElement) {
        genTimeElement.textContent = `${result.generation_time || 'N/A'}`;
    }
    
    // Set duration when metadata loads
    if (videoPlayer) {
        videoPlayer.addEventListener('loadedmetadata', () => {
            const duration = Math.round(videoPlayer.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            const durationElement = document.getElementById('videoDuration');
            if (durationElement) {
                durationElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, { once: true });
    }
    
    // Show video result section
    videoResult.classList.add('show');
    
    // Scroll to video result
    setTimeout(() => {
        videoResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// Enhanced main generate video handler
async function handleGenerateVideo() {
    const customDescription = document.getElementById('customDescription').value;
    
    // Check if we already have a video summary visible
    const existingSummary = document.getElementById('videoSummary');
    if (existingSummary && existingSummary.style.display !== 'none') {
        showStatus('Use the buttons in the video summary to proceed', 'info');
        return;
    }
    
    // If no content extracted yet, do that first
    if (!currentPageContent && !customDescription) {
        showStatus('Extracting content first...', 'processing');
        await handleExtractContent();
        
        if (!currentPageContent && !customDescription) {
            showStatus('Please extract content first or add custom instructions', 'error');
            return;
        }
    }
    
    // If we have custom description but no AI processing happened
    if (customDescription && !existingSummary) {
        const basicStructure = {
            title: currentPageTitle,
            subtitle: 'Custom Video',
            title_voiceover: customDescription.substring(0, 200),
            output_filename: `custom_${Date.now()}`,
            blocks: [
                {
                    type: "list",
                    title: "Main Points",
                    items: [
                        "Key concept 1",
                        "Important detail 2", 
                        "Practical application 3"
                    ],
                    voiceover: customDescription.substring(0, 150)
                }
            ]
        };
        
        displayVideoSummary(basicStructure);
    } else if (!existingSummary) {
        // Trigger AI processing if no summary exists
        showStatus('Processing content with AI...', 'processing');
        await processContentWithAI();
    }
}

// Enhanced save to history
async function saveToHistory(videoData) {
    try {
        const historyResult = await chrome.storage.local.get(['videoHistory']);
        const videos = historyResult.videoHistory || [];
        
        const videoEntry = {
            title: currentPageTitle,
            url: videoData.video_url,
            filename: videoData.filename,
            fileSize: videoData.file_size,
            timestamp: Date.now(),
            pageUrl: currentPageUrl,
            generationTime: videoData.generation_time,
            blocksCount: videoData.blocks_processed || 0
        };
        
        videos.unshift(videoEntry);
        
        // Keep only last 50 videos
        if (videos.length > 50) {
            videos.splice(50);
        }
        
        await chrome.storage.local.set({ videoHistory: videos });
        console.log('Video saved to history:', videoEntry);
        
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

// Show advanced options
function showAdvancedOptions() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('generator.html?advanced=true')
    });
}

// Show video history
async function showVideoHistory() {
    try {
        const history = await chrome.storage.local.get(['videoHistory']);
        if (history.videoHistory && history.videoHistory.length > 0) {
            chrome.tabs.create({
                url: chrome.runtime.getURL('generator.html?history=true')
            });
        } else {
            showStatus('No video history yet', 'info');
        }
    } catch (error) {
        console.error('Error showing history:', error);
        showStatus('Error loading video history', 'error');
    }
}

// Enhanced status display
function showStatus(message, type) {
    const status = document.getElementById('status');
    if (!status) return;
    
    status.textContent = '';
    status.className = `status ${type} show`;
    
    // Add spinner for processing states
    if (type === 'processing') {
        const spinner = document.createElement('span');
        spinner.className = 'loading-spinner';
        status.appendChild(spinner);
    }
    
    // Add appropriate emoji based on type
    let emoji = '';
    switch (type) {
        case 'success': emoji = '✅ '; break;
        case 'error': emoji = '❌ '; break;
        case 'info': emoji = '💡 '; break;
        case 'processing': emoji = '⏳ '; break;
    }
    
    const textNode = document.createTextNode(emoji + message);
    status.appendChild(textNode);
    
    // Auto-hide success/info messages after delay
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            status.classList.remove('show');
        }, 5000);
    }
    
    // Auto-hide processing messages after longer delay (they should be manually cleared)
    if (type === 'processing') {
        setTimeout(() => {
            if (status.classList.contains('show') && status.textContent.includes(message)) {
                status.classList.remove('show');
            }
        }, 30000);
    }
}

// Check Chrome AI API availability
async function checkAIAvailability() {
    const capabilities = {
        prompt: false,
        summarizer: false,
        writer: false,
        rewriter: false
    };

    try {
        if ('ai' in window) {
            console.log('✅ Chrome AI APIs available');
            
            // Check Prompt API
            if ('languageModel' in window.ai) {
                try {
                    const availability = await window.ai.languageModel.capabilities();
                    capabilities.prompt = availability.available !== 'no';
                    updateAICapabilityUI('prompt', capabilities.prompt);
                } catch (e) {
                    console.log('Prompt API check failed:', e.message);
                }
            }

            // Check Summarizer API
            if ('summarizer' in window.ai) {
                try {
                    const availability = await window.ai.summarizer.capabilities();
                    capabilities.summarizer = availability.available !== 'no';
                    updateAICapabilityUI('summarizer', capabilities.summarizer);
                } catch (e) {
                    console.log('Summarizer API check failed:', e.message);
                }
            }

            // Check Writer API
            if ('writer' in window.ai) {
                try {
                    const availability = await window.ai.writer.capabilities();
                    capabilities.writer = availability.available !== 'no';
                    updateAICapabilityUI('writer', capabilities.writer);
                } catch (e) {
                    console.log('Writer API check failed:', e.message);
                }
            }

            // Check Rewriter API
            if ('rewriter' in window.ai) {
                try {
                    const availability = await window.ai.rewriter.capabilities();
                    capabilities.rewriter = availability.available !== 'no';
                    updateAICapabilityUI('rewriter', capabilities.rewriter);
                } catch (e) {
                    console.log('Rewriter API check failed:', e.message);
                }
            }
        } else {
            console.warn('⚠️ Chrome AI APIs not available. Please enable Chrome flags.');
            showStatus('AI APIs not available - using basic features', 'info');
        }

        console.log('AI Capabilities:', capabilities);
    } catch (error) {
        console.error('Error checking AI availability:', error);
    }
}

// Update AI capability UI indicators
function updateAICapabilityUI(apiName, isAvailable) {
    const checkbox = document.getElementById(`use${apiName.charAt(0).toUpperCase() + apiName.slice(1)}`);
    if (checkbox) {
        checkbox.disabled = !isAvailable;
        if (!isAvailable) {
            checkbox.parentElement.style.opacity = '0.5';
            checkbox.parentElement.title = 'This AI API is not available in your browser';
        }
    }
}

// Export current video structure for debugging
function exportVideoStructure() {
    const summaryDiv = document.getElementById('videoSummary');
    if (summaryDiv) {
        const videoStructure = window.currentVideoStructure; // Would need to be stored
        if (videoStructure) {
            const blob = new Blob([JSON.stringify(videoStructure, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `video_structure_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }
}

// Initialize when popup opens
console.log('Frame Docs Popup initialized');