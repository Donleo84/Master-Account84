/* ===== BINGO GAME ENGINE ===== */

// ── Ranges: B 1-15 | I 16-30 | N 31-45 | G 46-60 | O 61-75
const COLS = ['B', 'I', 'N', 'G', 'O'];
const COL_RANGES = { B: [1,15], I: [16,30], N: [31,45], G: [46,60], O: [61,75] };
const COL_COLORS = { B: 'b', I: 'i', N: 'n', G: 'g', O: 'o' };

// ── Game state
const state = {
  mode: 'auto',        // 'auto' | 'manual'
  callSec: 5,          // seconds between auto-calls
  numCards: 1,
  bag: [],             // numbers yet to be drawn
  called: [],          // drawn numbers in order
  calledSet: new Set(),
  cards: [],           // each card: [[{num,daubed}x5]x5]
  paused: false,
  timer: null,
  won: false,
  totalCalled: 0,
};

// ── Audio context (lazy)
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, volume = 0.3) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (_) {}
}

function playCalled() {
  playTone(660, 'triangle', 0.12, 0.25);
  setTimeout(() => playTone(880, 'sine', 0.1, 0.2), 130);
}
function playDaub() {
  playTone(440, 'sine', 0.08, 0.2);
}
function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 'triangle', 0.25, 0.4), i * 120));
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ── Helpers
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildBag() {
  const nums = Array.from({ length: 75 }, (_, i) => i + 1);
  return shuffle(nums);
}

function generateCard() {
  // 5 columns, each with 5 unique numbers from its range
  const grid = [];
  for (let c = 0; c < 5; c++) {
    const [lo, hi] = Object.values(COL_RANGES)[c];
    const pool = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
    shuffle(pool);
    const col = pool.slice(0, 5).map((num, r) => ({
      num,
      daubed: (c === 2 && r === 2), // FREE space
      free: (c === 2 && r === 2),
    }));
    grid.push(col);
  }
  return grid; // grid[col][row]
}

function letterFor(num) {
  if (num <= 15) return 'B';
  if (num <= 30) return 'I';
  if (num <= 45) return 'N';
  if (num <= 60) return 'G';
  return 'O';
}

// ── Win detection
function checkWins(card) {
  const wins = [];

  // Rows
  for (let r = 0; r < 5; r++) {
    if ([0,1,2,3,4].every(c => card[c][r].daubed)) {
      wins.push([0,1,2,3,4].map(c => [c, r]));
    }
  }
  // Columns
  for (let c = 0; c < 5; c++) {
    if ([0,1,2,3,4].every(r => card[c][r].daubed)) {
      wins.push([0,1,2,3,4].map(r => [c, r]));
    }
  }
  // Diagonals
  if ([0,1,2,3,4].every(i => card[i][i].daubed)) {
    wins.push([0,1,2,3,4].map(i => [i, i]));
  }
  if ([0,1,2,3,4].every(i => card[i][4-i].daubed)) {
    wins.push([0,1,2,3,4].map(i => [i, 4-i]));
  }

  return wins;
}

// ── DOM helpers
const $ = (id) => document.getElementById(id);

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ── Board tracker render
function renderBoardNums() {
  for (const [letter, [lo, hi]] of Object.entries(COL_RANGES)) {
    const container = $(`${letter.toLowerCase()}-nums`);
    container.innerHTML = '';
    for (let n = lo; n <= hi; n++) {
      const div = document.createElement('div');
      div.className = 'board-num' + (state.calledSet.has(n) ? ' called' : '');
      div.id = `bn-${n}`;
      div.textContent = n;
      container.appendChild(div);
    }
  }
}

