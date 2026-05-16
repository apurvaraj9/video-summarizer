const express = require('express');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Groq = require('groq-sdk');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


function downloadAudioFromURL(url, outputPath) {
  const ytDlp = path.join(__dirname, 'yt-dlp');
  execSync(
    `"${ytDlp}" -x --audio-format wav --audio-quality 0 --postprocessor-args "-ar 16000 -ac 1" -o "${outputPath}" "${url}"`,
    { timeout: 120000 }
  );
}


function extractAudio(videoPath, audioPath) {
  execSync(`ffmpeg -i "${videoPath}" -ar 16000 -ac 1 -vn -b:a 32k "${audioPath}" -y`);
}

function getAudioDuration(audioPath) {
  const output = execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 "${audioPath}"`
  ).toString().trim();
  return parseFloat(output);
}

function splitAudio(audioPath, chunkDir, chunkDuration = 180) {
  fs.mkdirSync(chunkDir, { recursive: true });
  execSync(
    `ffmpeg -i "${audioPath}" -f segment -segment_time ${chunkDuration} -c copy "${chunkDir}/chunk%03d.wav" -y`
  );
  return fs.readdirSync(chunkDir)
    .filter(f => f.endsWith('.wav'))
    .sort()
    .map(f => path.join(chunkDir, f));
}

async function transcribeAudio(audioPath) {
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-large-v3',
    response_format: 'text',
  });
  return transcription;
}

async function transcribeInChunks(audioPath) {
  const duration = getAudioDuration(audioPath);
  console.log(`Audio duration: ${duration} seconds`);

  if (duration <= 180) {
    console.log('Audio is short enough, transcribing directly...');
    return await transcribeAudio(audioPath);
  }

  console.log('Audio is long, splitting into chunks...');
  const chunkDir = audioPath + '_chunks';
  const chunks = splitAudio(audioPath, chunkDir);
  console.log(`Split into ${chunks.length} chunks`);

  const transcripts = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`Transcribing chunk ${i + 1} of ${chunks.length}...`);
    const text = await transcribeAudio(chunks[i]);
    transcripts.push(text);
  }

  fs.rmSync(chunkDir, { recursive: true, force: true });
  return transcripts.join(' ');
}

async function summarizeTranscript(transcript) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes video transcripts. Always respond with: 1) A brief summary paragraph, 2) Key points as a bullet list, 3) Any action items if present.',
      },
      {
        role: 'user',
        content: `Please summarize this transcript:\n\n${transcript}`,
      },
    ],
  });
  return response.choices[0].message.content;
}

app.post('/summarize', upload.single('video'), async (req, res) => {
  const videoPath = req.file.path;
  const audioPath = videoPath + '.wav';

  try {
    console.log('Extracting audio...');
    extractAudio(videoPath, audioPath);

    console.log('Transcribing audio...');
    const transcript = await transcribeInChunks(audioPath);

    console.log('Summarizing transcript...');
    const summary = await summarizeTranscript(transcript);

    res.json({ success: true, transcript, summary });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });

  } finally {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
});

app.post('/summarize-url', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'No URL provided' });

  const audioPath = `uploads/url_audio_${Date.now()}.wav`;
  fs.mkdirSync('uploads', { recursive: true });

  try {
    console.log('Downloading audio from URL...');
    downloadAudioFromURL(url, audioPath);

    console.log('Transcribing audio...');
    const transcript = await transcribeInChunks(audioPath);

    console.log('Summarizing transcript...');
    const summary = await summarizeTranscript(transcript);

    res.json({ success: true, transcript, summary });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: error.message });

  } finally {
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});