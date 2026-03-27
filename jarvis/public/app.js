// ===== J.A.R.V.I.S. Frontend Application =====

const SESSION_ID = 'jarvis-' + Date.now();
let messageCount = 0;
let isListening = false;
let recognition = null;
let synth = window.speechSynthesis;
let voices = [];
let isSpeaking = false;
let autoCtx = null;
let vizAnimId = null;
let pulseOffset = 0;

// ===== DOM Elements =====
const chatLog = document.getElementById('chatLog');
const textInput = document.getElementById('textInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const voiceTranscript = document.getElementById('voiceTranscript');
const typingIndicator = document.getElementById('typingIndicator');
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const listenStatus = document.getElementById('listenStatus');
const msgCountEl = document.getElementById('msgCount');
const voiceSelect = document.getElementById('voiceSelect');
const speechRate = document.getElementById('speechRate');
const speechPitch = document.getElementById('speechPitch');
const voiceOutputToggle = document.getElementById('voiceOutputToggle');
const autoListenToggle = document.getElementById('autoListenToggle');
const resetBtn = document.getElementById('resetBtn');
const activityLog = document.getElementById('activityLog');
const memBar = document.getElementById('memBar');
const memVal = document.getElementById('memVal');
const voiceBar = document.getElementById('voiceBar');
const voiceVal = document.getElementById('voiceVal');
const apiBar = document.getElementById('apiBar');
const apiVal = document.getElementById('apiVal');
const currentTimeEl = document.getElementById('currentTime');
const vizCanvas = document.getElementById('vizCanvas');
const pulseCanvas = document.getElementById('pulseCanvas');
const modelDisplay = document.getElementById('modelDisplay');

// ===== Init =====
async function init() {
  updateTime();
  setInterval(updateTime, 1000);
  initVoices();
  initViz();
  initPulse();
  await checkStatus();
  bindEvents();
  setTimestamps();
  addActivity('JARVIS initialized');
}

// ===== Status Check =====
async function checkStatus() {
  setStatus('checking', 'CONNECTING');
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (data.apiConfigured) {
      setStatus('online', 'ONLINE');
      apiBar.style.width = '100%';
      apiBar.classList.remove('warning');
      apiVal.textContent = 'CONNECTED';
      modelDisplay.textContent = data.model || 'claude-sonnet-4-6';
    } else {
      setStatus('offline', 'NO API KEY');
      apiBar.style.width = '15%';
      apiVal.textContent = 'NO KEY';
      addMessage('jarvis', 'Warning, Sir: No ANTHROPIC_API_KEY detected. Please add your API key to the .env file and restart the server. I\'m afraid I\'m rather limited without it.');
    }
  } catch {
    setStatus('offline', 'SERVER DOWN');
    apiBar.style.width = '5%';
    apiVal.textContent = 'OFFLINE';
  }
}

function setStatus(state, text) {
  statusIndicator.className = 'status-dot ' + state;
  statusText.textContent = text;
}

