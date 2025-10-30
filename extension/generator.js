// === WEBPAGE CONTENT DISPLAY ===
const urlParams = new URLSearchParams(window.location.search);
const pageTitle = urlParams.get('title') || 'No title';
const pageUrl = urlParams.get('url') || 'No URL';
const content = urlParams.get('content') || 'No content extracted';
document.getElementById('pageTitle').textContent = pageTitle;
document.getElementById('pageUrl').textContent = pageUrl;
document.getElementById('pageContent').textContent = content;
console.log('Page data loaded:', { pageTitle, pageUrl, contentLength: content.length });

// === AUTO-LOAD PAGE-SPECIFIC RAG SYSTEM ===
// 1. Define the class inline
class SimpleRAGSystem {
    constructor() {
        this.documents = [];
    }
    addDocuments(docs) {
        this.documents = docs.map(d => ({ text: d }));
    }
    findRelevant(query, topK=3) {
        if (!this.documents || this.documents.length === 0) return [];
        // Simple relevance: documents containing the query
        const matches = this.documents.filter(d => d.text.toLowerCase().includes(query.toLowerCase()));
        // Return topK (or fewer)
        return matches.slice(0, topK);
    }
}

// 2. Initialize immediately
let ragSystem;
if (content && content !== 'No content extracted') {
    ragSystem = new SimpleRAGSystem();
    const paragraphs = content.split(/\n{1,2}/).filter(p => p.trim().length > 0);
    ragSystem.addDocuments(paragraphs);  // no module needed, works immediately
    console.log('✅ RAG initialized for this page only');
} else {
    console.log('⚠️ No webpage content available for RAG');
}

// === COLOR THEME ===
const PRIMARY_COLOR = '#2563eb';
const SECONDARY_COLOR = '#1e40af';
const SUCCESS_COLOR = '#16a34a';
const WARNING_COLOR = '#d97706';
const ERROR_COLOR = '#dc2626';

// === GLOBAL STYLES ===
const style = document.createElement('style');
style.textContent = `
    .section {
        margin-top: 30px;
        border: 2px solid ${PRIMARY_COLOR};
        border-radius: 12px;
        padding: 25px;
        background: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
    }
    
    .section.disabled {
        opacity: 0.5;
        pointer-events: none;
    }
    
    .section-title {
        color: ${PRIMARY_COLOR};
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: bold;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .btn {
        padding: 12px 24px;
        background: ${PRIMARY_COLOR};
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    
    .btn:hover:not(:disabled) {
        background: ${SECONDARY_COLOR};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    .btn:disabled {
        background: #94a3b8;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    
    .btn-success {
        background: ${SUCCESS_COLOR};
    }
    
    .btn-success:hover:not(:disabled) {
        background: #15803d;
    }
    
    .status {
        margin-top: 15px;
        padding: 12px;
        border-radius: 8px;
        font-weight: bold;
        min-height: 20px;
        transition: all 0.3s ease;
    }
    
    .status-loading {
        background: #fef3c7;
        color: ${WARNING_COLOR};
        border: 1px solid #f59e0b;
    }
    
    .status-success {
        background: #f0fdf4;
        color: ${SUCCESS_COLOR};
        border: 1px solid #bbf7d0;
    }
    
    .status-error {
        background: #fef2f2;
        color: ${ERROR_COLOR};
        border: 1px solid #fecaca;
    }
    
    .input {
        width: 95%;
        padding: 15px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-family: inherit;
        font-size: 14px;
        margin-bottom: 15px;
        resize: vertical;
        transition: all 0.3s ease;
    }
    
    .input:focus {
        outline: none;
        border-color: ${PRIMARY_COLOR};
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .input:disabled {
        background: #f3f4f6;
        cursor: not-allowed;
    }
    
    .topic-btn {
        width: 100%;
        padding: 14px 16px;
        background: linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR});
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        text-align: left;
        margin-bottom: 10px;
        transition: all 0.3s ease;
    }
    
    .topic-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    
    .topic-btn:disabled {
        background: linear-gradient(135deg, #94a3b8, #64748b);
        cursor: not-allowed;
        transform: none;
    }
    
    .video-player {
        width: 100%;
        margin-top: 20px;
        border-radius: 8px;
        border: 2px solid ${SUCCESS_COLOR};
    }
    
    .hidden {
        display: none;
    }
    
    .loading-spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
        margin-right: 10px;
    }
    
    .progress-stages {
        margin-top: 20px;
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    }
    
    .stage {
        display: flex;
        align-items: center;
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 6px;
        background: white;
        border: 2px solid #e2e8f0;
        transition: all 0.3s ease;
    }
    
    .stage.active {
        border-color: ${PRIMARY_COLOR};
        background: #eff6ff;
    }
    
    .stage.completed {
        border-color: ${SUCCESS_COLOR};
        background: #f0fdf4;
    }
    
    .stage.error {
        border-color: ${ERROR_COLOR};
        background: #fef2f2;
    }
    
    .stage-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        font-weight: bold;
        font-size: 16px;
        background: #e2e8f0;
        color: #64748b;
        transition: all 0.3s ease;
    }
    
    .stage.active .stage-icon {
        background: ${PRIMARY_COLOR};
        color: white;
    }
    
    .stage.completed .stage-icon {
        background: ${SUCCESS_COLOR};
        color: white;
    }
    
    .stage.error .stage-icon {
        background: ${ERROR_COLOR};
        color: white;
    }
    
    .stage-content {
        flex: 1;
    }
    
    .stage-title {
        font-weight: bold;
        margin-bottom: 4px;
        color: #1e293b;
    }
    
    .stage-description {
        font-size: 14px;
        color: #64748b;
    }
    
    .stage-spinner {
        width: 20px;
        height: 20px;
        border: 3px solid ${PRIMARY_COLOR};
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    .pulse {
        animation: pulse 2s ease-in-out infinite;
    }
`;
document.head.appendChild(style);