// ── Bingo card DOM
function renderCards() {
  const area = $('cardsArea');
  area.innerHTML = '';
  area.className = '';
  if (state.numCards === 2) area.classList.add('two-up');
  if (state.numCards === 4) area.classList.add('four-up');

  state.cards.forEach((card, ci) => {
    const el = document.createElement('div');
    el.className = 'bingo-card';
    el.id = `card-${ci}`;

    // Header
    const hdr = document.createElement('div');
    hdr.className = 'card-header';
    COLS.forEach((l) => {
      const s = document.createElement('span');
      s.className = `ch-${COL_COLORS[l]}`;
      s.textContent = l;
      hdr.appendChild(s);
    });
    el.appendChild(hdr);

    // Grid — iterate row-first for display
    const grid = document.createElement('div');
    grid.className = 'card-grid';
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const cell = card[c][r];
        const div = document.createElement('div');
        div.className = 'cell' + (cell.free ? ' free daubed' : '') + (cell.daubed && !cell.free ? ' daubed' : '');
        div.id = `c${ci}-${c}-${r}`;
        div.textContent = cell.free ? 'FREE' : cell.num;
        div.dataset.card = ci;
        div.dataset.col = c;
        div.dataset.row = r;
        div.addEventListener('click', onCellClick);
        grid.appendChild(div);
      }
    }
    el.appendChild(grid);
    area.appendChild(el);
  });
}

function updateCardCell(ci, c, r) {
  const cell = state.cards[ci][c][r];
  const div = $(`c${ci}-${c}-${r}`);
  if (!div) return;
  div.className = 'cell flash' + (cell.free ? ' free daubed' : '') + (cell.daubed && !cell.free ? ' daubed' : '');
  setTimeout(() => div.classList.remove('flash'), 400);
}

function highlightWinCells(ci, winLines) {
  winLines.forEach(line => {
    line.forEach(([c, r]) => {
      const div = $(`c${ci}-${c}-${r}`);
      if (div) div.classList.add('win-cell');
    });
  });
  $(`card-${ci}`).classList.add('has-win');
}

// ── Calling a number
function callNumber() {
  if (state.bag.length === 0) {
    endGame('All 75 numbers called — game over!');
    return;
  }

  const num = state.bag.pop();
  state.called.push(num);
  state.calledSet.add(num);
  state.totalCalled++;

  const letter = letterFor(num);
  showBall(letter, num);
  playCalled();
  vibrate([40]);
  updateBoardNum(num);
  autoDaubCards(num);
  $('callCount').textContent = `${state.totalCalled} / 75 called`;
}

function showBall(letter, num) {
  const ball = $('calledBall');
  ball.className = `ball ball-${letter.toLowerCase()} animate`;
  $('ballLetter').textContent = letter;
  $('ballNumber').textContent = num;
  setTimeout(() => ball.classList.remove('animate'), 450);
}

function updateBoardNum(num) {
  const div = $(`bn-${num}`);
  if (!div) return;
  div.classList.add('called', 'just-called');
  setTimeout(() => div.classList.remove('just-called'), 500);
}

function autoDaubCards(num) {
  let anyWin = false;
  state.cards.forEach((card, ci) => {
    const letter = letterFor(num);
    const colIdx = COLS.indexOf(letter);
    const col = card[colIdx];
    const rowIdx = col.findIndex(cell => cell.num === num);
    if (rowIdx !== -1 && !col[rowIdx].daubed) {
      col[rowIdx].daubed = true;
      updateCardCell(ci, colIdx, rowIdx);
      const wins = checkWins(card);
      if (wins.length > 0) {
        highlightWinCells(ci, wins);
        anyWin = true;
      }
    }
  });
  if (anyWin && !state.won) triggerWin();
}

function onCellClick(e) {
  if (state.won) return;
  const ci = +e.currentTarget.dataset.card;
  const c  = +e.currentTarget.dataset.col;
  const r  = +e.currentTarget.dataset.row;
  const cell = state.cards[ci][c][r];
  if (cell.free) return;

  // Allow manual daub in both modes
  if (!cell.daubed) {
    cell.daubed = true;
    playDaub();
    vibrate([20]);
    updateCardCell(ci, c, r);
    const wins = checkWins(state.cards[ci]);
    if (wins.length > 0) {
      highlightWinCells(ci, wins);
      if (!state.won) triggerWin();
    }
  }
}

// ── Win sequence
function triggerWin() {
  state.won = true;
  stopAutoCall();
  playWin();
  vibrate([80, 60, 80, 60, 200]);
  const called = state.totalCalled;
  $('winSub').textContent = `You got BINGO in ${called} number${called !== 1 ? 's' : ''}!`;
  $('winBanner').classList.remove('hidden');
  launchConfetti();
}

function endGame(msg) {
  stopAutoCall();
  $('winSub').textContent = msg;
  $('winBanner').classList.remove('hidden');
}

