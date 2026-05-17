# 🎬 Video Summarizer

An AI-powered web application that summarizes videos using speech recognition and large language models. Upload an MP4 file or paste a YouTube link — and get a structured summary with key points in under a minute.

---

## 🌟 Features

- 📁 **MP4 Upload** — Upload any local video file (meetings, lectures, recordings)
- 🔗 **YouTube / URL Support** — Paste any YouTube link and summarize it directly
- 🎙️ **AI Transcription** — Uses OpenAI's Whisper model for accurate speech-to-text
- 🧠 **AI Summarization** — Uses Meta's LLaMA 3.3 70B model to generate structured summaries
- 📋 **Key Points & Action Items** — Output is always structured and actionable
- ⚡ **Smart Audio Chunking** — Automatically splits large audio files into chunks to handle Groq's 25MB API limit
- 🆓 **100% Free to Run** — Built entirely on free-tier APIs (no OpenAI billing required)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Backend | Express.js |
| File Uploads | Multer |
| Audio Extraction | ffmpeg |
| YouTube Download | yt-dlp |
| Transcription | Whisper Large V3 (via Groq API) |
| Summarization | LLaMA 3.3 70B (via Groq API) |
| Frontend | HTML, CSS, Vanilla JavaScript |

---

## 🧠 How It Works

```
User Input (MP4 file or YouTube URL)
        ↓
Extract Audio (ffmpeg strips audio from video)
        ↓
Smart Chunking (splits audio if > 25MB for Groq's free API limit)
        ↓
Transcribe Each Chunk (Whisper Large V3 via Groq)
        ↓
Combine Transcript
        ↓
Summarize (LLaMA 3.3 70B via Groq)
        ↓
Display Summary + Full Transcript
```
---

## ⚙️ Why Groq Instead of OpenAI?

This project was built as a **resume project** with zero budget. OpenAI's Whisper and GPT APIs require a paid account. Groq offers a **completely free tier** that provides:

- ✅ Whisper Large V3 for transcription
- ✅ LLaMA 3.3 70B for summarization
- ✅ Extremely fast inference (faster than OpenAI in most cases)
- ✅ No credit card required to get started

The code is structured so that switching to OpenAI in the future requires changing only two lines.

---

## 🔧 The 25MB Chunking Problem (and how we solved it)

Groq's free Whisper API has a **25MB file size limit** per request. A typical 5-minute MP4 video produces an audio file well above this limit.

**Our solution:**
1. Extract audio from video using ffmpeg at 16kHz mono (optimized for speech)
2. Check the duration of the audio file using `ffprobe`
3. If the audio is longer than 3 minutes, split it into 3-minute chunks using ffmpeg's segment feature
4. Transcribe each chunk independently via the Groq Whisper API
5. Join all chunk transcripts together into one complete transcript
6. Send the full transcript to LLaMA for summarization
7. Clean up all temporary files automatically

This approach handles videos of any length on a completely free API tier.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org) (v18 or higher)
- [ffmpeg](https://ffmpeg.org/download.html) (added to system PATH)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp/releases) (placed in project folder)
- A free [Groq API key](https://console.groq.com)

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/YOUR_USERNAME/video-summarizer.git
   cd video-summarizer
```

2. **Install dependencies**
```bash
   npm install
```

3. **Create your `.env` file**
GROQ_API_KEY=your_groq_api_key_here
PORT=3000

4. **Run the server**
```bash
   node server.js
```

5. **Open in browser**
http://localhost:3000

---

## 📁 Project Structure

```
video-summarizer/
│
├── server.js          # Express backend — handles uploads, transcription & summarization
├── .env               # API keys (never committed to GitHub)
├── package.json       # Project dependencies
│
└── public/            # Frontend
├── index.html     # Main webpage
├── style.css      # Styling
└── script.js      # Frontend logic
```

---

## 🎯 Use Cases

- 📽️ Summarize recorded **Zoom/Teams meetings**
- 🎓 Condense long **lecture or tutorial videos**
- 📰 Extract key points from **TED talks or interviews**
- 🎙️ Transcribe and summarize any **YouTube video**

---

## 📌 Limitations

- Currently supports MP4 format for file uploads
- Requires local installation of ffmpeg and yt-dlp
- Processing time depends on video length (roughly 30-90 seconds for a 5-minute video)

---

## 👨‍💻 Author

Built by **Apurva** as a portfolio project to demonstrate full-stack JavaScript, AI API integration, and audio/video processing skills.