// === STREAMLINED TECHNICAL VIDEO GENERATION PROMPT ===
const VIDEO_GENERATION_PROMPT = `You must generate a JSON video script following this EXACT structure. Do not deviate from this format.
This is the technical documentation page you must help with: {paper_context}

CRITICAL RULES FOR VALID JSON:

1. USE ONLY DOUBLE QUOTES FOR EVERYTHING
   ✅ CORRECT: "property": "value"
   ❌ WRONG: 'property': 'value'
   ❌ WRONG: property: "value"

2. FOR CODE FIELDS - WRITE EVERYTHING ON ONE LINE WITH \\n
   ✅ CORRECT: "code": "from selenium import webdriver\\ndriver = webdriver.Chrome()\\ndriver.get(\\"https://example.com\\")\\ndriver.quit()"
   ❌ WRONG: "code": "from selenium import webdriver
driver = webdriver.Chrome()
driver.get('https://example.com')"
   
3. ESCAPE ALL QUOTES INSIDE STRINGS
   ✅ CORRECT: "text": "He said \\"hello\\""
   ❌ WRONG: "text": "He said "hello""
   
4. ESCAPE ALL BACKSLASHES
   ✅ CORRECT: "path": "C:\\\\Users\\\\file.txt"
   ❌ WRONG: "path": "C:\Users\file.txt"

5. NO COMMENTS, NO TRAILING COMMAS
   ✅ CORRECT: {"a": 1, "b": 2}
   ❌ WRONG: {"a": 1, "b": 2,}
   ❌ WRONG: {"a": 1, /* comment */ "b": 2}

=== CODE EXAMPLES ===

Python code example:
"code": "from selenium import webdriver\\n\\ndriver = webdriver.Chrome()\\ndriver.get('https://www.google.com')\\nprint(driver.title)\\ndriver.quit()"

JavaScript code example:
"code": "const driver = await new Builder().forBrowser('chrome').build();\\nawait driver.get('https://www.google.com');\\nconst title = await driver.getTitle();\\nconsole.log(title);\\nawait driver.quit();"

Python with string formatting:
"code": "name = 'John'\\nprint(f'Hello {name}')\\nurl = 'https://example.com'\\ndriver.get(url)"

CRITICAL: Notice how ALL quotes inside the code use SINGLE QUOTES ('). This is mandatory because the "code" field itself is wrapped in double quotes.

OTHER CRITICAL RULES FOR VALID JSON:
1. Root object must have "output_name" and "scenes" keys only
2. Each scene must have "type" not "scene_type"
3. Scene types must be: overview, simple_bullets, multi_section_bullets, image_text, multi_image_text, code, comparison_table, process_diagram, triangle, equation_explanation, infographic_of_metrics
4. ALL property names must use double quotes: "property" NOT 'property' or property
5. ALL string values must use double quotes: "value" NOT 'value'
6. ALL code must escape newlines as \\n (backslash-n) NOT actual line breaks
7. NEVER use literal newlines, tabs, or line breaks inside any JSON string
8. Use straight quotes (') for apostrophes in text content only
9. Generate 3-6 scenes total
10. Focus on teaching the user - be a teacher explaining the content

CODE FORMATTING RULES (CRITICAL):
- Write code on ONE LINE using \\n for line breaks
- Example: "code": "from selenium import webdriver\\ndriver = webdriver.Chrome()\\ndriver.get('https://example.com')"
- NEVER write code like this: "code": "from selenium import webdriver
driver = webdriver.Chrome()"
- Each \\n represents where a line break should appear in the final video
- Indent with spaces, then use \\n for next line: "def func():\\n    return True"

SCENE TYPES TO USE:
- Use process_diagram for step-by-step procedures
- Use image_text and multi_image_text for concrete examples
- Use code scenes for technical implementation (remember to escape newlines!)

TOPIC (what user is asking for): {topic}
{custom_instructions}

EXACT JSON STRUCTURE TO FOLLOW:
{
    "output_name": "TopicName",
    "scenes": [
        {
            "type": "overview",
            "text": "High-level concept explanation (In Pango Markup)",
            "voiceover": "Narrative overview",
            "creation_time": 10,
            "duration": 4,
            "subtitle": "Optional additional context (This is only text not Pango Markup)"
        },
        {
            "type": "process_diagram",
            "voiceover": "string (overview of the entire process)",
            "diagram_data": {
                "title": "string (process diagram title)",
                "steps": [
                    {
                        "text": "string (step description)",
                        "label": "optional_string (additional label)",
                        "voiceover": "string (detailed explanation of this step)"
                    }
                ]
            },
            "summary_voiceover": "optional_string (final summary of the process)",
            "duration": "number"
        },
        {
            "type": "code",
            "title": "Implementation Details",
            "code": "# Demonstration code\\nline2\\nline3",
            "intro": {
                "text": "Code context",
                "voiceover": "Code introduction narration"
            },
            "sections": [
                {
                    "title": "Key Code Section",
                    "highlight_start": 1,
                    "highlight_end": 3,
                    "voiceover": "Detailed code explanation",
                    "duration": 3
                }
            ],
            "conclusion": {
                "text": "Code summary",
                "voiceover": "Concluding code insights"
            }
        },
        {
            "type": "multi_section_bullets",
            "title": "string",
            "sections": [
                {
                    "subtitle": "string",
                    "bullets": ["string", "string", "string"]
                }
            ],
            "voiceover": "string (comprehensive explanation covering all sections)",
            "duration": "number"
        },
        {
            "type": "simple_bullets",
            "title": "Key Points",
            "bullets": ["Point 1", "Point 2", "Point 3"],
            "voiceover": "Explanation of points",
            "duration": 8
        },
        {
            "type": "equation_explanation",
            "title": "string (equation title - plain text, will be displayed at the top)",
            "equation": "string (LaTeX equation WITHOUT $ delimiters - MathTex handles math mode automatically)",
            "explanation": "string (general explanation with \\n for line breaks - use plain text or basic LaTeX)",
            "voiceover": "string (audio narration for the overall equation - describes the equation's purpose and significance)",
            "variable_highlights": [
                {
                    "variable": "string (LaTeX variable WITHOUT $ delimiters - examples: 'F', 'm_1', '\\\\alpha', '\\\\frac{a}{b}')",
                    "description": "string (what this variable represents - can include LaTeX with \\\\ escaped properly)",
                    "voiceover": "string (audio narration specifically for this variable - provides detailed context)"
                }
            ],
            "duration": "number (how long to hold the final frame in seconds)"
        },
        {
            "type": "comparison_table",
            "table_data": {
                "title": "string (table title)",
                "headers": ["string", "string"],
                "rows": [
                    ["string", "string"],
                    ["string", "string"],
                    ["string", "string"]
                ]
            },
            "voiceover": "string",
            "duration": "number"
        },
        {
            "type": "multi_image_text",
            "title": "string",
            "text": "string (In Pango Markup)",
            "voiceover": "string (good depth explanation with rules of thumb and numbers statistics, real world examples etc)",
            "wikipedia_topics": ["string"],
            "num_images": "number",
            "image_width": "optional_number",
            "layout": "horizontal|vertical",
            "duration": "number"
        },
        {
            "type": "infographic_of_metrics",
            "title": "string (main title - will auto-scale to fit)",
            "voiceover": "string (overall context and introduction)",
            "metrics": [
                {
                    "label": "string (metric name - max 15 chars recommended)",
                    "value": "string (metric value)",
                    "voiceover": "string (detailed explanation of this specific metric with statistics and real-world context)"
                }
            ],
            "duration": "number"
        },
        {
            "type": "image_text",
            "title": "Visual Example",
            "text": "Description",
            "voiceover": "Detailed explanation",
            "wikipedia_topic": "Simple topic name only",
            "num_images": 2,
            "duration": 8
        }
    ]
}

REMINDER: Generate ONLY valid JSON. No explanations. No markdown. Start with { and end with }. ALL code must use \\n for line breaks, NEVER actual newlines.`;