function launchConfetti() {
  const colors = ['#4fc3f7','#81c784','#ffb74d','#f06292','#ce93d8','#ffd54f','#fff'];
  for (let i = 0; i < 80; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.top = '-20px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (1.5 + Math.random() * 2.5) + 's';
    piece.style.animationDelay = (Math.random() * 0.8) + 's';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (8 + Math.random() * 10) + 'px';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 4000);
  }
}

// ── Auto-caller
function startAutoCall() {
  if (state.mode !== 'auto') return;
  state.paused = false;
  $('callBtn').style.display = 'none';
  $('pauseBtn').style.display = 'flex';
  scheduleTick();
}

function scheduleTick() {
  clearInterval(state.timer);
  if (state.mode !== 'auto' || state.paused || state.won) return;
  callNumber();
  if (state.bag.length > 0) {
    state.timer = setInterval(() => {
      if (!state.paused && !state.won) callNumber();
      if (state.bag.length === 0 || state.won) clearInterval(state.timer);
    }, state.callSec * 1000);
  }
}

function pauseAutoCall() {
  state.paused = true;
  clearInterval(state.timer);
  $('callBtn').style.display = 'flex';
  $('pauseBtn').style.display = 'none';
}

function resumeAutoCall() {
  if (state.paused && state.mode === 'auto' && !state.won) {
    startAutoCall();
  }
}

function stopAutoCall() {
  clearInterval(state.timer);
  state.paused = true;
  $('callBtn').style.display = state.mode === 'auto' ? 'flex' : 'flex';
  $('pauseBtn').style.display = 'none';
}

// ── Start game
function startGame() {
  state.bag = buildBag();
  state.called = [];
  state.calledSet = new Set();
  state.cards = Array.from({ length: state.numCards }, generateCard);
  state.paused = false;
  state.won = false;
  state.totalCalled = 0;

  $('calledBall').className = 'ball ball-idle';
  $('ballLetter').textContent = '?';
  $('ballNumber').textContent = '--';
  $('callCount').textContent = '0 / 75 called';
  $('winBanner').classList.add('hidden');

  // Mode-specific controls
  $('callBtn').style.display = 'flex';
  $('pauseBtn').style.display = 'none';

  if (state.mode === 'auto') {
    $('callBtn').title = 'Resume';
    $('prevBtn').style.display = 'none';
  } else {
    $('callBtn').title = 'Call Next';
    $('prevBtn').style.display = 'flex';
  }

  renderBoardNums();
  renderCards();
  showScreen('screen-game');

  if (state.mode === 'auto') {
    // Brief delay so screen transition feels smooth
    setTimeout(() => startAutoCall(), 800);
  }
}

// ── Settings screen logic
function initStartScreen() {
  // Mode buttons
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.mode = btn.dataset.mode;
      $('speedRow').style.display = state.mode === 'auto' ? '' : 'none';
    });
  });

  // Speed buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.callSec = parseFloat(btn.dataset.sec);
    });
  });

  // Card count buttons
  document.querySelectorAll('.count-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.numCards = parseInt(btn.dataset.cards);
    });
  });

  $('startBtn').addEventListener('click', startGame);
}

// ── Game screen controls
function initGameControls() {
  // Call / Resume button
  $('callBtn').addEventListener('click', () => {
    // Wake audio context on user gesture
    try { getAudio().resume(); } catch (_) {}

    if (state.won) return;
    if (state.mode === 'auto') {
      resumeAutoCall();
    } else {
      callNumber();
    }
  });

  // Pause button (auto mode only)
  $('pauseBtn').addEventListener('click', pauseAutoCall);

  // Previous called (manual mode info display)
  $('prevBtn').addEventListener('click', () => {
    const last = state.called.at(-1);
    if (last == null) return;
    showBall(letterFor(last), last);
  });

  // New game
  $('newGameBtn').addEventListener('click', () => {
    stopAutoCall();
    showScreen('screen-start');
  });

  // Win banner play again
  $('winNewBtn').addEventListener('click', () => {
    $('winBanner').classList.add('hidden');
    stopAutoCall();
    showScreen('screen-start');
  });
}

// ── Init
document.addEventListener('DOMContentLoaded', () => {
  initStartScreen();
  initGameControls();
});