// ===== Voice Synthesis =====
function initVoices() {
  const loadVoices = () => {
    voices = synth.getVoices();
    voiceSelect.innerHTML = '';

    // Prefer British English voices for Jarvis effect
    const sorted = [...voices].sort((a, b) => {
      const preferredLangs = ['en-GB', 'en-AU', 'en-US'];
      const aScore = preferredLangs.findIndex(l => a.lang.startsWith(l));
      const bScore = preferredLangs.findIndex(l => b.lang.startsWith(l));
      return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
    });

    sorted.forEach((voice, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${voice.name} (${voice.lang})`;
      // Default select first British English voice
      if (voice.lang === 'en-GB' && !voiceSelect.querySelector('[selected]')) {
        opt.selected = true;
      }
      voiceSelect.appendChild(opt);
    });

    // If no British voice, select first English
    if (!voiceSelect.value && sorted.length > 0) {
      voiceSelect.value = 0;
    }
  };

  if (synth.onvoiceschanged !== undefined) {
    synth.onvoiceschanged = loadVoices;
  }
  loadVoices();
}

function getSelectedVoice() {
  const sorted = [...voices].sort((a, b) => {
    const preferredLangs = ['en-GB', 'en-AU', 'en-US'];
    const aScore = preferredLangs.findIndex(l => a.lang.startsWith(l));
    const bScore = preferredLangs.findIndex(l => b.lang.startsWith(l));
    return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
  });
  return sorted[parseInt(voiceSelect.value)] || voices[0];
}

function speak(text) {
  if (!voiceOutputToggle.checked || !synth) return;

  synth.cancel();

  // Clean text for speech (remove markdown, code blocks)
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted for brevity.')
    .replace(/`[^`]+`/g, (m) => m.slice(1, -1))
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .slice(0, 500); // limit to 500 chars for TTS

  const utter = new SpeechSynthesisUtterance(cleanText);
  utter.voice = getSelectedVoice();
  utter.rate = parseFloat(speechRate.value);
  utter.pitch = parseFloat(speechPitch.value);
  utter.volume = 1;

  isSpeaking = true;
  voiceBar.style.width = '80%';
  voiceVal.textContent = 'SPEAKING';

  utter.onend = () => {
    isSpeaking = false;
    voiceBar.style.width = '0%';
    voiceVal.textContent = 'INACTIVE';
    if (autoListenToggle.checked && !isListening) {
      setTimeout(startListening, 500);
    }
  };

  utter.onerror = () => {
    isSpeaking = false;
    voiceBar.style.width = '0%';
    voiceVal.textContent = 'INACTIVE';
  };

  synth.speak(utter);
}

// ===== Voice Recognition =====
function initRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    listenStatus.textContent = 'Voice input not supported (use Chrome/Edge)';
    micBtn.disabled = true;
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = true;
  rec.lang = 'en-US';

  rec.onstart = () => {
    isListening = true;
    micBtn.classList.add('listening');
    voiceTranscript.classList.remove('hidden');
    textInput.style.opacity = '0.3';
    listenStatus.textContent = 'LISTENING...';
    listenStatus.classList.add('active');
    voiceBar.style.width = '60%';
    voiceVal.textContent = 'LISTENING';
    addActivity('Voice input active');
  };

  rec.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join('');
    voiceTranscript.textContent = transcript;

    if (e.results[e.results.length - 1].isFinal) {
      stopListening();
      textInput.style.opacity = '1';
      voiceTranscript.classList.add('hidden');
      voiceTranscript.textContent = '';
      sendMessage(transcript);
    }
  };

  rec.onerror = (e) => {
    console.warn('Speech recognition error:', e.error);
    stopListening();
    if (e.error !== 'no-speech' && e.error !== 'aborted') {
      addActivity(`Voice error: ${e.error}`);
    }
  };

  rec.onend = () => {
    stopListening();
  };

  return rec;
}

function startListening() {
  if (isSpeaking) return;
  if (!recognition) recognition = initRecognition();
  if (!recognition || isListening) return;
  try {
    recognition.start();
  } catch (e) {
    console.warn('Could not start recognition:', e);
  }
}

function stopListening() {
  isListening = false;
  micBtn.classList.remove('listening');
  textInput.style.opacity = '1';
  voiceTranscript.classList.add('hidden');
  listenStatus.textContent = 'Ready';
  listenStatus.classList.remove('active');
  voiceBar.style.width = '0%';
  voiceVal.textContent = 'INACTIVE';
  try {
    if (recognition) recognition.stop();
  } catch {}
}

// ===== Chat =====
async function sendMessage(text) {
  const msg = (text || textInput.value).trim();
  if (!msg) return;

  textInput.value = '';
  autoResize(textInput);
  addMessage('user', msg);
  messageCount++;
  updateMessageCount();
  addActivity(`Query: "${msg.slice(0, 30)}..."`);

  typingIndicator.classList.remove('hidden');
  chatLog.scrollTop = chatLog.scrollHeight;

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, sessionId: SESSION_ID, stream: false })
    });

    typingIndicator.classList.add('hidden');

    if (!response.ok) {
      const err = await response.json();
      addMessage('jarvis', `I'm afraid I've encountered an error, Sir: ${err.error}`);
      return;
    }

    const data = await response.json();
    addMessage('jarvis', data.response);
    speak(data.response);
    updateMemBar();

  } catch (error) {
    typingIndicator.classList.add('hidden');
    addMessage('jarvis', `I apologize, Sir. I appear to be having difficulty connecting. Please ensure the server is running. Error: ${error.message}`);
  }
}

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = `msg-avatar ${role === 'jarvis' ? 'jarvis-avatar' : 'user-avatar'}`;
  avatar.textContent = role === 'jarvis' ? 'J' : 'S';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const label = document.createElement('div');
  label.className = 'msg-label';
  label.textContent = role === 'jarvis' ? 'JARVIS' : 'SIR';

  const msgText = document.createElement('div');
  msgText.className = 'msg-text';
  msgText.innerHTML = formatMessage(text);

  const time = document.createElement('div');
  time.className = 'msg-time';
  time.textContent = getTimestamp();

  content.appendChild(label);
  content.appendChild(msgText);
  content.appendChild(time);
  div.appendChild(avatar);
  div.appendChild(content);

  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function formatMessage(text) {
  // Code blocks
  text = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
    `<pre><code>${escapeHtml(code.trim())}</code></pre>`
  );
  // Inline code
  text = text.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Line breaks
  text = text.replace(/\n/g, '<br>');
  return text;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== Event Bindings =====
