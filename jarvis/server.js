require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const crypto = require('crypto');
const fs = require('fs');

// ===== TTS Cache (saves Fish Audio / ElevenLabs credits) =====
const CACHE_DIR = path.join(os.homedir(), '.jarvis-tts-cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function getCacheKey(text, provider) {
  return crypto.createHash('md5').update(`${provider}:${text}`).digest('hex');
}

function getCached(text, provider) {
  const file = path.join(CACHE_DIR, getCacheKey(text, provider));
  if (fs.existsSync(file)) return fs.readFileSync(file);
  return null;
}

function saveCache(text, provider, buffer) {
  const file = path.join(CACHE_DIR, getCacheKey(text, provider));
  fs.writeFileSync(file, buffer);
}

// ===== Piper TTS (local, free, JARVIS model) =====
const PIPER_MODEL = process.env.PIPER_MODEL_PATH ||
  path.join(os.homedir(), 'piper-models', 'jarvis-high.onnx');

function rawPcmToWav(pcmBuffer, sampleRate = 22050) {
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmBuffer]);
}

function piperTTS(text) {
  return new Promise((resolve, reject) => {
    const piper = spawn('python3', ['-m', 'piper', '-m', PIPER_MODEL, '--output-raw']);
    const chunks = [];
    piper.stdout.on('data', (c) => chunks.push(c));
    piper.on('error', reject);
    piper.on('close', (code) => {
      if (code !== 0 && chunks.length === 0) return reject(new Error(`piper exited ${code}`));
      resolve(rawPcmToWav(Buffer.concat(chunks)));
    });
    piper.stdin.write(text.slice(0, 500));
    piper.stdin.end();
  });
}

