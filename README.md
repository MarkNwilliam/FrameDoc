# FrameDocs

**Transform Technical Documentation into Engaging Tutorial Videos with Chrome's Built-in AI**

FrameDocs is a Chrome Extension that uses Gemini Nano and Chrome's Built-in AI APIs to automatically convert any technical documentation page into structured educational videos - completely client-side for maximum privacy and zero server costs.

![FrameDocs Demo](screenshots/demo.gif)

## 🎯 What It Does

- 🔍 **Detects documentation pages automatically** (API docs, guides, tutorials)
- 🎬 **Generates educational videos** with multiple scene types:
  - Overview explanations
  - Code examples with syntax highlighting
  - Process diagrams and workflows
  - Mathematical equations (LaTeX support)
  - Comparison tables and infographics
- 🔒 **100% client-side processing** - your documentation never leaves your device
- 🤖 **Uses Chrome Built-in AI APIs** (Gemini Nano) for privacy-first AI

## 🛠️ Built With

- **Chrome Extension** (Manifest V3)
- **Chrome Built-in AI APIs**: Prompt API, Summarizer API
- **Gemini Nano** - On-device AI model
- **JavaScript/HTML/CSS** - Frontend interface
- **Custom RAG System** - Context-aware content generation
- **Backend Video Renderer** (Python/Flask/Manim) - Video generation API

## 📋 Prerequisites

- Chrome Browser 125+
- Enable Chrome Flags:
  1. Go to `chrome://flags/#prompt-api-for-gemini-nano`
  2. Set to "Enabled"
  3. Restart Chrome

## 🚀 Installation

### Option 1: Download Pre-packaged Extension (Recommended)

1. **Download the extension**
   - Go to [frame-docs.zip](https://github.com/MarkNwilliam/FrameDoc/blob/main/frame-docs.zip)
   - Click "Download" to save the ZIP file
   - Extract the ZIP file to a folder on your computer

2. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the extracted `frame-docs` folder

3. **You're ready!** Visit any documentation page and look for the FrameDocs floating button

### Option 2: Clone from Source

1. **Clone this repository**
```bash
git clone https://github.com/MarkNwilliam/FrameDoc.git
cd FrameDoc
```

2. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select the cloned repository folder

3. **Visit any documentation page and look for the FrameDocs floating button!**

## 📖 How to Use

1. **Navigate** to technical documentation (MDN Web Docs, API references, tutorials)
2. **Click** the FrameDocs floating button that appears
3. **Choose your approach:**
   - **Quick Generator**: Enter any topic for instant video
   - **Smart Topics**: Choose from AI-suggested video topics based on page content
4. **Watch** the 5-stage progress as your video is generated:
   - AI Initialization → Script Generation → Scene Processing → Validation → Video Creation
5. **Enjoy** your educational video with animations, code walkthroughs, and visual explanations

## ✨ Features

- ✅ **Smart Content Detection**: Automatically identifies documentation pages
- ✅ **Multiple Scene Types**: 10+ different educational scene formats
- ✅ **Real-time Progress Tracking**: 5-stage visual progress indicator
- ✅ **Privacy-First**: All AI processing happens locally on your device
- ✅ **Context-Aware**: Uses RAG system to generate relevant content from the actual page
- ✅ **No API Costs**: Zero server costs thanks to Chrome's Built-in AI

## 🤖 APIs Used

- **Prompt API (Gemini Nano)**: Generates structured video scripts in JSON format
- **Summarizer API**: Analyzes page content and extracts key topics
- **Custom RAG System**: Provides context-aware generation based on documentation content

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not appearing? | Refresh the documentation page |
| AI not working? | Ensure Chrome flags are enabled and browser is restarted |
| Video generation slow? | This is normal - video rendering takes 30-120 seconds |
| Extension not loading? | Make sure you extracted the ZIP file and selected the folder (not the ZIP) |
| Mobile testing? | Use Chrome DevTools device simulation |

## 🏗️ Architecture
```
Chrome Extension (Client) → Chrome Built-in AI APIs → Video Backend → Final Video
     ↑
Documentation Pages
     ↑
Floating Button UI
```

### Component Breakdown

**Frontend (Chrome Extension)**
- `content.js` - Detects docs pages and injects floating button
- `generator.js` - Handles AI script generation with progress stages
- `generator.html` - UI for video generation workflow
- Simple RAG System - Stores and retrieves relevant documentation chunks

**AI Processing (Client-Side)**
- Prompt API - Generates structured JSON video scripts
- Summarizer API - Analyzes page content for topic suggestions
- JSON Cleaner - Validates and fixes AI-generated output

**Backend (Video Generation)**
- Flask API - Receives scripts and generates videos
- Manim - Renders mathematical animations
- OpenCV - Composes video scenes
- Wikipedia API - Fetches contextual images

## 📁 Project Structure
```
FrameDoc/
├── manifest.json          # Chrome Extension configuration
├── content.js             # Content script for page detection
├── content.css            # Floating button styles
├── generator.html         # Video generation UI
├── generator.js           # AI script generation logic
├── popup.html             # Extension popup
├── popup.js               # Popup logic
├── background.js          # Background service worker
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── ...
├── screenshots/           # Demo images
├── frame-docs.zip         # Pre-packaged extension
└── README.md
```

## 🎥 Demo

[Watch the demo video on YouTube](https://youtube.com/watch?v=YOUR_VIDEO_ID)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Submission

This project was built for the **Google Chrome Built-in AI Challenge 2025** on Devpost.

**Category**: Most Helpful - Chrome Extension

**Key Features**:
- Privacy-first client-side AI processing
- Context-aware video generation with RAG
- Multiple educational scene types
- Real-time progress tracking

## 💬 Support

For issues and questions:

1. Check the troubleshooting section above
2. Ensure Chrome 125+ with required flags enabled
3. Verify you're on a documentation-style webpage
4. [Open an issue](https://github.com/MarkNwilliam/FrameDoc/issues) on GitHub

## 🌟 Acknowledgments

- Built with [Chrome Built-in AI APIs](https://developer.chrome.com/docs/ai/built-in)
- Powered by [Gemini Nano](https://deepmind.google/technologies/gemini/nano/)
- Video rendering with [Manim](https://www.manim.community/)

---

**Transform how you learn from documentation - one video at a time!** 🚀

Made with ❤️ for the Chrome Built-in AI Challenge 2025
