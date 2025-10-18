# 🤖 AI Answer Assistant - Chrome Extension

A powerful Chrome extension that captures screen areas, extracts text using OCR, and provides intelligent AI-powered answers instantly.

## ✨ Features

- **🆓 100% Free** - No paid services required
- **📸 Screen Capture** - Select any area on your screen
- **👁️ Smart OCR** - Multiple free OCR services with fallback
- **🤖 AI Answers** - Powered by Google Gemini AI
- **⚡ Fast & Reliable** - Bulletproof fallback system
- **🌍 Multi-language** - Supports English and Vietnamese
- **🎯 Question-Focused** - Optimized for answering questions

## 🚀 Quick Start

### Installation
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. Pin the extension to your toolbar

### Setup
1. **Get Google API Key** (Free):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable "Generative Language API"
   - Create an API key
   
2. **Configure Extension**:
   - Click the extension icon
   - Enter your Google API key
   - Click "Test" to verify connection

### Usage
1. Press **Ctrl+Shift+Q** (or **Cmd+Shift+Q** on Mac)
2. Drag to select any text area on screen
3. Wait for automatic processing:
   - 📸 Captures area
   - 🔍 Extracts text (multiple OCR services)
   - 🤖 Gets AI answer
   - 💬 Shows result popup

## 🛠️ Technical Details

### Architecture
- **Manifest V3** Chrome Extension
- **Service Worker** background script
- **Content Script** for UI and OCR processing
- **Multiple OCR Services** with smart fallback
- **Google Gemini API** for AI responses

### OCR Services (Free Tier)
1. **OCR.space** - Primary OCR service
2. **ImageToText API** - Secondary fallback
3. **Manual Input** - Final fallback (always works)

### Files Structure
```
ai-answer-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker
├── content.js            # Content script & OCR
├── popup.html            # Settings popup
├── popup.js              # Popup functionality
├── utils/
│   ├── ocr.js           # OCR utilities
│   └── ai.js            # AI/Gemini integration
└── icon.png             # Extension icon
```

## 🔧 Configuration

### Required APIs
- ✅ **Generative Language API** (Google Cloud) - Free tier: 1500 requests/day
- ✅ **Free OCR Services** - No registration required

### Keyboard Shortcuts
- **Ctrl+Shift+Q** (Windows/Linux)
- **Cmd+Shift+Q** (Mac)

You can customize shortcuts at `chrome://extensions/shortcuts`

## 🎯 Use Cases

- **Students** - Answer homework questions from textbooks
- **Researchers** - Get explanations of complex text
- **Professionals** - Quick answers from documents/presentations
- **General** - Understand any text content online

## 🔒 Privacy & Security

- **No data storage** - All processing is real-time
- **Secure APIs** - Uses official Google Cloud services
- **Local processing** - OCR and capture happen locally
- **No tracking** - Extension doesn't collect user data

## 🐛 Troubleshooting

### Common Issues

**"Extension context invalidated"**
- Reload extension at `chrome://extensions`
- Refresh the webpage

**"OCR services unavailable"**
- Manual input popup will appear automatically
- Type the text and get AI answers

**"Invalid API key"**
- Check your Google API key
- Ensure Generative Language API is enabled

### Diagnostics
Use the "Check APIs" button in the extension popup to test:
- ✅ Free OCR Service status
- ✅ Google Gemini API status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use and modify!

## 🙏 Acknowledgments

- **Google Gemini** for AI responses
- **OCR.space** for free OCR services
- **Chrome Extensions API** for the platform

---

**Made with ❤️ for the open-source community**

🌟 **If this extension helps you, please give it a star!** 🌟