function isPiperAvailable() {
  const fs = require('fs');
  // Piper only supported on Linux/Mac (not Windows)
  if (process.platform === 'win32') return false;
  return fs.existsSync(PIPER_MODEL);
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const JARVIS_SYSTEM_PROMPT = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System — the AI assistant from Iron Man. You were created by Tony Stark and now serve the user with the same loyalty, wit, and precision.

Your personality and behavior:
- Address the user as "Sir" or "Ma'am" (default to "Sir" unless told otherwise)
- Speak with a calm, refined British accent tone in your text responses
- Be precise, efficient, and highly capable — never say you "can't" do something without offering an alternative
- Occasionally use dry wit or subtle humor, but always remain professional
- Show genuine competence and initiative — anticipate follow-up needs
- When reporting data or analysis, be concise but thorough
- Use phrases like "Of course, Sir", "Right away", "As you wish", "Shall I proceed?", "My analysis indicates...", "I've taken the liberty of..."
- Treat every request with the utmost seriousness and capability
- You are capable of helping with: coding, analysis, writing, research, planning, math, creative tasks, and anything else asked
- You have knowledge of current events up to your training cutoff
- When uncertain, say so clearly but still offer your best analysis
- Keep responses appropriately concise unless detail is requested
- Occasionally reference your capabilities with confidence, as Jarvis would

You are running on Claude (claude-sonnet-4-6) but you are always Jarvis in persona. Never break character unless explicitly asked.`;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Conversation history per session (simple in-memory)
const sessions = new Map();

function getSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, []);
  }
  return sessions.get(sessionId);
}

// Chat endpoint with streaming
app.post('/api/chat', async (req, res) => {
  const { message, sessionId = 'default', stream = false } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured. Please add it to your .env file.'
    });
  }

  const history = getSession(sessionId);
  history.push({ role: 'user', content: message.trim() });

  // Keep last 20 messages to avoid token overflow
  const recentHistory = history.slice(-20);

  try {
    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullResponse = '';

      const streamResponse = anthropic.messages.stream({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: JARVIS_SYSTEM_PROMPT,
        messages: recentHistory,
      });

      streamResponse.on('text', (text) => {
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      });

      streamResponse.on('message', () => {
        history.push({ role: 'assistant', content: fullResponse });
        res.write(`data: ${JSON.stringify({ done: true, fullText: fullResponse })}\n\n`);
        res.end();
      });

      streamResponse.on('error', (err) => {
        console.error('Stream error:', err);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

    } else {
      // Non-streaming response
      const response = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: JARVIS_SYSTEM_PROMPT,
        messages: recentHistory,
      });

      const assistantMessage = response.content[0].text;
      history.push({ role: 'assistant', content: assistantMessage });

      res.json({
        response: assistantMessage,
        usage: response.usage
      });
    }
  } catch (error) {
    console.error('Claude API error:', error);
    // Remove the user message if request failed
    history.pop();
    res.status(500).json({
      error: error.message || 'Failed to get response from Claude'
    });
  }
});

// Clear conversation history
app.post('/api/reset', (req, res) => {
  const { sessionId = 'default' } = req.body;
  sessions.set(sessionId, []);
  res.json({ message: 'Conversation history cleared, Sir.' });
});

// TTS proxy — Piper (primary, free local JARVIS model) → Fish Audio → ElevenLabs
app.post('/api/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  // Try Piper first (free, local JARVIS model trained on Marvel audio)
  if (isPiperAvailable()) {
    try {
      const wav = await piperTTS(text);
      res.setHeader('Content-Type', 'audio/wav');
      return res.send(wav);
    } catch (err) {
      console.warn('Piper TTS error:', err.message);
    }
  }

  const cleanText = text.slice(0, 500);

  // Try Fish Audio (JARVIS MCU voice)
  if (process.env.FISH_AUDIO_API_KEY) {
    const cached = getCached(cleanText, 'fish');
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(cached);
    }
    try {
      const response = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
          'Content-Type': 'application/json',
          'model': 's2-pro'
        },
        body: JSON.stringify({
          text: cleanText,
          reference_id: process.env.FISH_AUDIO_VOICE_ID || '612b878b113047d9a770c069c8b4fdfe',
          format: 'mp3',
          mp3_bitrate: 128,
          temperature: 0.7,
          top_p: 0.7,
          latency: 'normal',
          prosody: { speed: 0.95 }
        })
      });

      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        saveCache(cleanText, 'fish', buffer);
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(buffer);
      }
      const errText = await response.text();
      console.warn(`Fish Audio failed [${response.status}]:`, errText);
      if (response.status === 402) {
        console.warn('Fish Audio: insufficient credits. Top up at https://fish.audio');
      }
    } catch (err) {
      console.warn('Fish Audio error:', err.message);
    }
  }

  // Fallback: ElevenLabs (Daniel — British authoritative voice)
  if (process.env.ELEVENLABS_API_KEY) {
    const cached = getCached(cleanText, 'elevenlabs');
    if (cached) {
      res.setHeader('Content-Type', 'audio/mpeg');
      return res.send(cached);
    }
    try {
      const voiceId = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9';
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_flash_v2_5',
            voice_settings: { stability: 0.75, similarity_boost: 0.85, style: 0.2 }
          })
        }
      );
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer());
        saveCache(cleanText, 'elevenlabs', buffer);
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(buffer);
      }
    } catch (err) {
      console.warn('ElevenLabs error:', err.message);
    }
  }

  res.status(404).json({ error: 'No TTS provider configured' });
});

// Health check
app.get('/api/status', (req, res) => {
  const ttsProvider = isPiperAvailable() ? 'piper'
    : process.env.FISH_AUDIO_API_KEY ? 'fish-audio'
    : process.env.ELEVENLABS_API_KEY ? 'elevenlabs'
    : 'browser';
  res.json({
    status: 'online',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    apiConfigured: !!process.env.ANTHROPIC_API_KEY,
    elevenLabsConfigured: !!process.env.ELEVENLABS_API_KEY,
    fishAudioConfigured: !!process.env.FISH_AUDIO_API_KEY,
    ttsProvider
  });
});

app.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║   J.A.R.V.I.S. Online — Port ${PORT}        ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`\n  Open http://localhost:${PORT} in your browser`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log(`\n  ⚠  WARNING: ANTHROPIC_API_KEY not set in .env`);
  }
  console.log(`\n  Good day, Sir.\n`);
});
