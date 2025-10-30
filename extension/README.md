# 🎬 Frame Docs - AI Video Explainer Chrome Extension

Generate AI-powered explainer videos from technical documentation using Chrome's Built-in AI APIs.

## 🏆 Google Chrome Built-in AI Challenge 2025

**Category:** Best Multimodal AI Application - Chrome Extension

**APIs Used:**
- 💭 Prompt API - Generate video outlines
- 📄 Summarizer API - Distill documentation
- ✏️ Writer API - Create narratives
- 🖊️ Rewriter API - Refine content

## 🚀 Quick Start

### 1. Prerequisites
- Google Chrome (latest version)
- Chrome Built-in AI Early Preview Program access
- Backend server running at `http://localhost:3000`

### 2. Load Extension
1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `frame-docs` directory

### 3. Enable Chrome AI
1. Go to `chrome://flags`
2. Enable these flags:
   - `#prompt-api-for-gemini-nano`
   - `#summarization-api-for-gemini-nano`
   - `#writer-api-for-gemini-nano`
   - `#rewriter-api-for-gemini-nano`
3. Restart Chrome
4. Download Gemini Nano:
```javascript
   // In DevTools console
   await ai.languageModel.create();
```

## 📖 Usage

1. Navigate to any documentation page
2. Click the Frame Docs extension icon
3. Click "Extract Page Content"
4. Select AI APIs to use
5. Click "Generate Video"
6. Wait 1-2 minutes
7. Open your video!

## 🎯 Features

- One-click video generation
- Multi-API AI processing
- Context menu integration
- Smart content extraction
- Video history tracking
- Floating action button

## 📝 License

MIT License - See LICENSE file

## 🤝 Contributing

Built for Google Chrome Built-in AI Challenge 2025 🚀