function bindEvents() {
  sendBtn.addEventListener('click', () => sendMessage());

  textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  textInput.addEventListener('input', () => autoResize(textInput));

  micBtn.addEventListener('click', () => {
    if (isListening) stopListening();
    else startListening();
  });

  resetBtn.addEventListener('click', async () => {
    if (!confirm('Clear all conversation history?')) return;
    await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID })
    });
    chatLog.innerHTML = '';
    messageCount = 0;
    updateMessageCount();
    updateMemBar();
    addMessage('jarvis', 'Memory wiped clean, Sir. I\'ve cleared our conversation history. Ready for fresh orders.');
    addActivity('Memory cleared');
  });

  document.querySelectorAll('.quick-cmd').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.cmd));
  });

  // Space bar to toggle mic when not typing
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement !== textInput) {
      e.preventDefault();
      if (isListening) stopListening();
      else startListening();
    }
  });
}

// ===== Helpers =====
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function updateTime() {
  const now = new Date();
  currentTimeEl.textContent = now.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function getTimestamp() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function setTimestamps() {
  document.querySelectorAll('[data-time="now"]').forEach(el => {
    el.textContent = getTimestamp();
    el.removeAttribute('data-time');
  });
}

function updateMessageCount() {
  msgCountEl.textContent = `${messageCount} QUER${messageCount === 1 ? 'Y' : 'IES'} PROCESSED`;
}

function updateMemBar() {
  const histLen = messageCount * 2;
  const pct = Math.min(histLen / 40 * 100, 100);
  memBar.style.width = pct + '%';
  memVal.textContent = `${histLen} msgs`;
}

function addActivity(text) {
  const item = document.createElement('div');
  item.className = 'activity-item';
  item.textContent = `[${getTimestamp()}] ${text}`;
  activityLog.insertBefore(item, activityLog.firstChild);
  if (activityLog.children.length > 10) {
    activityLog.removeChild(activityLog.lastChild);
  }
}

// ===== Audio Visualizer =====
function initViz() {
  const ctx = vizCanvas.getContext('2d');
  const W = vizCanvas.width;
  const H = vizCanvas.height;

  let data = new Array(40).fill(0);

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Idle animation
    const t = Date.now() / 1000;
    data = data.map((_, i) => {
      if (isListening) return Math.random() * H * 0.8;
      if (isSpeaking) return (Math.sin(t * 4 + i * 0.5) * 0.4 + 0.6) * H * 0.6;
      return (Math.sin(t * 0.5 + i * 0.3) * 0.15 + 0.2) * H * 0.4;
    });

    const barW = W / data.length;
    data.forEach((val, i) => {
      const x = i * barW;
      const h = val;
      const y = (H - h) / 2;

      const alpha = isListening ? 0.9 : isSpeaking ? 0.7 : 0.4;
      ctx.fillStyle = `rgba(0, 212, 255, ${alpha})`;
      ctx.fillRect(x + 1, y, barW - 2, h);
    });

    requestAnimationFrame(draw);
  }
  draw();
}

// ===== Pulse Line =====
function initPulse() {
  const ctx = pulseCanvas.getContext('2d');
  const W = pulseCanvas.width;
  const H = pulseCanvas.height;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();

    const t = Date.now() / 1000;
    for (let x = 0; x < W; x++) {
      const nx = x / W;
      const y = H / 2 + Math.sin((nx * 8 + t * 1.5) * Math.PI) * (H * 0.3)
                      + Math.sin((nx * 3 + t * 0.7) * Math.PI) * (H * 0.1);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    requestAnimationFrame(draw);
  }
  draw();
}

// ===== Start =====
window.addEventListener('load', init);