// === AGGRESSIVE JSON CLEANER ===
// === BULLETPROOF JSON CLEANER ===
function cleanJSON(jsonString) {
    console.log('🧹 Starting JSON cleanup...');
    console.log('📏 Input length:', jsonString.length);
    let clean = jsonString.trim();
    
    // Remove markdown code blocks
    clean = clean.replace(/```json\s*/g, '').replace(/```\s*/g, '').replace(/`/g, '');
    console.log('📏 After markdown removal:', clean.length);
    
    // Extract JSON from response
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    console.log('📍 JSON boundaries:', { firstBrace, lastBrace });
    
    if (firstBrace !== -1 && lastBrace !== -1) {
        clean = clean.substring(firstBrace, lastBrace + 1);
        console.log('📏 After extraction:', clean.length);
    }
    
    // **SIMPLE CHARACTER-BY-CHARACTER PROCESSING**
    let result = '';
    let inString = false;
    let stringQuote = null;
    let i = 0;
    
    while (i < clean.length) {
        const char = clean[i];
        const nextChar = clean[i + 1];
        
        // Handle backslash escapes - always preserve them
        if (char === '\\' && inString) {
            result += char;
            if (nextChar) {
                result += nextChar;
                i += 2;
                continue;
            }
        }
        
        // Handle quotes
        if (char === '"' || char === "'") {
            if (!inString) {
                // Starting a string - always use double quotes
                inString = true;
                stringQuote = char;
                result += '"';
                i++;
                continue;
            } else if (char === stringQuote) {
                // Ending the string - always use double quotes
                inString = false;
                stringQuote = null;
                result += '"';
                i++;
                continue;
            } else {
                // It's the opposite quote inside a string - just keep it
                result += char;
                i++;
                continue;
            }
        }
        
        // Inside string - escape control characters
        if (inString) {
            if (char === '\n') {
                result += '\\n';
                i++;
            } else if (char === '\r') {
                result += '\\r';
                i++;
            } else if (char === '\t') {
                result += '\\t';
                i++;
            } else {
                result += char;
                i++;
            }
        } else {
            // Outside string - remove formatting whitespace
            if (char === '\n' || char === '\r' || char === '\t') {
                i++;
                continue;
            }
            result += char;
            i++;
        }
    }
    
    clean = result;
    console.log('📏 After quote normalization:', clean.length);
    
    // **Fix unquoted property names**
    clean = clean.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)(\s*):/g, '$1"$2"$3:');
    console.log('📏 After unquoted property fix:', clean.length);
    
    // **Fix common JSON errors**
    clean = clean
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/;\s*/g, '')
        .replace(/,+/g, ',')
        .replace(/\s+/g, ' ')
        .trim();
    
    console.log('📏 After cleanup:', clean.length);
    console.log('📄 Cleaned preview (first 500):', clean.substring(0, 500));
    console.log('📄 Cleaned preview:', clean);
    
    // Validate
    try {
        JSON.parse(clean);
        console.log('✅ JSON validation passed!');
    } catch (e) {
        console.warn('⚠️ JSON still invalid:', e.message);
        
        const posMatch = e.message.match(/position (\d+)/);
        if (posMatch) {
            const pos = parseInt(posMatch[1]);
            const start = Math.max(0, pos - 200);
            const end = Math.min(clean.length, pos + 200);
            console.error('❌ Problem area:');
            console.error(clean.substring(start, pos) + '<<<HERE>>>' + clean.substring(pos, end));
            if (clean[pos]) {
                console.error('❌ Character:', JSON.stringify(clean[pos]), 'Code:', clean.charCodeAt(pos));
            }
        }
        
        // Save to console for manual inspection
        console.log('📄 FULL CLEANED JSON:');
        console.log(clean);
    }
    
    return clean;
}


// === PROGRESS STAGES MANAGER ===
class ProgressStages {
    constructor(container) {
        this.container = container;
        this.stages = [];
    }
    
    create(stageList) {
        const stagesDiv = document.createElement('div');
        stagesDiv.className = 'progress-stages';
        
        stageList.forEach((stage, index) => {
            const stageDiv = document.createElement('div');
            stageDiv.className = 'stage';
            stageDiv.id = `stage-${index}`;
            
            stageDiv.innerHTML = `
                <div class="stage-icon">${index + 1}</div>
                <div class="stage-content">
                    <div class="stage-title">${stage.title}</div>
                    <div class="stage-description">${stage.description}</div>
                </div>
            `;
            
            stagesDiv.appendChild(stageDiv);
            this.stages.push(stageDiv);
        });
        
        this.container.innerHTML = '';
        this.container.appendChild(stagesDiv);
    }
    
    setActive(index) {
        this.stages.forEach((stage, i) => {
            stage.classList.remove('active', 'completed', 'error');
            if (i < index) {
                stage.classList.add('completed');
                stage.querySelector('.stage-icon').innerHTML = '✓';
            } else if (i === index) {
                stage.classList.add('active');
                stage.querySelector('.stage-icon').innerHTML = '<div class="stage-spinner"></div>';
            }
        });
    }
    
    setCompleted(index) {
        if (this.stages[index]) {
            this.stages[index].classList.remove('active');
            this.stages[index].classList.add('completed');
            this.stages[index].querySelector('.stage-icon').innerHTML = '✓';
        }
    }
    
    setError(index, errorMsg) {
        if (this.stages[index]) {
            this.stages[index].classList.remove('active');
            this.stages[index].classList.add('error');
            this.stages[index].querySelector('.stage-icon').innerHTML = '✕';
            this.stages[index].querySelector('.stage-description').textContent = errorMsg;
        }
    }
    
    destroy() {
        this.container.innerHTML = '';
        this.stages = [];
    }
}

// === UI SECTIONS ===
const quickVideoSection = document.createElement('div');
quickVideoSection.className = 'section';
quickVideoSection.innerHTML = `
    <div class="section-title">⚡ Quick Video Generator</div>
    <textarea class="input" placeholder="Enter any topic or paste content to generate a video about..." rows="4"></textarea>
    <button class="btn">🎬 Generate Video Now</button>
    <div class="status"></div>
`;

const summarySection = document.createElement('div');
summarySection.className = 'section';
summarySection.innerHTML = `
    <div class="section-title">📝 Content Summary & Video Topics</div>
    <div class="status"></div>
    <div class="status hidden" style="background: #f0fdf4; border: 1px solid #bbf7d0;"></div>
    <div class="hidden" style="margin-top: 15px; gap: 10px;"></div>
`;

const videoSection = document.createElement('div');
videoSection.className = 'section hidden';
videoSection.innerHTML = `
    <div class="section-title">🎥 Video Generator</div>
    <div class="status"></div>
`;

document.body.appendChild(quickVideoSection);
document.body.appendChild(summarySection);
document.body.appendChild(videoSection);

// === UI ELEMENTS ===
const quickInput = quickVideoSection.querySelector('textarea');
const quickGenerateBtn = quickVideoSection.querySelector('button');
const quickStatus = quickVideoSection.querySelector('.status');
const summaryStatus = summarySection.querySelector('.status');
const summaryText = summarySection.querySelectorAll('.status')[1];
const topicsContainer = summarySection.querySelectorAll('div')[3];
const videoStatus = videoSection.querySelector('.status');

// Initialize progress stages manager
const progressStages = new ProgressStages(videoStatus);

// === LOADING INDICATORS ===
function showLoading(element, message) {
    element.innerHTML = `<span class="loading-spinner"></span>${message}`;
    element.className = 'status status-loading';
}

function showSuccess(element, message) {
    element.innerHTML = `✅ ${message}`;
    element.className = 'status status-success';
}

function showError(element, message) {
    element.innerHTML = `❌ ${message}`;
    element.className = 'status status-error';
}

// === DISABLE/ENABLE UI SECTIONS ===
function disableOtherSections() {
    quickVideoSection.classList.add('disabled');
    summarySection.classList.add('disabled');
    quickInput.disabled = true;
    quickGenerateBtn.disabled = true;
    
    const topicButtons = topicsContainer.querySelectorAll('.topic-btn');
    topicButtons.forEach(btn => btn.disabled = true);
}

function enableAllSections() {
    quickVideoSection.classList.remove('disabled');
    summarySection.classList.remove('disabled');
    quickInput.disabled = false;
    quickGenerateBtn.disabled = false;
    
    const topicButtons = topicsContainer.querySelectorAll('.topic-btn');
    topicButtons.forEach(btn => btn.disabled = false);
}

// === VIDEO GENERATION WITH COMPREHENSIVE PROMPT ===
async function generateVideoScript(topic, context = '', isQuick = false) {
    console.log('Generating video script for topic:', topic);

     
    
    let webpageContext = '';
    if (context && context !== 'No content extracted') {
        if (context.length < 8000) {
            // Pass full content
            webpageContext = `\n\nWEBPAGE CONTEXT FOR REFERENCE:\n${context}`;
        } else {
            // Use RAG top 10 chunks
            const topChunks = ragSystem.findRelevant(topic, 10).map(r => r.text).join('\n\n');
            webpageContext = `\n\nWEBPAGE CONTEXT (TOP 10 RAG CHUNKS):\n${topChunks}`;
        }
    }

    console.log('Using webpage context:', context ? 'Provided' : 'None');
    console.log('Webpage context length:', webpageContext.length); 
    
    const customInstructions = isQuick 
        ? "Create a concise but engaging video with 3-4 scenes that quickly explains the core concepts."
        : "Create a comprehensive educational video with 4-6 scenes that deeply explores the topic with visualizations and real-world examples.";
    
    console.log('Using custom instructions:', customInstructions);
    
    const prompt = VIDEO_GENERATION_PROMPT
        .replace('{topic}', topic)
        .replace('{paper_context}', webpageContext)
        .replace('{custom_instructions}', customInstructions);
    
    // Create progress stages
    const stages = [
        { title: 'Initializing AI', description: 'Connecting to language model...' },
        { title: 'Generating Script', description: 'Creating educational content...' },
        { title: 'Processing Scenes', description: 'Structuring video scenes...' },
        { title: 'Validating Output', description: 'Checking script quality...' },
        { title: 'Sending to Backend', description: 'Creating final video...' }
    ];
    
    progressStages.create(stages);
    
    try {
        // Stage 1: Initialize AI
        progressStages.setActive(0);
        console.log('🔍 Checking LanguageModel availability...');
        
        if (!('LanguageModel' in self)) {
            throw new Error('LanguageModel API not available - enable in chrome://flags/#prompt-api-for-gemini-nano');
        }
        
        const availability = await LanguageModel.availability();
        console.log('🤖 LanguageModel availability:', availability);
        
        if (availability === 'no') {
            throw new Error('LanguageModel not available - enable in chrome://flags/#prompt-api-for-gemini-nano');
        }
        
        if (availability === 'after-download') {
            console.warn('⚠️ Model needs download - check chrome://components/');
        }
        
        console.log('🤖 Creating Gemini session...');
        const geminiSession = await LanguageModel.create({
            topK: 1,
            temperature: 0,
            systemPrompt: 'You are a JSON generator. CRITICAL RULES: 1) ALL property names must use double quotes: "property" 2) ALL string values must use double quotes: "value" 3) Inside code strings, use SINGLE quotes for any quoted text: "code": "print(\'hello\')" 4) Never use actual line breaks - use \\n instead 5) Output ONLY valid JSON, no markdown, no explanations'
        });
        
        console.log('✅ Gemini session created');
        progressStages.setCompleted(0);
        
        // Stage 2: Generate Script
        progressStages.setActive(1);
        console.log('⚡ Starting streaming request...');
        
        let fullResponse = '';
        let chunkCount = 0;
        const stream = geminiSession.promptStreaming(prompt);
        console.log('✅ Stream created, waiting for chunks...');
        
        for await (const chunk of stream) {
            chunkCount++;
            fullResponse += chunk;
            if (chunkCount % 5 === 0) {
                console.log(`📊 Progress: ${chunkCount} chunks, ${fullResponse.length} chars total`);
            }
        }
        
        console.log('✅ Streaming completed!');
        progressStages.setCompleted(1);
        
        // Stage 3: Process Scenes
        progressStages.setActive(2);
        
        if (!fullResponse || fullResponse.length === 0) {
            throw new Error('AI returned empty response');
        }
        
        console.log('🧹 Cleaning JSON...');
        let cleanJson = cleanJSON(fullResponse);
        progressStages.setCompleted(2);
        
        // Stage 4: Validate Output
        progressStages.setActive(3);
        console.log('🔍 Parsing JSON...');
        
        let parsed;
        try {
            parsed = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error('❌ JSON PARSE ERROR:', parseError);
            throw new Error(`JSON parsing failed: ${parseError.message}`);
        }
        
        console.log('✅ JSON parsed successfully!');
        
        if (!parsed.scenes || !Array.isArray(parsed.scenes)) {
            throw new Error('No scenes array found in parsed JSON');
        }
        
        if (parsed.scenes.length < 3 || parsed.scenes.length > 6) {
            console.warn(`⚠️ Scene count ${parsed.scenes.length} outside recommended range (3-6), but continuing...`);
        }
        
        console.log('✅ All validations passed!');
        progressStages.setCompleted(3);
        
        geminiSession.destroy();
        console.log('🧹 Session destroyed');
        
        return cleanJson;
        
    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
        
        // Find which stage failed
        const activeStage = stages.findIndex((_, i) => {
            const stageEl = document.getElementById(`stage-${i}`);
            return stageEl && stageEl.classList.contains('active');
        });
        
        if (activeStage !== -1) {
            progressStages.setError(activeStage, error.message);
        }
        
        throw error;
    }
}

// === QUICK VIDEO GENERATION ===
async function generateQuickVideo() {
    const userInput = quickInput.value.trim();
    
    if (!userInput) {
        showError(quickStatus, 'Please enter a topic or content');
        return;
    }
    
    console.log('🎬 Starting quick video generation for:', userInput);
    
    // Disable other sections and scroll to video section
    disableOtherSections();
    videoSection.classList.remove('hidden');
    videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    try {
        console.log('📝 Calling generateVideoScript...');
        const jsonScript = await generateVideoScript(userInput, content, true);
        console.log('✅ Script generation completed');
        
        if (!jsonScript) {
            throw new Error('generateVideoScript returned null or undefined');
        }
        
        // Stage 5: Send to Backend
        progressStages.setActive(4);
        await sendToBackendAndPlay(jsonScript);
        progressStages.setCompleted(4);
        
        showSuccess(quickStatus, '✅ Video generated successfully!');
        
    } catch (error) {
        console.error('❌ Quick video generation failed:', error);
        showError(quickStatus, `Failed: ${error.message}`);
    } finally {
        enableAllSections();
    }
}

// === CONTENT ANALYSIS ===
async function generateSummaryAndTopics() {
    if (!content || content === 'No content extracted') {
        showError(summaryStatus, 'No content available to analyze');
        return;
    }
    
    showLoading(summaryStatus, 'Analyzing page content...');
    
    try {
        let summary = '';
        if ('Summarizer' in self) {
            const summarizer = await Summarizer.create({ type: 'key-points' });
            const stream = summarizer.summarizeStreaming(content);
            for await (const chunk of stream) {
                summary += chunk;
            }
        } else {
            summary = content.substring(0, 500) + '...';
        }
        
        summaryText.innerHTML = `<strong>📝 Content Summary:</strong><br>${summary}`; summaryText.classList.remove('hidden');

        showLoading(summaryStatus, 'Generating video topics...');
    await generateVideoTopics(summary);
    
} catch (error) {
    showError(summaryStatus, 'Failed to analyze content');
}

}

async function generateVideoTopics(summary) {
try {
let topics = [];

if ('LanguageModel' in self) {
        const availability = await LanguageModel.availability();
        if (availability !== 'no') {
            const geminiSession = await LanguageModel.create({
                topK: 40,
                temperature: 0.7
            });
            
            const prompt = `Based on this content, suggest 4 video topics for educational videos. Return ONLY a JSON array: ["Topic 1", "Topic 2", "Topic 3", "Topic 4"]

            Content: ${summary}`;

            let response = '';
            const stream = geminiSession.promptStreaming(prompt);
            for await (const chunk of stream) {
                response += chunk;
            }
            
            const match = response.match(/\[[^\]]*\]/);
            if (match) {
                topics = JSON.parse(match[0]);
            }
            
            geminiSession.destroy();
        }
    }
    
    if (topics.length === 0) {
        topics = [
            "Key Concepts Overview",
            "Step-by-Step Tutorial", 
            "Advanced Techniques",
            "Real-world Applications"
        ];
    }
    
    displayTopicButtons(topics, summary);
    showSuccess(summaryStatus, `Found ${topics.length} video topics`);
    
} catch (error) {
    showError(summaryStatus, 'Failed to generate topics');
}

}

function displayTopicButtons(topics, summary) {
topicsContainer.innerHTML = '';
topicsContainer.classList.remove('hidden');

topics.forEach((topic, index) => {
    const topicBtn = document.createElement('button');
    topicBtn.className = 'topic-btn';
    topicBtn.textContent = `${index + 1}. ${topic}`;
    topicBtn.onclick = () => generateVideoForTopic(topic, summary);
    topicsContainer.appendChild(topicBtn);
});

}

async function generateVideoForTopic(selectedTopic, summary) {
// Disable other sections and scroll to video section
disableOtherSections();
videoSection.classList.remove('hidden');
videoSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

try {
    const jsonScript = await generateVideoScript(selectedTopic, summary, false);
    
    // Stage 5: Send to Backend
    progressStages.setActive(4);
    await sendToBackendAndPlay(jsonScript);
    progressStages.setCompleted(4);
    
} catch (error) {
    showError(videoStatus, 'Failed to generate video script');
} finally {
    enableAllSections();
}

}

// === BACKEND COMMUNICATION ===
async function sendToBackendAndPlay(jsonScript) {
if (!jsonScript) {
showError(videoStatus, 'No script to send');
return;
}

try {
    let cleanJson = cleanJSON(jsonScript);
    const scriptData = JSON.parse(cleanJson);
    
    const apiPayload = {
        ...scriptData,
        add_goodbye: true
    };
    
    const response = await fetch('https://yeeplatform.top/generate_video_json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
    });
    
    if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.video_url) {
        // Remove progress stages and show video player
        progressStages.destroy();
        
        const successMsg = document.createElement('div');
        successMsg.className = 'status status-success';
        successMsg.innerHTML = '✅ Video generated successfully!';
        videoStatus.parentElement.insertBefore(successMsg, videoStatus);
        videoStatus.remove();
        
        const videoPlayer = document.createElement('video');
        videoPlayer.className = 'video-player';
        videoPlayer.controls = true;
        videoPlayer.autoplay = true;
        videoPlayer.src = result.video_url;
        videoSection.appendChild(videoPlayer);
        
    } else {
        showSuccess(videoStatus, 'Video generation started! Processing...');
    }
    
} catch (error) {
    const activeStage = 4; // Backend stage
    progressStages.setError(activeStage, `Backend error: ${error.message}`);
    throw error;
}

}

// === EVENT LISTENERS ===
quickGenerateBtn.addEventListener('click', generateQuickVideo);

// === START THE WORKFLOW ===
document.addEventListener('DOMContentLoaded', function() {
setTimeout(() => {
generateSummaryAndTopics();
}, 1000);
});