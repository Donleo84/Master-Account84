require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const path = require('path');

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

// Health check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    apiConfigured: !!process.env.ANTHROPIC_API_KEY
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
