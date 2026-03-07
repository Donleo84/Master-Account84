'use strict';
// ============================================================
// RETRO GAFFER — Complete Game Engine v1.0
// ============================================================

// ---- UTILITY ----
const rand  = (n) => Math.floor(Math.random() * n);
const randR = (a, b) => a + rand(b - a + 1);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const pick  = (arr) => arr[rand(arr.length)];
const fmt   = (n, dp = 1) => n.toFixed(dp);
const fmtM  = (n) => `£${fmt(n)}m`;

function el(id) { return document.getElementById(id); }
function setText(id, v) { const e = el(id); if (e) e.textContent = v; }
function setHtml(id, v) { const e = el(id); if (e) e.innerHTML = v; }

let _toastTimer = null;
function toast(msg, type = 'default') {
  const t = el('toastEl');
  if (!t) return;
  t.textContent = msg;
  t.className = `toast${type !== 'default' ? ' ' + type : ''}`;
  t.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.add('hidden'), 3500);
}


// ---- GAME STATE ----
const G = {
  // Meta
  screen: 'splash',
  tab: 'dashboard',
  managerName: '',
  difficulty: 'standard',
  season: 1,
  week: 1,
  totalWeeks: 0,

  // Club
  userClub: null,      // club name string
  userLeague: null,    // league id string
  userClubData: null,  // ref to CLUBS entry

  // Finances
  budget: 0,
  wages: 0,
  debt: 0,
  sponsorIncome: 0,

  // Confidence
  boardConf: 65,
  fanConf: 65,
  boardObjective: 'Mid-table',
  consecutiveLosses: 0,
  sackWarning: false,

  // Stadium
  stadium: {
    name: 'Home Ground',
    capacity: 25000,
    upgradeLevel: 0,
    condition: 85,
    trainingLevel: 1,
    youthLevel: 1,
    scoutLevel: 1,
    medicalLevel: 1,
  },

  // Squad (user's players)
  squad: [],
  squadSort: { key: 'ovr', dir: -1 },
  squadFilter: 'ALL',
  startingXI: [],  // array of player ids
  subs: [],        // array of player ids (up to 7)

  // Tactics
  tactics: {
    formation: '4-4-2',
    style: 'Balanced',      // Defensive / Balanced / Attacking
    mentality: 'Normal',    // Cautious / Normal / Aggressive
    pressing: 50,
    tempo: 50,
    width: 50,
    defensiveLine: 50,
  },

  // Transfers
  market: [],           // available players to buy
  pendingBids: [],      // bids user has sent
  incomingBids: [],     // AI bids for user's players
  transferWindow: false,

  // Leagues & Fixtures
  leagues: {},     // { leagueId: [ teamObj ] }
  fixtures: {},    // { leagueId: [ [ matchObj ] ] }

  // Inbox
  inbox: [],
  inboxUnread: 0,

  // Match history this season
  matchHistory: [],

  // Season records
  records: { topScorer: null, topScorers: [] },

  // Match state (active match)
  match: null,
};

// ---- LEAGUE HELPERS ----
function getLeagueConfig(id) {
  return LEAGUE_CONFIG.find(l => l.id === id);
}

function getLeagueTeams(leagueId) {
  return G.leagues[leagueId] || [];
}

function getUserTeam() {
  return getLeagueTeams(G.userLeague).find(t => t.club === G.userClub);
}

function findTeamByName(name) {
  for (const teams of Object.values(G.leagues)) {
    const t = teams.find(x => x.club === name);
    if (t) return t;
  }
  return null;
}

function getClubData(name) {
  return CLUBS.find(c => c.name === name);
}

// ---- INITIALISE LEAGUES ----
function initLeagues() {
  G.leagues = {};
  G.fixtures = {};

  for (const cfg of LEAGUE_CONFIG) {
    const clubs = CLUBS.filter(c => c.league === cfg.id);
    if (!clubs.length) continue;

    G.leagues[cfg.id] = clubs.map(club => ({
      club: club.name,
      short: club.short,
      kitH: club.kitH,
      kitA: club.kitA,
      strength: club.strength,
      // League table
      p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      // Additional
      form: [],       // last 5: 'W'/'D'/'L'
      squad: [],      // populated separately
      budget: club.budget,
      wages: club.wages,
    }));

    // Generate squads for all teams in this league
    for (const team of G.leagues[cfg.id]) {
      const clubData = getClubData(team.club);
      team.squad = generateSquad(clubData);
    }

    const teamNames = clubs.map(c => c.name);
    G.fixtures[cfg.id] = createRoundRobin(teamNames);
  }
}

// ---- DIFFICULTY MODIFIERS ----
function diffMod(base) {
  const mods = { easy: 1.25, standard: 1.0, hard: 0.75 };
  return Math.round(base * (mods[G.difficulty] || 1.0));
}
function boardPatienceMod() {
  const m = { easy: 1.5, standard: 1.0, hard: 0.6 };
  return m[G.difficulty] || 1.0;
}


// ============================================================
// SCREEN MANAGEMENT
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  const s = el(id);
  if (s) s.classList.remove('hidden');
  G.screen = id;
}

function showTab(tab) {
  G.tab = tab;
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  const panel = el(`tab-${tab}`);
  if (panel) panel.classList.remove('hidden');
  renderTab(tab);
}

function renderTab(tab) {
  const map = {
    dashboard: renderDashboard,
    squad:     renderSquad,
    tactics:   renderTactics,
    scouting:  renderScouting,
    transfers: renderTransfers,
    finances:  renderFinances,
    stadium:   renderStadium,
    league:    renderLeague,
    fixtures:  renderFixtures,
  };
  if (map[tab]) map[tab]();
}

// ---- HUD ----
function refreshHud() {
  if (!G.userClub) return;
  const cd = G.userClubData;
  setText('hudManager', G.managerName || 'Manager');
  setText('hudClubName', G.userClub);
  setText('hudLeague', getLeagueConfig(G.userLeague)?.name || G.userLeague);
  setText('hudSeason', `S${G.season}`);
  setText('hudWeek', `W${G.week}`);
  setText('hudBudget', fmtM(G.budget));
  setText('hudWages', fmtM(G.wages) + '/w');
  setText('hudBoardPct', `${Math.round(G.boardConf)}%`);
  setText('hudFansPct', `${Math.round(G.fanConf)}%`);
  const bb = el('hudBoardBar'); if (bb) bb.style.width = `${G.boardConf}%`;
  const fb = el('hudFansBar'); if (fb) fb.style.width = `${G.fanConf}%`;
  // Badge
  const badge = el('hudBadge');
  if (badge && cd) {
    badge.style.background = cd.kitH;
    badge.style.color = contrastColor(cd.kitH);
    badge.textContent = cd.short;
  }
}

function contrastColor(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 128 ? '#000' : '#fff';
}


// ============================================================
// SETUP SCREEN
// ============================================================
function renderSetup() {
  renderLeagueFilterTabs();
  filterClubsBy('ALL');
}

let selectedLeagueFilter = 'ALL';
let selectedSetupClub = null;

function renderLeagueFilterTabs() {
  const container = el('leagueFilterTabs');
  if (!container) return;
  const leagues = ['ALL', ...LEAGUE_CONFIG.map(l => l.name)];
  container.innerHTML = leagues.map(lg => `
    <button class="league-tab${selectedLeagueFilter === lg ? ' active' : ''}" onclick="RG.filterClubsBy('${lg}')">${lg}</button>
  `).join('');
}

function filterClubsBy(leagueName) {
  selectedLeagueFilter = leagueName;
  renderLeagueFilterTabs();
  const grid = el('clubGrid');
  if (!grid) return;
  const clubs = leagueName === 'ALL'
    ? CLUBS
    : CLUBS.filter(c => {
        const cfg = LEAGUE_CONFIG.find(l => l.id === c.league);
        return cfg && cfg.name === leagueName;
      });

  grid.innerHTML = clubs.map(c => {
    const cfg = LEAGUE_CONFIG.find(l => l.id === c.league);
    return `<button class="club-btn${selectedSetupClub === c.name ? ' selected' : ''}"
      onclick="RG.selectClub('${c.name}')"
      style="border-left:3px solid ${c.kitH};"
    >${c.name}<br><span class="text-dim text-xs">${cfg ? cfg.name : ''}</span></button>`;
  }).join('');
}

function selectClub(name) {
  selectedSetupClub = name;
  filterClubsBy(selectedLeagueFilter); // re-render to show selected
  renderClubPreview(name);
  const btn = el('startCareerBtn');
  if (btn) btn.classList.remove('hidden');
}

function renderClubPreview(name) {
  const club = CLUBS.find(c => c.name === name);
  if (!club) return;
  const cfg = LEAGUE_CONFIG.find(l => l.id === club.league);
  el('clubPreviewEmpty').classList.add('hidden');
  const content = el('clubPreviewContent');
  content.classList.remove('hidden');

  const strPct = Math.round(((club.strength - 48) / 47) * 100);
  const difficulty = club.strength >= 85 ? 'Elite (Hard)' : club.strength >= 72 ? 'Strong (Medium)' : club.strength >= 60 ? 'Mid-table' : 'Underdog (Easy)';

  content.innerHTML = `
    <div class="preview-kit">
      <div class="kit-swatch" style="background:${club.kitH}" title="Home kit"></div>
      <div class="kit-swatch" style="background:${club.kitA};border-color:#555;" title="Away kit"></div>
      <div>
        <div style="font-size:1.1rem;color:var(--text-bright);">${club.name}</div>
        <div class="text-xs text-dim">${cfg ? cfg.name + ' · ' + cfg.country : ''}</div>
      </div>
    </div>
    <div class="preview-stat"><span>Stadium</span><span>${club.stadium}</span></div>
    <div class="preview-stat"><span>Capacity</span><span>${club.cap.toLocaleString()}</span></div>
    <div class="preview-stat"><span>Transfer Budget</span><span style="color:var(--success)">${fmtM(club.budget)}</span></div>
    <div class="preview-stat"><span>Wage Bill/w</span><span>${fmtM(club.wages)}</span></div>
    <div class="preview-stat"><span>Board Objective</span><span style="color:var(--accent2)">${club.obj}</span></div>
    <div class="preview-stat"><span>Board Patience</span><span>${club.patience}</span></div>
    <div class="preview-stat"><span>Difficulty</span><span>${difficulty}</span></div>
    <div style="margin-top:8px;">
      <div class="text-xs text-dim" style="margin-bottom:3px;">SQUAD STRENGTH</div>
      <div class="strength-bar-wrap"><div class="strength-bar" style="width:${strPct}%"></div></div>
    </div>
  `;
}

function confirmStartCareer() {
  const nameInput = el('managerNameInput');
  const name = (nameInput ? nameInput.value.trim() : '') || 'The Gaffer';
  if (!selectedSetupClub) { toast('Select a club first!', 'warning'); return; }
  G.managerName = name;
  G.difficulty = el('difficultySelect')?.value || 'standard';
  startCareer(selectedSetupClub);
}


// ============================================================
// CAREER INITIALISATION
// ============================================================
function startCareer(clubName) {
  const clubData = CLUBS.find(c => c.name === clubName);
  if (!clubData) { toast('Club not found!', 'danger'); return; }

  G.userClub     = clubName;
  G.userLeague   = clubData.league;
  G.userClubData = clubData;
  G.season       = 1;
  G.week         = 1;
  G.totalWeeks   = 0;

  // Apply difficulty modifiers
  const budgetMult = { easy: 1.3, standard: 1.0, hard: 0.75 }[G.difficulty] || 1.0;
  G.budget    = Math.round(clubData.budget * budgetMult * 10) / 10;
  G.wages     = clubData.wages;
  G.sponsorIncome = Math.round(clubData.cap * 0.000012 * 10) / 10;
  G.boardConf = 65;
  G.fanConf   = 65;
  G.boardObjective = clubData.obj;
  G.sackWarning   = false;
  G.consecutiveLosses = 0;

  G.stadium = {
    name: clubData.stadium,
    capacity: clubData.cap,
    upgradeLevel: 0,
    condition: 85,
    trainingLevel: 1,
    youthLevel: 1,
    scoutLevel: 1,
    medicalLevel: 1,
  };

  G.inbox = [];
  G.matchHistory = [];
  G.transferWindow = true; // start of season window open

  // Build all leagues
  initLeagues();

  // Copy user's squad from generated league data
  const userTeam = getUserTeam();
  if (userTeam) {
    G.squad = userTeam.squad;
  }

  // Auto-pick starting XI
  autoPickXI();

  // Generate transfer market
  generateMarket();

  // Opening inbox messages
  addInbox(`Welcome to ${clubName}! The board expects: ${clubData.obj}. Good luck, ${G.managerName}.`, 'good');
  addInbox(`Transfer window is open. Budget: ${fmtM(G.budget)}. Use it wisely.`, 'info');
  addInbox(`Your squad is ready. Check the SQUAD tab to review your players.`, 'info');

  showScreen('gameScreen');
  setupNavListeners();
  refreshHud();
  showTab('dashboard');
}

function addInbox(msg, type = 'info', sender = 'Board') {
  G.inbox.unshift({ msg, type, sender, week: G.week, season: G.season, read: false });
  G.inboxUnread++;
  if (G.inbox.length > 50) G.inbox.pop();
}

// Auto-select best XI from squad
function autoPickXI() {
  const cfg = FORMATIONS[G.tactics.formation] || FORMATIONS['4-4-2'];
  const roles = cfg.roles;

  // Sort by position priority + ovr
  const byPos = { GK:[], DEF:[], MID:[], FWD:[] };
  G.squad.forEach(p => {
    if (!p.injuryWeeks && !p.suspended) {
      (byPos[p.position] || byPos.MID).push(p);
    }
  });
  for (const arr of Object.values(byPos)) arr.sort((a,b) => b.ovr - a.ovr);

  const xi = [];
  const needed = { GK:0, DEF:0, MID:0, FWD:0 };
  roles.forEach(r => {
    if (r === 'GK') needed.GK++;
    else if (['CB','RB','LB','RWB','LWB'].includes(r)) needed.DEF++;
    else if (['CM','CDM','CAM','RAM','LAM','RM','LM'].includes(r)) needed.MID++;
    else needed.FWD++;
  });

  for (const [pos, count] of Object.entries(needed)) {
    const players = byPos[pos].slice(0, count);
    players.forEach(p => xi.push(p.id));
  }

  // Fill gaps from any position if needed
  if (xi.length < 11) {
    const allFit = G.squad.filter(p => !p.injuryWeeks && !p.suspended && !xi.includes(p.id))
                          .sort((a,b) => b.ovr - a.ovr);
    allFit.slice(0, 11 - xi.length).forEach(p => xi.push(p.id));
  }

  G.startingXI = xi.slice(0, 11);
  G.subs = G.squad.filter(p => !G.startingXI.includes(p.id)).slice(0, 7).map(p => p.id);
}

function getPlayerById(id) {
  return G.squad.find(p => p.id === id);
}

function getAverageOvr(playerIds) {
  const players = playerIds.map(id => getPlayerById(id)).filter(Boolean);
  if (!players.length) return 60;
  return players.reduce((s, p) => s + p.ovr, 0) / players.length;
}


// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const userTeam = getUserTeam();
  const leagueTable = getSortedTable(G.userLeague);
  const userPos = leagueTable.findIndex(t => t.club === G.userClub) + 1;
  const fixture  = getNextUserFixture();
  const recentResults = G.matchHistory.slice(-5).reverse();

  // Form string from match history
  const form5 = G.matchHistory.slice(-5).map(m => {
    const userHome = m.homeClub === G.userClub;
    const gs = userHome ? m.hg : m.ag;
    const gc = userHome ? m.ag : m.hg;
    return gs > gc ? 'W' : gs === gc ? 'D' : 'L';
  });

  const inboxHtml = G.inbox.slice(0, 8).map(msg => `
    <div class="inbox-item ${msg.type} ${msg.read ? '' : 'unread'}" onclick="markRead(${G.inbox.indexOf(msg)})">
      <div class="flex" style="justify-content:space-between;">
        <span class="text-xs text-dim">${msg.sender} &mdash; S${msg.season} W${msg.week}</span>
        ${!msg.read ? '<span class="text-xs text-accent">NEW</span>' : ''}
      </div>
      <div style="margin-top:3px;">${msg.msg}</div>
    </div>
  `).join('');

  const formBadges = form5.length
    ? form5.map(r => `<div class="form-badge ${r}">${r}</div>`).join('')
    : '<span class="text-dim text-xs">No matches yet</span>';

  const miniTableRows = leagueTable.slice(0, 8).map((t, i) => {
    const isUser = t.club === G.userClub;
    return `<tr${isUser ? ' class="user-row"' : ''}>
      <td class="league-pos">${i+1}</td>
      <td>${t.club}</td>
      <td>${t.p}</td>
      <td>${t.pts}</td>
    </tr>`;
  }).join('');

  // Win/draw/loss this season
  const seasonResults = G.matchHistory.filter(m => m.season === G.season);
  const wins   = seasonResults.filter(m => (m.homeClub===G.userClub ? m.hg>m.ag : m.ag>m.hg)).length;
  const draws  = seasonResults.filter(m => m.hg===m.ag).length;
  const losses = seasonResults.filter(m => (m.homeClub===G.userClub ? m.hg<m.ag : m.ag<m.hg)).length;
  const gf = seasonResults.reduce((s,m) => s + (m.homeClub===G.userClub ? m.hg : m.ag), 0);
  const ga = seasonResults.reduce((s,m) => s + (m.homeClub===G.userClub ? m.ag : m.hg), 0);

  const totalRounds = G.fixtures[G.userLeague]?.length || 38;
  const windowStatus = isTransferWindowOpen()
    ? '<span style="color:var(--success)">OPEN</span>'
    : '<span style="color:var(--danger)">CLOSED</span>';

  setHtml('tab-dashboard', `
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:10px;">

      <div style="display:flex;flex-direction:column;gap:10px;">
        <!-- Inbox -->
        <div class="panel">
          <h3>Inbox ${G.inboxUnread > 0 ? `<span style="color:var(--accent);font-size:11px;">(${G.inboxUnread} new)</span>` : ''}</h3>
          ${inboxHtml || '<p class="text-dim text-sm">No messages.</p>'}
        </div>

        <!-- Season stats -->
        <div class="panel">
          <h3>Season ${G.season} Stats</h3>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">
            <div class="card"><div style="font-size:1.4rem;color:var(--success)">${wins}</div><div class="text-xs text-dim">WINS</div></div>
            <div class="card"><div style="font-size:1.4rem;color:var(--draw)">${draws}</div><div class="text-xs text-dim">DRAWS</div></div>
            <div class="card"><div style="font-size:1.4rem;color:var(--danger)">${losses}</div><div class="text-xs text-dim">LOSSES</div></div>
            <div class="card"><div style="font-size:1.4rem;color:var(--accent2)">${gf}:${ga}</div><div class="text-xs text-dim">GOALS</div></div>
          </div>
        </div>

        <!-- Recent results -->
        ${recentResults.length ? `
        <div class="panel">
          <h3>Recent Results</h3>
          ${recentResults.map(m => {
            const userHome = m.homeClub === G.userClub;
            const opp = userHome ? m.awayClub : m.homeClub;
            const gs  = userHome ? m.hg : m.ag;
            const gc  = userHome ? m.ag : m.hg;
            const res = gs>gc?'W':gs===gc?'D':'L';
            return `<div class="fixture-row${userHome?' fixture-row-home':''}">
              <span class="fixture-home">${userHome?'<span class="text-accent">'+G.userClub+'</span>':opp}</span>
              <span class="fixture-score">${userHome?gs:gc} - ${userHome?gc:gs}</span>
              <span class="fixture-away">${userHome?opp:'<span class="text-accent">'+G.userClub+'</span>'}</span>
            </div>`;
          }).join('')}
        </div>` : ''}
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <!-- Next match -->
        <div class="panel">
          <h3>Next Match</h3>
          ${fixture ? `
            <div class="next-match-card">
              <div class="text-xs text-dim">WEEK ${G.week} &mdash; ${getLeagueConfig(G.userLeague)?.name || ''}</div>
              <div class="next-match-teams">
                ${fixture.home}<br>
                <span class="text-dim" style="font-size:0.8rem;">vs</span><br>
                ${fixture.away}
              </div>
              <div style="margin:10px 0;display:flex;gap:8px;flex-direction:column;">
                <button class="btn-primary full-width" onclick="RG.playMatch()">&#x25B6; PLAY MATCH</button>
                <button class="full-width" onclick="RG.simWeekAuto()">&#x23E9; SIM WEEK</button>
              </div>
            </div>
          ` : `
            <p class="text-dim text-sm" style="padding:10px 0;">
              ${G.week > totalRounds ? 'Season complete!' : 'No fixture this week.'}
            </p>
            ${G.week > totalRounds ? `<button class="btn-primary full-width" onclick="RG.endSeason()">END SEASON &amp; CONTINUE</button>` : `<button class="full-width" onclick="RG.simWeekAuto()">ADVANCE WEEK</button>`}
          `}
        </div>

        <!-- Board objective -->
        <div class="panel">
          <h3>Board Objective</h3>
          <div class="obj-desc">${G.boardObjective}</div>
          <div class="conf-label"><span>Board Confidence</span><span>${Math.round(G.boardConf)}%</span></div>
          <div class="conf-bar-wrap"><div class="conf-bar" style="width:${G.boardConf}%;background:var(--accent4)"></div></div>
          <div class="conf-label" style="margin-top:6px;"><span>Fan Confidence</span><span>${Math.round(G.fanConf)}%</span></div>
          <div class="conf-bar-wrap"><div class="conf-bar" style="width:${G.fanConf}%;background:var(--accent2)"></div></div>
          ${G.sackWarning ? '<div style="color:var(--danger);margin-top:8px;font-size:11px;">&#x26A0; BOARD WARNING: Results must improve!</div>' : ''}
        </div>

        <!-- League position -->
        <div class="panel">
          <h3>League Position</h3>
          <div style="font-size:2rem;color:var(--accent2);text-align:center;">#${userPos}</div>
          <div class="text-xs text-dim text-center">${getLeagueConfig(G.userLeague)?.name || ''} &mdash; Week ${G.week-1}/${totalRounds}</div>
          <div class="section-label" style="margin-top:8px;">Form</div>
          <div class="form-badges">${formBadges}</div>
        </div>

        <!-- Mini table -->
        <div class="panel">
          <h3>Top of Table</h3>
          <table class="data-table">
            <tr><th>#</th><th>Club</th><th>P</th><th>Pts</th></tr>
            ${miniTableRows}
          </table>
          <div style="margin-top:6px;">Transfer Window: ${windowStatus}</div>
        </div>
      </div>

    </div>
  `);

  // Mark all visible as read
  G.inbox.slice(0, 8).forEach(m => m.read = true);
  G.inboxUnread = G.inbox.filter(m => !m.read).length;
}

function markRead(idx) {
  if (G.inbox[idx]) G.inbox[idx].read = true;
  G.inboxUnread = G.inbox.filter(m => !m.read).length;
}


// ============================================================
// SQUAD SCREEN
// ============================================================
function ovrClass(ovr) {
  if (ovr >= 80) return 'ovr-elite';
  if (ovr >= 70) return 'ovr-high';
  if (ovr >= 60) return 'ovr-mid';
  return 'ovr-low';
}

function statBar(val, color) {
  return `<div class="stat-bar-cell">
    <span class="stat-mini">${val}</span>
    <div class="stat-bar-bg"><div class="stat-bar-fill" style="width:${val}%;background:${color}"></div></div>
  </div>`;
}

function renderSquad() {
  let players = [...G.squad];
  if (G.squadFilter !== 'ALL') {
    players = players.filter(p => p.position === G.squadFilter);
  }
  players.sort((a, b) => {
    const av = a[G.squadSort.key] ?? 0;
    const bv = b[G.squadSort.key] ?? 0;
    if (typeof av === 'string') return G.squadSort.dir * av.localeCompare(bv);
    return G.squadSort.dir * (bv - av);
  });

  const sortBtn = (key, label) => {
    const active = G.squadSort.key === key;
    return `<th class="sortable${active?' sort-active':''}" onclick="RG.sortSquad('${key}')">${label}${active?(G.squadSort.dir>0?'↑':'↓'):''}</th>`;
  };

  const rows = players.map(p => {
    const inXI = G.startingXI.includes(p.id);
    const injStr = p.injuryWeeks > 0 ? `<span style="color:var(--danger)" title="${p.injuryWeeks}w injured">🤕</span>` : '';
    const suspStr = p.suspended > 0 ? `<span style="color:var(--warning)" title="Suspended">🟨</span>` : '';
    const xiStr = inXI ? '<span style="color:var(--accent);font-size:9px;">XI</span>' : '';
    const listStr = p.transferListed ? '<span style="color:var(--danger);font-size:9px;">LIST</span>' : '';

    return `<tr>
      <td>${xiStr}${injStr}${suspStr}${listStr}</td>
      <td><span class="pos-badge ${p.position}">${p.position}</span></td>
      <td style="color:var(--text-bright)">${p.name}</td>
      <td>${p.age}</td>
      <td><span class="ovr-badge ${ovrClass(p.ovr)}">${p.ovr}</span></td>
      <td>${p.pot}</td>
      <td>${statBar(p.pac, '#60a5fa')}</td>
      <td>${statBar(p.sho, '#fb7185')}</td>
      <td>${statBar(p.pas, '#34d399')}</td>
      <td>${statBar(p.def, '#a78bfa')}</td>
      <td>${statBar(p.phy, '#fbbf24')}</td>
      <td>${p.position === 'GK' ? statBar(p.gkp, '#f5c518') : '<span class="text-dim">—</span>'}</td>
      <td>${Math.round(p.morale)}%</td>
      <td>${Math.round(p.fitness)}%</td>
      <td style="color:${p.form > 0 ? 'var(--success)' : p.form < 0 ? 'var(--danger)' : 'var(--text-dim)'}">${p.form > 0 ? '+' : ''}${p.form}</td>
      <td>${p.goals}</td>
      <td>${p.assists}</td>
      <td>${fmtM(p.value)}</td>
      <td>${fmtM(p.wage)}/w</td>
      <td>${p.contractYears}y</td>
      <td>
        <button class="btn-sm" onclick="RG.toggleXI(${p.id})" title="${inXI ? 'Remove from XI' : 'Add to XI'}">${inXI ? '−XI' : '+XI'}</button>
        <button class="btn-sm btn-danger" onclick="RG.listForSale(${p.id})" title="Transfer list">${p.transferListed ? 'UNLIST' : 'LIST'}</button>
      </td>
    </tr>`;
  }).join('');

  setHtml('tab-squad', `
    <div class="panel mb-8">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
        <h2>Squad &mdash; ${G.squad.length} Players</h2>
        <div class="squad-filters">
          ${['ALL','GK','DEF','MID','FWD'].map(pos =>
            `<button class="btn-sm filter-btn${G.squadFilter===pos?' active':''}" onclick="RG.filterSquad('${pos}')">${pos}</button>`
          ).join('')}
          <button class="btn-sm btn-primary" onclick="RG.autoPickXIBtn()">AUTO-PICK XI</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table" style="min-width:900px;">
          <thead><tr>
            <th></th>
            ${sortBtn('position','POS')}
            ${sortBtn('name','NAME')}
            ${sortBtn('age','AGE')}
            ${sortBtn('ovr','OVR')}
            ${sortBtn('pot','POT')}
            <th>PAC</th><th>SHO</th><th>PAS</th><th>DEF</th><th>PHY</th><th>GK</th>
            ${sortBtn('morale','MOR')}
            ${sortBtn('fitness','FIT')}
            ${sortBtn('form','FORM')}
            ${sortBtn('goals','GLS')}
            ${sortBtn('assists','AST')}
            ${sortBtn('value','VALUE')}
            ${sortBtn('wage','WAGE')}
            <th>CTR</th>
            <th>ACTIONS</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
    <div class="panel">
      <h3>Starting XI (${G.startingXI.length}/11) &mdash; Formation: ${G.tactics.formation}</h3>
      <p class="text-sm text-dim">Use +XI / −XI buttons to select your starting lineup. Go to TACTICS to set your formation.</p>
    </div>
  `);
}

function sortSquad(key) {
  if (G.squadSort.key === key) {
    G.squadSort.dir *= -1;
  } else {
    G.squadSort.key = key;
    G.squadSort.dir = key === 'name' ? 1 : -1;
  }
  renderSquad();
}

function filterSquad(pos) {
  G.squadFilter = pos;
  renderSquad();
}

function toggleXI(id) {
  const idx = G.startingXI.indexOf(id);
  if (idx !== -1) {
    G.startingXI.splice(idx, 1);
    const p = getPlayerById(id);
    if (p && !G.subs.includes(id)) G.subs.unshift(id);
  } else {
    if (G.startingXI.length >= 11) {
      toast('XI is full (11 players). Remove someone first.', 'warning');
      return;
    }
    const p = getPlayerById(id);
    if (p && p.injuryWeeks > 0) { toast(`${p.name} is injured!`, 'danger'); return; }
    G.startingXI.push(id);
    G.subs = G.subs.filter(s => s !== id);
  }
  renderSquad();
}

function autoPickXIBtn() {
  autoPickXI();
  renderSquad();
  toast('Auto-picked best available XI');
}

function listForSale(id) {
  const p = getPlayerById(id);
  if (!p) return;
  p.transferListed = !p.transferListed;
  toast(p.transferListed ? `${p.name} listed for transfer.` : `${p.name} removed from transfer list.`);
  renderSquad();
}


// ============================================================
// TACTICS SCREEN
// ============================================================
function renderTactics() {
  const t = G.tactics;
  const formationNames = Object.keys(FORMATIONS);
  const cfg = FORMATIONS[t.formation] || FORMATIONS['4-4-2'];

  // Build formation visual
  const pitchPlayers = cfg.roles.map((role, i) => {
    const pos = cfg.home[i];
    const pid = G.startingXI[i];
    const p = pid ? getPlayerById(pid) : null;
    // Pitch is rendered top-to-bottom (defender at bottom in this view)
    const x = pos[0] * 100;
    const y = pos[1] * 100;
    return `<div class="pitch-player" style="left:${x}%;top:${y}%;background:${G.userClubData?.kitH||'#1B3A8B'};" title="${p?p.name:role}">
      <span>${role}</span>
      <div class="pitch-player-name">${p ? p.last : '?'}</div>
    </div>`;
  }).join('');

  const styleOptions = ['Defensive','Balanced','Attacking'].map(s =>
    `<button class="btn-sm${t.style===s?' btn-primary':''}" onclick="RG.setTacticStyle('${s}')">${s}</button>`
  ).join('');

  const mentOptions = ['Cautious','Normal','Aggressive'].map(s =>
    `<button class="btn-sm${t.mentality===s?' btn-primary':''}" onclick="RG.setMentality('${s}')">${s}</button>`
  ).join('');

  const formOptions = formationNames.map(f =>
    `<button class="btn-sm form-opt${t.formation===f?' active':''}" onclick="RG.setFormation('${f}')">${f}</button>`
  ).join('');

  setHtml('tab-tactics', `
    <div class="tactics-grid">
      <!-- Pitch visualization -->
      <div>
        <div class="panel mb-8">
          <h3>Formation: ${t.formation}</h3>
          <div class="pitch-vis-wrap">
            <!-- Pitch markings -->
            <div style="position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 12.5%);pointer-events:none;"></div>
            <div style="position:absolute;left:50%;top:0;bottom:0;border-left:1px solid rgba(255,255,255,0.15);pointer-events:none;"></div>
            <div style="position:absolute;left:10%;right:10%;top:50%;height:1px;background:rgba(255,255,255,0.15);pointer-events:none;"></div>
            <div class="pitch-vis" id="pitchVis">
              ${pitchPlayers}
            </div>
          </div>
        </div>

        <!-- Player assignment -->
        <div class="panel">
          <h3>Starting XI Assignment</h3>
          <p class="text-sm text-dim mb-8">Go to SQUAD tab to add/remove players from the XI.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
            ${G.startingXI.map((id,i) => {
              const p = getPlayerById(id);
              const role = cfg.roles[i] || '?';
              return p ? `<div class="inset text-sm flex">
                <span class="pos-badge ${p.position}" style="margin-right:6px;">${role}</span>
                <span>${p.name}</span>
                <span class="text-dim" style="margin-left:auto;">${p.ovr}</span>
              </div>` : `<div class="inset text-dim text-sm">${role}: Empty</div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="tactics-controls">
        <div class="panel">
          <h3>Formation</h3>
          <div class="formation-grid">${formOptions}</div>
        </div>

        <div class="panel">
          <h3>Playing Style</h3>
          <div class="flex flex-wrap mb-8">${styleOptions}</div>
          <div class="text-xs text-dim">
            ${t.style==='Attacking' ? 'More goals, more risk. Attack at every opportunity.' :
              t.style==='Defensive' ? 'Sit back. Absorb pressure. Hit on the counter.' :
              'Balanced approach. Adapt to the game as it unfolds.'}
          </div>
        </div>

        <div class="panel">
          <h3>Mentality</h3>
          <div class="flex flex-wrap mb-8">${mentOptions}</div>
        </div>

        <div class="panel">
          <h3>Tactical Sliders</h3>
          <label>Pressing Intensity &mdash; <span class="text-accent2">${t.pressing}</span></label>
          <input type="range" min="0" max="100" value="${t.pressing}" oninput="RG.setSlider('pressing',this.value,this)" style="margin-bottom:10px;" />

          <label>Tempo &mdash; <span class="text-accent2">${t.tempo}</span></label>
          <input type="range" min="0" max="100" value="${t.tempo}" oninput="RG.setSlider('tempo',this.value,this)" style="margin-bottom:10px;" />

          <label>Width &mdash; <span class="text-accent2">${t.width}</span></label>
          <input type="range" min="0" max="100" value="${t.width}" oninput="RG.setSlider('width',this.value,this)" style="margin-bottom:10px;" />

          <label>Defensive Line &mdash; <span class="text-accent2">${t.defensiveLine}</span></label>
          <input type="range" min="0" max="100" value="${t.defensiveLine}" oninput="RG.setSlider('defensiveLine',this.value,this)" />
        </div>

        <div class="panel">
          <h3>Squad Avg OVR</h3>
          <div style="font-size:1.8rem;color:var(--accent2);text-align:center;">${Math.round(getAverageOvr(G.startingXI))}</div>
          <div class="text-xs text-dim text-center">Starting XI quality</div>
        </div>
      </div>
    </div>
  `);
}

function setFormation(f) {
  G.tactics.formation = f;
  autoPickXI();
  renderTactics();
  toast(`Formation set to ${f}`);
}

function setTacticStyle(s) {
  G.tactics.style = s;
  renderTactics();
}

function setMentality(m) {
  G.tactics.mentality = m;
  renderTactics();
}

function setSlider(key, val, inputEl) {
  G.tactics[key] = parseInt(val);
  // Update adjacent label
  const label = inputEl.previousElementSibling;
  if (label) {
    const span = label.querySelector('.text-accent2');
    if (span) span.textContent = val;
  }
}


// ============================================================
// SCOUTING / MARKET
// ============================================================
function generateMarket() {
  G.market = [];
  const count = 15 + rand(10);
  const positions = ['GK','DEF','DEF','MID','MID','MID','FWD','FWD'];

  for (let i = 0; i < count; i++) {
    const pos = pick(positions);
    const scoutBonus = G.stadium.scoutLevel * 3;
    // Scout level affects quality of players found
    const minStr = 50 + scoutBonus;
    const maxStr = 70 + scoutBonus;
    const fakeStr = randR(minStr, maxStr);
    const fakeClub = { strength: fakeStr, nats: Object.keys(NAMES) };
    const p = generatePlayer(fakeStr, pos, ['en','es','fr','br','de','it','ar','pt','af','nl'], false);
    p.clubName = 'Free Agent';
    p.onLoan = false;
    G.market.push(p);
  }

  // Add a few higher-quality players
  for (let i = 0; i < 5; i++) {
    const pos = pick(['GK','DEF','MID','FWD']);
    const str = randR(65 + G.stadium.scoutLevel * 5, 85 + G.stadium.scoutLevel * 3);
    const p = generatePlayer(str, pos, ['en','es','fr','br','de','it','ar'], true);
    p.clubName = pick(['Transfer Listed', 'Free Agent', 'Available']);
    G.market.push(p);
  }
}

let marketFilter = 'ALL';
let marketSort = { key: 'ovr', dir: -1 };
let budgetMax = 999;

function renderScouting() {
  let players = [...G.market];
  if (marketFilter !== 'ALL') players = players.filter(p => p.position === marketFilter);
  players.sort((a, b) => marketSort.dir * (b[marketSort.key] - a[marketSort.key]));

  const filterBtns = ['ALL','GK','DEF','MID','FWD'].map(f =>
    `<button class="btn-sm filter-btn${marketFilter===f?' active':''}" onclick="RG.setMarketFilter('${f}')">${f}</button>`
  ).join('');

  const rows = players.map((p, i) => `
    <tr>
      <td><span class="pos-badge ${p.position}">${p.position}</span></td>
      <td style="color:var(--text-bright)">${p.name}</td>
      <td>${p.age}</td>
      <td><span class="ovr-badge ${ovrClass(p.ovr)}">${p.ovr}</span></td>
      <td>${p.pot}</td>
      <td>${statBar(p.pac,'#60a5fa')}</td>
      <td>${statBar(p.sho,'#fb7185')}</td>
      <td>${statBar(p.pas,'#34d399')}</td>
      <td>${statBar(p.def,'#a78bfa')}</td>
      <td>${statBar(p.phy,'#fbbf24')}</td>
      <td style="color:var(--accent2)">${fmtM(p.value)}</td>
      <td>${fmtM(p.wage)}/w</td>
      <td>
        <button class="btn-sm btn-primary" onclick="RG.initiateTransfer(${i},'market')">BID</button>
      </td>
    </tr>
  `).join('');

  // Transfer-listed squad players
  const listed = G.squad.filter(p => p.transferListed).map((p, i) => `
    <div class="bid-row">
      <div>
        <span class="pos-badge ${p.position}">${p.position}</span>
        <strong>${p.name}</strong>
        <span class="text-dim text-xs">OVR ${p.ovr} &middot; ${fmtM(p.value)}</span>
      </div>
      <div>
        <button class="btn-sm btn-danger" onclick="RG.sellPlayer(${p.id})">SELL ${fmtM(p.value)}</button>
      </div>
    </div>
  `).join('');

  setHtml('tab-scouting', `
    <div class="scout-grid">
      <div>
        <div class="panel mb-8">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
            <h3>Transfer Market (${players.length} players)</h3>
            <div class="market-filters">
              ${filterBtns}
              <button class="btn-sm btn-warning" onclick="RG.refreshMarket()">&#x21BB; REFRESH SCOUTS</button>
            </div>
          </div>
          <p class="text-sm text-dim mb-8">Budget remaining: <strong style="color:var(--success)">${fmtM(G.budget)}</strong> &middot; Transfer window: ${isTransferWindowOpen() ? '<span style="color:var(--success)">OPEN</span>' : '<span style="color:var(--danger)">CLOSED (player bids only)</span>'}</p>
          <div style="overflow-x:auto;">
            <table class="data-table" style="min-width:800px;">
              <thead><tr>
                <th>POS</th><th>NAME</th><th>AGE</th><th>OVR</th><th>POT</th>
                <th>PAC</th><th>SHO</th><th>PAS</th><th>DEF</th><th>PHY</th>
                <th>VALUE</th><th>WAGE</th><th>ACTION</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <div class="panel mb-8">
          <h3>Your Transfer Listed Players</h3>
          ${listed || '<p class="text-dim text-sm">No players listed. Go to SQUAD and use the LIST button.</p>'}
        </div>

        <div class="panel">
          <h3>Scouting Network</h3>
          <div class="preview-stat"><span>Scout Level</span><span style="color:var(--accent2)">${G.stadium.scoutLevel}/5</span></div>
          <div class="text-xs text-dim mt-8">Higher scout level = better market players. Upgrade in STADIUM tab.</div>
        </div>

        <div class="panel mt-8">
          <h3>Incoming Bids</h3>
          ${G.incomingBids.length ? G.incomingBids.map((bid, i) => `
            <div class="bid-row">
              <div class="text-sm">
                <strong>${bid.buyerClub}</strong> bid <strong style="color:var(--accent2)">${fmtM(bid.fee)}</strong> for <strong>${bid.player.name}</strong>
              </div>
              <div style="display:flex;gap:4px;">
                <button class="btn-sm btn-primary" onclick="RG.acceptBid(${i})">ACCEPT</button>
                <button class="btn-sm btn-danger" onclick="RG.rejectBid(${i})">REJECT</button>
              </div>
            </div>
          `).join('') : '<p class="text-dim text-sm">No incoming offers.</p>'}
        </div>
      </div>
    </div>
  `);
}

function setMarketFilter(f) { marketFilter = f; renderScouting(); }

function refreshMarket() {
  if (G.budget < 0.5) { toast('Not enough budget to send scouts.', 'warning'); return; }
  generateMarket();
  toast('Scouts refreshed! New players found.');
  renderScouting();
}

function initiateTransfer(idx, source) {
  const p = source === 'market' ? G.market[idx] : null;
  if (!p) return;

  if (!isTransferWindowOpen()) {
    toast('Transfer window is closed!', 'danger');
    return;
  }

  const fee = p.value;
  const wage = p.wage;

  if (G.budget < fee) {
    toast(`Not enough budget! Need ${fmtM(fee)}, have ${fmtM(G.budget)}.`, 'danger');
    return;
  }

  // Simple direct purchase (could expand to negotiations)
  const totalWages = G.wages + wage;
  if (totalWages > G.wages * 1.6) {
    toast('Wage budget too tight! Sell players first.', 'warning');
    return;
  }

  if (confirm(`Sign ${p.name} for ${fmtM(fee)} + ${fmtM(wage)}/w wages?`)) {
    G.budget -= fee;
    G.wages += wage;
    G.wages = Math.round(G.wages * 100) / 100;
    G.squad.push({ ...p, goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0 });
    G.market.splice(idx, 1);
    addInbox(`Signed ${p.name} (${p.position}, OVR ${p.ovr}) for ${fmtM(fee)}.`, 'good', 'Transfer Office');
    toast(`${p.name} signed for ${fmtM(fee)}!`);
    refreshHud();
    renderScouting();
  }
}

function sellPlayer(id) {
  const p = getPlayerById(id);
  if (!p) return;
  if (G.startingXI.includes(id)) {
    toast('Remove player from starting XI first.', 'warning');
    return;
  }
  const fee = p.value;
  G.budget += fee;
  G.budget = Math.round(G.budget * 100) / 100;
  G.wages = Math.max(0, Math.round((G.wages - p.wage) * 100) / 100);
  G.squad = G.squad.filter(s => s.id !== id);
  G.startingXI = G.startingXI.filter(s => s !== id);
  G.subs = G.subs.filter(s => s !== id);
  addInbox(`Sold ${p.name} for ${fmtM(fee)}.`, 'good', 'Transfer Office');
  toast(`${p.name} sold for ${fmtM(fee)}.`);
  refreshHud();
}

function acceptBid(idx) {
  const bid = G.incomingBids[idx];
  if (!bid) return;
  sellPlayer(bid.player.id);
  G.incomingBids.splice(idx, 1);
  renderScouting();
}

function rejectBid(idx) {
  const bid = G.incomingBids[idx];
  if (!bid) return;
  toast(`Rejected ${fmtM(bid.fee)} bid from ${bid.buyerClub}.`);
  G.incomingBids.splice(idx, 1);
  renderScouting();
}

function isTransferWindowOpen() {
  // Window open: weeks 1-4 (summer) and week 20-23 (winter)
  const w = G.week;
  return w <= 4 || (w >= 20 && w <= 23);
}


// ============================================================
// FINANCES SCREEN
// ============================================================
function renderFinances() {
  const matchRevPerWeek = (G.stadium.capacity * 0.000015) * (G.fanConf / 100) * 0.85;
  const totalIncome = G.sponsorIncome + matchRevPerWeek;
  const maintenance = 0.08 * G.stadium.upgradeLevel + 0.1;
  const totalExpenses = G.wages + maintenance;
  const weeklyBalance = totalIncome - totalExpenses;

  const seasonRevEstimate = totalIncome * 38;
  const seasonExpEstimate = totalExpenses * 38;

  setHtml('tab-finances', `
    <div class="finance-grid">
      <div>
        <div class="panel mb-8">
          <h2>Weekly Cash Flow</h2>
          <div class="finance-row">
            <span>Sponsorship Income</span>
            <span class="finance-income">+${fmtM(G.sponsorIncome)}</span>
          </div>
          <div class="finance-row">
            <span>Matchday Revenue</span>
            <span class="finance-income">+${fmtM(matchRevPerWeek)}</span>
          </div>
          <div class="finance-row">
            <span>Wage Bill</span>
            <span class="finance-expense">-${fmtM(G.wages)}</span>
          </div>
          <div class="finance-row">
            <span>Facility Maintenance</span>
            <span class="finance-expense">-${fmtM(maintenance)}</span>
          </div>
          <div class="finance-row" style="border-top:2px solid var(--border);margin-top:4px;padding-top:8px;">
            <span><strong>Weekly Balance</strong></span>
            <span class="finance-balance" style="color:${weeklyBalance>=0?'var(--success)':'var(--danger)'}">${weeklyBalance>=0?'+':''}${fmtM(weeklyBalance)}</span>
          </div>
        </div>

        <div class="panel">
          <h2>Season Estimates</h2>
          <div class="finance-row">
            <span>Total Revenue (est.)</span>
            <span class="finance-income">+${fmtM(seasonRevEstimate)}</span>
          </div>
          <div class="finance-row">
            <span>Total Expenses (est.)</span>
            <span class="finance-expense">-${fmtM(seasonExpEstimate)}</span>
          </div>
          <div class="finance-row" style="border-top:2px solid var(--border);margin-top:4px;padding-top:8px;">
            <span><strong>Net Profit (est.)</strong></span>
            <span class="finance-balance" style="color:${seasonRevEstimate-seasonExpEstimate>=0?'var(--success)':'var(--danger)'}">${fmtM(seasonRevEstimate-seasonExpEstimate)}</span>
          </div>
        </div>
      </div>

      <div>
        <div class="panel mb-8">
          <h2>Current Position</h2>
          <div style="text-align:center;padding:16px 0;">
            <div style="font-size:0.8rem;color:var(--text-dim);">TRANSFER BUDGET</div>
            <div style="font-size:2.2rem;color:var(--accent2);">${fmtM(G.budget)}</div>
          </div>
          <div class="finance-row">
            <span>Stadium Value</span>
            <span class="text-accent2">${fmtM(G.stadium.capacity * 0.0002)}</span>
          </div>
          <div class="finance-row">
            <span>Squad Value</span>
            <span class="text-accent2">${fmtM(G.squad.reduce((s,p) => s+p.value, 0))}</span>
          </div>
        </div>

        <div class="panel">
          <h2>Prize Money</h2>
          <p class="text-sm text-dim mb-8">End-of-season prize money based on final position:</p>
          ${[
            ['1st Place', getLeagueConfig(G.userLeague)?.prize1],
            ['Top 4',     getLeagueConfig(G.userLeague)?.prize4],
            ['Top 10',    getLeagueConfig(G.userLeague)?.prize10],
            ['Bottom',    getLeagueConfig(G.userLeague)?.prize20],
          ].map(([label, val]) => `
            <div class="finance-row">
              <span>${label}</span>
              <span class="finance-income">${fmtM(val || 0)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `);
}

// ============================================================
// STADIUM SCREEN
// ============================================================
function renderStadium() {
  const s = G.stadium;
  const cd = G.userClubData;

  function upgradeCard(name, level, maxLevel, cost, desc, action) {
    const pips = Array.from({length: maxLevel}, (_,i) =>
      `<div class="infra-pip${i < level ? ' filled' : ''}"></div>`
    ).join('');
    return `
      <div class="card upgrade-card" onclick="RG.${action}()">
        <h4>${name}</h4>
        <div class="infra-level-bar">${pips}</div>
        <div class="text-sm text-dim mt-8">${desc}</div>
        ${level < maxLevel
          ? `<div class="upgrade-cost">Upgrade: ${fmtM(cost)}</div>`
          : `<div class="upgrade-cost text-success">MAX LEVEL</div>`}
      </div>
    `;
  }

  const expandCost = Math.round(s.upgradeLevel * 10 + 10);
  const trainCost  = s.trainingLevel * 5 + 3;
  const youthCost  = s.youthLevel * 4 + 2;
  const scoutCost  = s.scoutLevel * 3 + 2;
  const medCost    = s.medicalLevel * 3 + 2;

  setHtml('tab-stadium', `
    <div class="stadium-grid">
      <div>
        <div class="panel mb-8">
          <h2>${s.name}</h2>
          <div class="preview-stat"><span>Capacity</span><span style="color:var(--accent2)">${s.capacity.toLocaleString()}</span></div>
          <div class="preview-stat"><span>Expansion Level</span><span>${s.upgradeLevel}/5</span></div>
          <div class="preview-stat"><span>Condition</span><span style="color:${s.condition>70?'var(--success)':s.condition>50?'var(--warning)':'var(--danger)'}">${Math.round(s.condition)}%</span></div>
          <div class="preview-stat"><span>Avg Attendance</span><span>${Math.round(s.capacity * (G.fanConf / 100) * 0.92).toLocaleString()}</span></div>
          <div class="preview-stat"><span>Matchday Revenue</span><span class="finance-income">${fmtM((s.capacity * 0.000015) * (G.fanConf / 100) * 0.85)}/w</span></div>
        </div>

        <div class="panel">
          <h3>Expand Stadium</h3>
          ${s.upgradeLevel < 5 ? `
            <p class="text-sm text-dim mb-8">Add a new stand. +8,000 seats per expansion. Increases matchday revenue and fan confidence.</p>
            <p class="text-sm mb-8">Cost: <strong class="text-accent2">${fmtM(expandCost)}</strong></p>
            <button class="btn-primary full-width" onclick="RG.expandStadium()">EXPAND (+8,000 seats)</button>
          ` : `<p class="text-success text-sm">Stadium is at maximum capacity.</p>`}
          <div style="margin-top:10px;">
            ${s.condition < 90 ? `
              <button class="full-width" onclick="RG.refurbishStadium()">REFURBISH (${fmtM(2)})</button>
            ` : ''}
          </div>
        </div>
      </div>

      <div>
        <h3 style="margin-bottom:8px;color:var(--text-dim);">INFRASTRUCTURE</h3>
        <div class="stadium-grid">
          ${upgradeCard('Training Ground', s.trainingLevel, 5, trainCost,
            'Better training = faster player development and fitness recovery.',
            'upgradeTraining')}
          ${upgradeCard('Youth Academy', s.youthLevel, 5, youthCost,
            'Better youth = stronger prospects emerging each season.',
            'upgradeYouth')}
          ${upgradeCard('Scouting Network', s.scoutLevel, 5, scoutCost,
            'Better scouting = higher quality players on the market.',
            'upgradeScout')}
          ${upgradeCard('Medical Centre', s.medicalLevel, 5, medCost,
            'Better medical = faster injury recovery for your players.',
            'upgradeMedical')}
        </div>
      </div>
    </div>
  `);
}

function expandStadium() {
  const s = G.stadium;
  if (s.upgradeLevel >= 5) { toast('Stadium at max capacity!', 'warning'); return; }
  const cost = s.upgradeLevel * 10 + 10;
  if (G.budget < cost) { toast(`Need ${fmtM(cost)} to expand. Budget: ${fmtM(G.budget)}.`, 'danger'); return; }
  G.budget -= cost;
  s.upgradeLevel++;
  s.capacity += 8000;
  G.fanConf = clamp(G.fanConf + 3, 0, 100);
  G.sponsorIncome = Math.round(s.capacity * 0.000012 * 10) / 10;
  addInbox(`Stadium expanded! New capacity: ${s.capacity.toLocaleString()}.`, 'good', 'Club');
  toast(`Stadium expanded! Now holds ${s.capacity.toLocaleString()}.`);
  refreshHud();
  renderStadium();
}

function refurbishStadium() {
  if (G.budget < 2) { toast('Not enough budget.', 'danger'); return; }
  G.budget -= 2;
  G.stadium.condition = clamp(G.stadium.condition + 15, 0, 100);
  toast('Stadium refurbished. Condition improved.');
  refreshHud();
  renderStadium();
}

function upgradeInfra(key, costFn, label) {
  const s = G.stadium;
  if (s[key] >= 5) { toast(`${label} is already at max level!`, 'warning'); return; }
  const cost = costFn(s[key]);
  if (G.budget < cost) { toast(`Need ${fmtM(cost)} to upgrade. Budget: ${fmtM(G.budget)}.`, 'danger'); return; }
  G.budget -= cost;
  s[key]++;
  addInbox(`${label} upgraded to level ${s[key]}.`, 'good', 'Club');
  toast(`${label} upgraded to level ${s[key]}!`);
  refreshHud();
  renderStadium();
}

function upgradeTraining() { upgradeInfra('trainingLevel', l => l * 5 + 3, 'Training Ground'); }
function upgradeYouth()    { upgradeInfra('youthLevel',    l => l * 4 + 2, 'Youth Academy'); }
function upgradeScout()    { upgradeInfra('scoutLevel',    l => l * 3 + 2, 'Scouting Network'); }
function upgradeMedical()  { upgradeInfra('medicalLevel',  l => l * 3 + 2, 'Medical Centre'); }


// ============================================================
// LEAGUE TABLE
// ============================================================
function getSortedTable(leagueId) {
  const teams = [...(G.leagues[leagueId] || [])];
  return teams.sort((a, b) => {
    if (b.pts !== a.pts) return b.pts - a.pts;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
}

let leagueViewId = null;

function renderLeague() {
  if (!leagueViewId) leagueViewId = G.userLeague;
  const leagueTabs = LEAGUE_CONFIG
    .filter(cfg => G.leagues[cfg.id])
    .map(cfg => `<button class="btn-sm filter-btn${leagueViewId===cfg.id?' active':''}"
      onclick="RG.setLeagueView('${cfg.id}')">${cfg.name}</button>`
    ).join('');

  const sorted = getSortedTable(leagueViewId);
  const cfg = getLeagueConfig(leagueViewId);
  const totalRounds = G.fixtures[leagueViewId]?.length || 38;

  const rows = sorted.map((t, i) => {
    const pos = i + 1;
    const isUser = t.club === G.userClub && leagueViewId === G.userLeague;
    let zoneClass = '';
    if (cfg) {
      if (cfg.promSpots > 0 && pos <= cfg.promSpots) zoneClass = 'promo-zone';
      else if (pos <= 4 && cfg.tier === 1) zoneClass = 'euro-zone';
      else if (pos > sorted.length - (cfg.relSpots || 3)) zoneClass = 'rel-zone';
    }
    const formDots = (t.form || []).slice(-5).map(r =>
      `<div class="form-dot ${r}"></div>`
    ).join('');

    return `<tr class="${zoneClass}${isUser?' user-row':''}">
      <td class="league-pos">${pos}</td>
      <td style="color:${isUser?'var(--accent2)':'var(--text-bright)'}">${t.club}</td>
      <td>${t.p}</td>
      <td>${t.w}</td>
      <td>${t.d}</td>
      <td>${t.l}</td>
      <td>${t.gf}</td>
      <td>${t.ga}</td>
      <td style="color:${t.gd>=0?'var(--success)':'var(--danger)'}">${t.gd>0?'+':''}${t.gd}</td>
      <td><strong>${t.pts}</strong></td>
      <td><div class="form-str">${formDots}</div></td>
    </tr>`;
  }).join('');

  setHtml('tab-league', `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <h2>League Table</h2>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">${leagueTabs}</div>
      </div>
      <div style="font-size:10px;color:var(--text-dim);margin-bottom:8px;">
        <span style="border-left:3px solid var(--success);padding-left:6px;margin-right:10px;">Promotion</span>
        <span style="border-left:3px solid var(--accent4);padding-left:6px;margin-right:10px;">European</span>
        <span style="border-left:3px solid var(--danger);padding-left:6px;">Relegation</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead><tr>
            <th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th>
            <th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th>Form</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--text-dim);">Week ${G.week-1} of ${totalRounds}</div>
    </div>

    <!-- Top Scorers -->
    <div class="panel" style="margin-top:10px;">
      <h3>Season Top Scorers</h3>
      ${renderTopScorers()}
    </div>
  `);
}

function renderTopScorers() {
  // Collect all players from all teams in user's league
  const scorers = [];
  for (const team of getLeagueTeams(G.userLeague)) {
    for (const p of team.squad) {
      if (p.goals > 0) scorers.push({ ...p, club: team.club });
    }
  }
  // Also user squad
  for (const p of G.squad) {
    if (p.goals > 0 && !scorers.find(s => s.id === p.id)) {
      scorers.push({ ...p, club: G.userClub });
    }
  }
  scorers.sort((a, b) => b.goals - a.goals);

  if (!scorers.length) return '<p class="text-dim text-sm">No goals scored yet.</p>';

  return `<table class="data-table">
    <tr><th>#</th><th>Player</th><th>Club</th><th>Goals</th><th>Assists</th></tr>
    ${scorers.slice(0, 10).map((p, i) => `
      <tr${p.club===G.userClub?' class="user-row"':''}>
        <td>${i+1}</td>
        <td>${p.name}</td>
        <td>${p.club}</td>
        <td style="color:var(--success)">${p.goals}</td>
        <td>${p.assists}</td>
      </tr>
    `).join('')}
  </table>`;
}

function setLeagueView(id) { leagueViewId = id; renderLeague(); }

// ============================================================
// FIXTURES SCREEN
// ============================================================
function renderFixtures() {
  const rounds = G.fixtures[G.userLeague] || [];
  const currentWeek = G.week;

  // Show from week max(1, current-3) to end
  const startWeek = Math.max(0, currentWeek - 4);
  const displayRounds = rounds.slice(startWeek, startWeek + 15);

  const html = displayRounds.map((round, ri) => {
    const weekNum = startWeek + ri + 1;
    const userMatch = round.find(m => m.home === G.userClub || m.away === G.userClub);
    return `
      <div class="fixture-round">
        <div class="fixture-round-hdr">Week ${weekNum}${weekNum === currentWeek ? ' <span style="color:var(--accent)">← NOW</span>' : ''}</div>
        ${round.map(m => {
          const isUser = m.home === G.userClub || m.away === G.userClub;
          const scoreStr = m.played
            ? `<span class="fixture-score">${m.hg} - ${m.ag}</span>`
            : `<span class="fixture-score upcoming">vs</span>`;
          return `<div class="fixture-row${isUser?' user-match':''}">
            <span class="fixture-home${m.home===G.userClub?' text-accent':''}">${m.home}</span>
            ${scoreStr}
            <span class="fixture-away${m.away===G.userClub?' text-accent':''}">${m.away}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }).join('');

  setHtml('tab-fixtures', `
    <div class="panel">
      <h2>Fixtures &amp; Results</h2>
      <p class="text-sm text-dim mb-8">Showing weeks ${startWeek+1} to ${Math.min(startWeek+15, rounds.length)}. Total: ${rounds.length} rounds.</p>
      ${html || '<p class="text-dim">No fixtures found.</p>'}
    </div>
  `);
}


// ============================================================
// MATCH ENGINE — Core Simulation
// ============================================================

// Team power calculation
function calcTeamPower(teamName, isUser, tactics) {
  let players, avgOvr, homeAdv = 0;

  if (isUser) {
    const startIds = G.startingXI.length >= 11 ? G.startingXI : G.squad.slice(0, 11).map(p => p.id);
    const startPlayers = startIds.map(id => getPlayerById(id)).filter(Boolean);
    avgOvr = startPlayers.length ? startPlayers.reduce((s,p) => s + p.ovr, 0) / startPlayers.length : 65;

    // Morale & fitness bonuses
    const moraleBonus = startPlayers.reduce((s,p) => s + (p.morale - 60) / 100, 0) / startPlayers.length;
    const fitnessBonus = startPlayers.reduce((s,p) => s + (p.fitness - 75) / 200, 0) / startPlayers.length;
    avgOvr += moraleBonus * 5 + fitnessBonus * 3;

    // Tactics modifier
    const t = tactics || G.tactics;
    if (t.style === 'Attacking') avgOvr += 3;
    if (t.style === 'Defensive') avgOvr -= 2;
    if (t.mentality === 'Aggressive') avgOvr += 2;
    if (t.mentality === 'Cautious') avgOvr -= 1;
  } else {
    const team = findTeamByName(teamName);
    avgOvr = team ? (team.squad.reduce((s,p) => s + p.ovr, 0) / team.squad.length) * 0.95 + team.strength * 0.05 : 65;
  }

  return Math.max(40, Math.round(avgOvr));
}

// Pre-generate match events for the full 90 minutes
function generateMatchEvents(homeTeam, awayTeam, homePow, awayPow, isUserMatch) {
  const events = [];
  const totalPow = homePow + awayPow;
  const homeShare = homePow / totalPow;

  // Home advantage factor
  const homeAdv = isUserMatch ? 0.04 : 0.03;

  // Total chances based on tempo
  const tempoFactor = isUserMatch ? (G.tactics.tempo / 50) : 1.0;
  const totalShots = Math.round(randR(14, 24) * tempoFactor);
  const homeShots = Math.round(totalShots * (homeShare + homeAdv));
  const awayShots = totalShots - homeShots;

  // Generate shot events
  function genShots(team, count, isHome) {
    for (let i = 0; i < count; i++) {
      const minute = randR(1, 90);
      const qual = Math.random(); // shot quality
      const teamPlayers = isHome ? getStartingXIPlayers(homeTeam, isUserMatch && isHome)
                                 : getStartingXIPlayers(awayTeam, isUserMatch && !isHome);

      // Scorer: weighted toward FWDs and MIDs with high shooting
      const candidates = teamPlayers.filter(p => p.position !== 'GK');
      const weights = candidates.map(p => {
        const w = p.sho / 99;
        if (p.position === 'FWD') return w * 2.5;
        if (p.position === 'MID') return w * 1.2;
        return w * 0.4;
      });
      const scorer = weightedPick(candidates, weights) || candidates[0];

      // Assist: another player
      const assistPool = candidates.filter(p => scorer && p.id !== scorer.id);
      const assister = assistPool.length ? pick(assistPool) : null;

      if (qual < 0.28) {
        // GOAL
        events.push({ type: 'goal', minute, team: isHome ? 'home' : 'away', scorer, assister });
      } else if (qual < 0.55) {
        // SHOT SAVED
        events.push({ type: 'saved', minute, team: isHome ? 'home' : 'away', scorer });
      } else {
        // SHOT MISSED
        events.push({ type: 'missed', minute, team: isHome ? 'home' : 'away', scorer });
      }
    }
  }

  genShots(homeTeam, homeShots, true);
  genShots(awayTeam, awayShots, false);

  // Corners (random)
  for (let i = 0; i < randR(4, 12); i++) {
    events.push({ type: 'corner', minute: randR(1,90), team: Math.random() < homeShare ? 'home' : 'away' });
  }

  // Fouls (random)
  for (let i = 0; i < randR(8, 18); i++) {
    events.push({ type: 'foul', minute: randR(1,90), team: Math.random() < 0.5 ? 'home' : 'away' });
  }

  // Yellow cards
  const yellowCount = randR(1, 5);
  for (let i = 0; i < yellowCount; i++) {
    const isHome = Math.random() < 0.5;
    const teamPlayers = isHome ? getStartingXIPlayers(homeTeam, isUserMatch && isHome)
                               : getStartingXIPlayers(awayTeam, isUserMatch && !isHome);
    const p = pick(teamPlayers.filter(p => p.position !== 'GK') || teamPlayers);
    if (p) events.push({ type: 'yellow', minute: randR(10,88), team: isHome?'home':'away', player: p });
  }

  // Red card (rare, ~10% chance)
  if (Math.random() < 0.08) {
    const isHome = Math.random() < 0.5;
    const teamPlayers = isHome ? getStartingXIPlayers(homeTeam, isUserMatch && isHome)
                               : getStartingXIPlayers(awayTeam, isUserMatch && !isHome);
    const p = pick(teamPlayers.filter(p => p.position !== 'GK') || teamPlayers);
    if (p) events.push({ type: 'red', minute: randR(20,88), team: isHome?'home':'away', player: p });
  }

  // Injury (5% chance per side)
  if (Math.random() < 0.07) {
    const isHome = Math.random() < 0.5;
    const teamPlayers = isHome ? getStartingXIPlayers(homeTeam, isUserMatch && isHome)
                               : getStartingXIPlayers(awayTeam, isUserMatch && !isHome);
    const p = pick(teamPlayers);
    if (p) events.push({ type: 'injury', minute: randR(15,85), team: isHome?'home':'away', player: p });
  }

  // Half time marker
  events.push({ type: 'halftime', minute: 45 });

  // Sort by minute
  events.sort((a, b) => a.minute - b.minute || (a.type === 'halftime' ? -1 : 1));

  return events;
}

function getStartingXIPlayers(teamName, isUserTeam) {
  if (isUserTeam) {
    const ids = G.startingXI.length >= 11 ? G.startingXI : G.squad.slice(0,11).map(p=>p.id);
    return ids.map(id => getPlayerById(id)).filter(Boolean);
  }
  const team = findTeamByName(teamName);
  if (!team) return [];
  return team.squad.slice(0, 11);
}

function weightedPick(arr, weights) {
  if (!arr || !arr.length) return null;
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}


// ============================================================
// MATCH CANVAS RENDERER
// ============================================================

const PITCH_COLOR = '#1e5c27';
const PITCH_LINE  = 'rgba(255,255,255,0.5)';
const BALL_COLOR  = '#f8f0b0';

let matchBall = { x: 360, y: 170, vx: 2, vy: 1.5, targetX: 360, targetY: 170 };

function getFormationPositions(formation, isHome, canvasW, canvasH) {
  const cfg = FORMATIONS[formation] || FORMATIONS['4-4-2'];
  const pad = 15;
  return cfg.home.map(([rx, ry]) => {
    const x = isHome
      ? pad + rx * (canvasW / 2 - pad)
      : canvasW - pad - rx * (canvasW / 2 - pad);
    const y = pad + ry * (canvasH - pad * 2);
    return { x, y };
  });
}

function drawPitch(ctx, W, H) {
  // Grass
  ctx.fillStyle = PITCH_COLOR;
  ctx.fillRect(0, 0, W, H);

  // Grass stripes
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.07)';
      ctx.fillRect(i * (W/8), 0, W/8, H);
    }
  }

  ctx.strokeStyle = PITCH_LINE;
  ctx.lineWidth = 1.5;

  // Outer boundary
  ctx.strokeRect(12, 8, W-24, H-16);

  // Centre line
  ctx.beginPath(); ctx.moveTo(W/2, 8); ctx.lineTo(W/2, H-8); ctx.stroke();

  // Centre circle
  ctx.beginPath(); ctx.arc(W/2, H/2, 42, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = PITCH_LINE; ctx.beginPath(); ctx.arc(W/2, H/2, 3, 0, Math.PI*2); ctx.fill();

  // Penalty areas
  const paW = 140, paH = 52;
  ctx.strokeRect(12, (H-paH)/2, paW, paH);                    // left PA
  ctx.strokeRect(W-12-paW, (H-paH)/2, paW, paH);              // right PA

  // Goal areas
  const gaW = 46, gaH = 30;
  ctx.strokeRect(12, (H-gaH)/2, gaW, gaH);                    // left GA
  ctx.strokeRect(W-12-gaW, (H-gaH)/2, gaW, gaH);              // right GA

  // Goals
  ctx.fillStyle = '#fff';
  ctx.fillRect(4, (H-32)/2, 8, 32);                           // left goal
  ctx.fillRect(W-12, (H-32)/2, 8, 32);                        // right goal
  ctx.strokeRect(4, (H-32)/2, 8, 32);
  ctx.strokeRect(W-12, (H-32)/2, 8, 32);

  // Penalty spots
  ctx.fillStyle = PITCH_LINE;
  ctx.beginPath(); ctx.arc(12+82, H/2, 2.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(W-12-82, H/2, 2.5, 0, Math.PI*2); ctx.fill();
}

function drawPlayers(ctx, homePosArr, awayPosArr, homeColor, awayColor, homeTextColor, awayTextColor, activeTeam, activeMins) {
  // Draw away players first (behind home)
  awayPosArr.forEach((pos, i) => {
    const pulse = activeTeam === 'away' && activeMins > 0 ? Math.sin(Date.now()/150) * 0.08 : 0;
    drawPlayerDot(ctx, pos.x, pos.y, awayColor, awayTextColor, i+1, pulse);
  });
  homePosArr.forEach((pos, i) => {
    const pulse = activeTeam === 'home' && activeMins > 0 ? Math.sin(Date.now()/150) * 0.08 : 0;
    drawPlayerDot(ctx, pos.x, pos.y, homeColor, homeTextColor, i+1, pulse);
  });
}

function drawPlayerDot(ctx, x, y, fillColor, textColor, num, pulse) {
  const r = 11 + pulse;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2);
  ctx.fillStyle = fillColor; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.font = `bold 8px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), x, y);
}

function drawBall(ctx, bx, by) {
  ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI*2);
  ctx.fillStyle = BALL_COLOR; ctx.fill();
  ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1; ctx.stroke();
  // Shadow
  ctx.beginPath(); ctx.arc(bx+2, by+2, 5, 0, Math.PI*2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fill();
}

function animateBallToward(target, W, H) {
  const dx = target.x - matchBall.x;
  const dy = target.y - matchBall.y;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (dist < 2) {
    matchBall.x = target.x;
    matchBall.y = target.y;
    matchBall.vx = (Math.random()-0.5) * 2;
    matchBall.vy = (Math.random()-0.5) * 2;
  } else {
    const speed = Math.min(dist * 0.12, 18);
    matchBall.vx = (dx/dist) * speed + (Math.random()-0.5);
    matchBall.vy = (dy/dist) * speed + (Math.random()-0.5);
  }
  matchBall.x = clamp(matchBall.x + matchBall.vx, 15, W-15);
  matchBall.y = clamp(matchBall.y + matchBall.vy, 10, H-10);
  if (matchBall.x <= 15 || matchBall.x >= W-15) matchBall.vx *= -0.7;
  if (matchBall.y <= 10 || matchBall.y >= H-10) matchBall.vy *= -0.7;
}

function renderMatchCanvas(state) {
  const canvas = el('matchCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  drawPitch(ctx, W, H);

  const cd = G.userClubData;
  const homeColor = state.homeIsUser ? (cd?.kitH || '#1B3A8B') : state.awayKitH || '#C8102E';
  const awayColor = state.homeIsUser ? state.awayKitH || '#C8102E' : (cd?.kitH || '#1B3A8B');
  const homeText  = contrastColor(homeColor);
  const awayText  = contrastColor(awayColor);

  const homePos = getFormationPositions(G.tactics.formation, true, W, H);
  const awayPos = getFormationPositions('4-4-2', false, W, H);

  // Move ball toward action zone
  const target = state.ballTarget || { x: W/2, y: H/2 };
  animateBallToward(target, W, H);

  drawPlayers(ctx, homePos, awayPos, homeColor, awayColor, homeText, awayText, state.activeTeam, 1);
  drawBall(ctx, matchBall.x, matchBall.y);

  // Score overlay at top
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(W/2-60, 0, 120, 22);
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.hg} - ${state.ag}`, W/2, 14);
}


// ============================================================
// MATCH DIALOG — Playable match experience
// ============================================================

let matchTimer = null;
let matchState = null;

function getNextUserFixture() {
  const rounds = G.fixtures[G.userLeague];
  if (!rounds) return null;
  const roundIdx = G.week - 1;
  if (roundIdx < 0 || roundIdx >= rounds.length) return null;
  const round = rounds[roundIdx];
  return round ? round.find(m => (m.home === G.userClub || m.away === G.userClub) && !m.played) : null;
}

function playMatch() {
  const fx = getNextUserFixture();
  if (!fx) { toast('No fixture this week!', 'warning'); return; }
  if (G.startingXI.length < 11) {
    if (!confirm('Your XI has fewer than 11 players. Auto-pick and continue?')) return;
    autoPickXI();
  }

  const homeIsUser = fx.home === G.userClub;
  const homeTeam   = fx.home;
  const awayTeam   = fx.away;
  const homePow    = calcTeamPower(homeTeam, homeIsUser, G.tactics);
  const awayPow    = calcTeamPower(awayTeam, !homeIsUser, null);
  const W          = 720, H = 340;

  matchBall = { x: W/2, y: H/2, vx: 2, vy: 1.5 };

  matchState = {
    homeTeam, awayTeam, homeIsUser,
    hg: 0, ag: 0,
    minute: 0,
    speed: 1,
    paused: false,
    ended: false,
    events: generateMatchEvents(homeTeam, awayTeam, homePow, awayPow, true),
    eventIdx: 0,
    activeTeam: null,
    ballTarget: { x: W/2, y: H/2 },
    stats: {
      homeShots:0, awayShots:0,
      homeShotsOT:0, awayShotsOT:0,
      homeCorners:0, awayCorners:0,
      homeYellow:0, awayYellow:0,
      homeRed:0, awayRed:0,
      homePoss:50, awayPoss:50,
    },
    scorers: [],
    fx,
    awayKitH: getClubData(awayTeam)?.kitH || '#C8102E',
  };

  // Setup dialog elements
  setText('matchHomeTeam', homeTeam);
  setText('matchAwayTeam', awayTeam);
  setText('matchHomeScore', '0');
  setText('matchAwayScore', '0');
  setText('matchMinDisplay', "0'");
  el('matchLiveBadge').classList.remove('hidden');
  el('matchContinueBtn').classList.add('hidden');
  setText('mentalityMatchBtn', G.tactics.style.toUpperCase());
  setText('liveTacticDisplay', G.tactics.formation);

  // Clear commentary
  setHtml('commentaryFeed', '');
  setHtml('scorersList', '');

  // Reset match stats display
  resetStatDisplay();

  // Speed buttons
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.speed === '1');
    btn.onclick = () => {
      matchState.speed = parseInt(btn.dataset.speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    };
  });

  el('pauseMatchBtn').onclick = togglePause;
  el('instantMatchBtn').onclick = instantResult;
  el('mentalityMatchBtn').onclick = cycleMatchMentality;

  addCommentary(pickComm('kickoff', { stadium: G.stadium.name }), 'info');

  const dialog = el('matchDialog');
  dialog.showModal();
  dialog.addEventListener('close', () => clearInterval(matchTimer), { once: true });

  // Start match loop
  matchTimer = setInterval(matchTick, 120);
}

function matchTick() {
  if (!matchState || matchState.paused || matchState.ended) return;

  const ticksPerInterval = matchState.speed;
  const W = 720, H = 340;

  for (let t = 0; t < ticksPerInterval; t++) {
    matchState.minute++;

    // Process events at this minute
    while (matchState.eventIdx < matchState.events.length &&
           matchState.events[matchState.eventIdx].minute <= matchState.minute) {
      processMatchEvent(matchState.events[matchState.eventIdx], W, H);
      matchState.eventIdx++;
    }

    if (matchState.minute >= 90) {
      if (!matchState.ended) finishMatch();
      break;
    }
  }

  // Update possession based on activity
  updatePossDisplay();
  renderMatchCanvas(matchState);
  setText('matchMinDisplay', matchState.minute + "'");
  setText('matchHomeScore', matchState.hg);
  setText('matchAwayScore', matchState.ag);
}

function processMatchEvent(ev, W, H) {
  const isHome = ev.team === 'home';

  // Ball moves toward relevant area
  if (isHome) {
    matchState.ballTarget = { x: W * 0.75, y: randR(H*0.25, H*0.75) };
  } else {
    matchState.ballTarget = { x: W * 0.25, y: randR(H*0.25, H*0.75) };
  }
  matchState.activeTeam = ev.team;

  const scorerName = ev.scorer ? ev.scorer.last || ev.scorer.name : 'Unknown';
  const assisterName = ev.assister ? ev.assister.last : null;
  const playerName = ev.player ? ev.player.last || ev.player.name : 'player';
  const teamName = isHome ? matchState.homeTeam : matchState.awayTeam;
  const s = matchState.stats;

  switch (ev.type) {
    case 'goal':
      if (isHome) { matchState.hg++; matchState.ballTarget = { x: 30, y: H/2 }; }
      else { matchState.ag++; matchState.ballTarget = { x: W-30, y: H/2 }; }
      s[isHome?'homeShots':'awayShots']++;
      s[isHome?'homeShotsOT':'awayShotsOT']++;
      matchState.scorers.push({ name: scorerName, team: ev.team, minute: matchState.minute, assist: assisterName });
      updateScorersList();
      const goalComm = pickComm('goal', { scorer: scorerName, team: teamName });
      addCommentary(`${matchState.minute}' GOAL! ${goalComm}${assisterName ? ` (assist: ${assisterName})` : ''}`, 'goal');
      setText('matchHomeScore', matchState.hg);
      setText('matchAwayScore', matchState.ag);
      // Update player stats
      if (ev.scorer) { ev.scorer.goals = (ev.scorer.goals||0) + 1; }
      if (ev.assister) { ev.assister.assists = (ev.assister.assists||0) + 1; }
      break;
    case 'saved':
      s[isHome?'homeShots':'awayShots']++;
      s[isHome?'homeShotsOT':'awayShotsOT']++;
      addCommentary(`${matchState.minute}' ${pickComm('shotSaved', { scorer: scorerName, keeper: 'keeper', team: teamName })}`, 'info');
      break;
    case 'missed':
      s[isHome?'homeShots':'awayShots']++;
      addCommentary(`${matchState.minute}' ${pickComm('shotMissed', { scorer: scorerName, team: teamName })}`, 'info');
      break;
    case 'corner':
      s[isHome?'homeCorners':'awayCorners']++;
      if (Math.random() < 0.25) addCommentary(`${matchState.minute}' ${pickComm('corner', { team: teamName })}`, 'info');
      break;
    case 'foul':
      if (Math.random() < 0.3) addCommentary(`${matchState.minute}' ${pickComm('foul', { player: playerName, team: teamName })}`, 'info');
      break;
    case 'yellow':
      s[isHome?'homeYellow':'awayYellow']++;
      addCommentary(`${matchState.minute}' ${pickComm('yellow', { player: playerName })}`, 'card');
      if (ev.player) ev.player.yellowCards = (ev.player.yellowCards||0) + 1;
      break;
    case 'red':
      s[isHome?'homeRed':'awayRed']++;
      addCommentary(`${matchState.minute}' ${pickComm('red', { player: playerName, team: teamName })}`, 'danger');
      if (ev.player) ev.player.redCards = (ev.player.redCards||0) + 1;
      break;
    case 'injury':
      if (isHome && matchState.homeIsUser || !isHome && !matchState.homeIsUser) {
        const weeks = randR(1, 5);
        if (ev.player) ev.player.injuryWeeks = weeks;
        addCommentary(`${matchState.minute}' ${pickComm('injury', { player: playerName })} (${weeks} weeks out)`, 'danger');
      }
      break;
    case 'halftime':
      addCommentary(pickComm('halfTime'), 'info');
      matchState.ballTarget = { x: W/2, y: H/2 };
      break;
  }

  // Update stat display
  updateStatDisplay(s);
}

function updateScorersList() {
  const list = el('scorersList');
  if (!list) return;
  list.innerHTML = matchState.scorers.map(s =>
    `<div style="color:${s.team==='home'?'var(--accent)':'var(--accent3)'}">${s.minute}' ${s.name}${s.assist?` (${s.assist})`:''}</div>`
  ).join('');
}

function updateStatDisplay(s) {
  setText('statHomeShots', s.homeShots);
  setText('statAwayShots', s.awayShots);
  setText('statHomeShotsOT', s.homeShotsOT);
  setText('statAwayShotsOT', s.awayShotsOT);
  setText('statHomeCorners', s.homeCorners);
  setText('statAwayCorners', s.awayCorners);
  setText('statHomeYellow', s.homeYellow);
  setText('statAwayYellow', s.awayYellow);
  setText('statHomeRed', s.homeRed);
  setText('statAwayRed', s.awayRed);
}

function updatePossDisplay() {
  const s = matchState.stats;
  const hShots = s.homeShots + s.homeCorners;
  const aShots = s.awayShots + s.awayCorners;
  const total = hShots + aShots || 1;
  s.homePoss = Math.round((hShots / total) * 100 * 0.4 + 50 * 0.6);
  s.awayPoss = 100 - s.homePoss;
  setText('statHomePoss', s.homePoss);
  setText('statAwayPoss', s.awayPoss);
}

function resetStatDisplay() {
  ['statHomeShots','statAwayShots','statHomeShotsOT','statAwayShotsOT',
   'statHomeCorners','statAwayCorners','statHomeYellow','statAwayYellow',
   'statHomeRed','statAwayRed'].forEach(id => setText(id, '0'));
  setText('statHomePoss', '50'); setText('statAwayPoss', '50');
}

function addCommentary(text, type = 'info') {
  const feed = el('commentaryFeed');
  if (!feed) return;
  const div = document.createElement('div');
  div.className = `comm-line ${type}`;
  div.textContent = text;
  feed.insertBefore(div, feed.firstChild);
  // Keep last 40 lines
  while (feed.children.length > 40) feed.removeChild(feed.lastChild);
}

function togglePause() {
  matchState.paused = !matchState.paused;
  el('pauseMatchBtn').textContent = matchState.paused ? '▶ RESUME' : '⏸ PAUSE';
}

function instantResult() {
  // Fast-forward to remaining events
  while (matchState.eventIdx < matchState.events.length) {
    const ev = matchState.events[matchState.eventIdx];
    processMatchEvent(ev, 720, 340);
    matchState.eventIdx++;
  }
  matchState.minute = 90;
  setText('matchMinDisplay', "90'");
  finishMatch();
}

function cycleMatchMentality() {
  const styles = ['Defensive','Balanced','Attacking'];
  const idx = styles.indexOf(G.tactics.style);
  G.tactics.style = styles[(idx + 1) % 3];
  setText('mentalityMatchBtn', G.tactics.style.toUpperCase());
  addCommentary(pickComm('tactical'), 'info');
  // Recalculate adds no extra events but affects perception
}

function finishMatch() {
  if (matchState.ended) return;
  matchState.ended = true;
  clearInterval(matchTimer);

  const { hg, ag, homeTeam, awayTeam, homeIsUser, fx } = matchState;

  addCommentary(pickComm('fullTime'), 'info');
  addCommentary(`FULL TIME: ${homeTeam} ${hg} - ${ag} ${awayTeam}`, 'goal');

  // Record result
  const homeT = findTeamByName(homeTeam);
  const awayT = findTeamByName(awayTeam);
  if (homeT && awayT) recordResult(homeT, awayT, hg, ag);
  fx.played = true;
  fx.hg = hg;
  fx.ag = ag;

  // User outcome
  const userGoals   = homeIsUser ? hg : ag;
  const oppoGoals   = homeIsUser ? ag : hg;
  handleUserOutcome(userGoals, oppoGoals);

  // Record in history
  G.matchHistory.push({
    season: G.season, week: G.week,
    homeClub: homeTeam, awayClub: awayTeam,
    hg, ag, isUser: true
  });

  // Finance tick for home game
  if (homeIsUser) applyMatchdayRevenue();

  // Player development tick
  updatePlayerAfterMatch(homeIsUser);

  // Apply wages for the week
  applyWeeklyFinances();

  el('matchLiveBadge').classList.add('hidden');
  el('matchContinueBtn').classList.remove('hidden');
  renderMatchCanvas(matchState);
}

function closeMatch() {
  const dialog = el('matchDialog');
  if (dialog) dialog.close();
  clearInterval(matchTimer);
  // Sim rest of week, advance
  simRestOfWeek();
  advanceWeek();
  refreshHud();
  renderTab(G.tab);
}


// ============================================================
// SEASON / WEEK MANAGEMENT
// ============================================================

function simRestOfWeek() {
  // Simulate all remaining unplayed matches in this week across all leagues
  for (const [leagueId, rounds] of Object.entries(G.fixtures)) {
    const round = rounds[G.week - 1];
    if (!round) continue;
    for (const match of round) {
      if (match.played) continue;
      const isUserMatch = (match.home === G.userClub || match.away === G.userClub) && leagueId === G.userLeague;
      if (isUserMatch) continue; // already played or skip
      const [hg, ag] = simulateMatchResult(match.home, match.away);
      match.played = true;
      match.hg = hg;
      match.ag = ag;
      const ht = findTeamByName(match.home);
      const at = findTeamByName(match.away);
      if (ht && at) recordResult(ht, at, hg, ag);
    }
  }
}

function simWeekAuto() {
  // Sim everything including user match
  const fx = getNextUserFixture();
  if (fx && !fx.played) {
    const homeIsUser = fx.home === G.userClub;
    const [hg, ag] = simulateMatchResult(fx.home, fx.away);
    fx.played = true;
    fx.hg = hg;
    fx.ag = ag;
    const ht = findTeamByName(fx.home);
    const at = findTeamByName(fx.away);
    if (ht && at) recordResult(ht, at, hg, ag);
    const userGoals = homeIsUser ? hg : ag;
    const oppoGoals = homeIsUser ? ag : hg;
    handleUserOutcome(userGoals, oppoGoals);
    if (homeIsUser) applyMatchdayRevenue();
    G.matchHistory.push({
      season: G.season, week: G.week,
      homeClub: fx.home, awayClub: fx.away,
      hg, ag, isUser: true, simmed: true
    });
    toast(`${fx.home} ${hg} - ${ag} ${fx.away} (simulated)`);
  }

  simRestOfWeek();
  applyWeeklyFinances();
  advanceWeek();
  refreshHud();
  renderTab(G.tab);
}

function simulateMatchResult(homeClub, awayClub) {
  const ht = findTeamByName(homeClub);
  const at = findTeamByName(awayClub);
  const hPow = ht ? (ht.squad.reduce((s,p)=>s+p.ovr,0)/ht.squad.length * 0.7 + ht.strength * 0.3) : 65;
  const aPow = at ? (at.squad.reduce((s,p)=>s+p.ovr,0)/at.squad.length * 0.7 + at.strength * 0.3) : 65;
  const hAdv = 5; // home advantage
  const diff = (hPow + hAdv - aPow) / 25;
  const hGoals = clamp(Math.round(Math.random() * 2.3 + diff * 0.5), 0, 7);
  const aGoals = clamp(Math.round(Math.random() * 2.0 - diff * 0.5), 0, 7);
  return [hGoals, aGoals];
}

function recordResult(homeTeam, awayTeam, hg, ag) {
  homeTeam.p++; awayTeam.p++;
  homeTeam.gf += hg; homeTeam.ga += ag; homeTeam.gd = homeTeam.gf - homeTeam.ga;
  awayTeam.gf += ag; awayTeam.ga += hg; awayTeam.gd = awayTeam.gf - awayTeam.ga;
  const hmResult = hg > ag ? 'W' : hg === ag ? 'D' : 'L';
  const awResult = hg < ag ? 'W' : hg === ag ? 'D' : 'L';
  if (hg > ag) { homeTeam.w++; homeTeam.pts += 3; awayTeam.l++; }
  else if (hg < ag) { awayTeam.w++; awayTeam.pts += 3; homeTeam.l++; }
  else { homeTeam.d++; awayTeam.d++; homeTeam.pts++; awayTeam.pts++; }
  homeTeam.form = [...(homeTeam.form || []).slice(-4), hmResult];
  awayTeam.form = [...(awayTeam.form || []).slice(-4), awResult];
}

function handleUserOutcome(gs, gc) {
  const win = gs > gc, draw = gs === gc, loss = gs < gc;
  if (win) {
    G.boardConf  = clamp(G.boardConf + 2.5, 0, 100);
    G.fanConf    = clamp(G.fanConf + 2, 0, 100);
    G.consecutiveLosses = 0;
    addInbox(`Win! ${gs}-${gc}. Board pleased. Board confidence: ${Math.round(G.boardConf)}%.`, 'good', 'Board');
  } else if (draw) {
    G.boardConf  = clamp(G.boardConf - 0.5, 0, 100);
    G.fanConf    = clamp(G.fanConf + 0.5, 0, 100);
    G.consecutiveLosses = 0;
  } else {
    G.boardConf  = clamp(G.boardConf - 3, 0, 100);
    G.fanConf    = clamp(G.fanConf - 2, 0, 100);
    G.consecutiveLosses++;
    if (G.consecutiveLosses >= 3) {
      G.sackWarning = true;
      addInbox(`Warning: ${G.consecutiveLosses} consecutive losses. The board is getting restless.`, 'bad', 'Chairman');
    }
    if (G.boardConf < 15) {
      addInbox('CRITICAL: Board confidence extremely low. Improve results or you face the sack!', 'bad', 'Chairman');
    }
  }
}

function applyMatchdayRevenue() {
  const rev = (G.stadium.capacity * 0.000015) * (G.fanConf / 100) * 0.9;
  G.budget += Math.round(rev * 100) / 100;
}

function applyWeeklyFinances() {
  const maintenance = 0.08 * G.stadium.upgradeLevel + 0.1;
  const weeklyNet = G.sponsorIncome - G.wages - maintenance;
  G.budget += Math.round(weeklyNet * 100) / 100;
}

function advanceWeek() {
  G.week++;
  G.totalWeeks++;
  const totalRounds = G.fixtures[G.userLeague]?.length || 38;

  // Auto-generate incoming AI bids occasionally
  if (Math.random() < 0.12 && G.squad.length > 14) {
    generateIncomingBid();
  }

  // Player weekly updates
  weeklyPlayerUpdate();

  // Transfer window status change
  if (G.week === 5) addInbox('Transfer window closed. No more signings until January.', 'warn', 'Board');
  if (G.week === 20) addInbox('January transfer window opens! Time to strengthen the squad.', 'good', 'Board');
  if (G.week === 24) addInbox('January transfer window closed.', 'warn', 'Board');

  if (G.week > totalRounds) {
    endSeason();
  }
}

function weeklyPlayerUpdate() {
  for (const p of G.squad) {
    // Injury recovery
    if (p.injuryWeeks > 0) {
      const recovery = G.stadium.medicalLevel * 0.3 + 0.5;
      p.injuryWeeks = Math.max(0, p.injuryWeeks - recovery);
    }

    // Fitness decay / recovery
    if (p.injuryWeeks > 0) {
      p.fitness = clamp(p.fitness - 3, 20, 100);
    } else {
      const trainingBoost = G.stadium.trainingLevel * 0.5;
      p.fitness = clamp(p.fitness + randR(-2, 4) + trainingBoost, 60, 100);
    }

    // Morale fluctuation
    p.morale = clamp(p.morale + randR(-3, 4) + (G.boardConf > 60 ? 1 : -1), 20, 100);

    // Age development
    const trainFactor = G.stadium.trainingLevel;
    if (p.age < 26 && p.ovr < p.pot) {
      const growth = Math.random() < (0.06 + trainFactor * 0.02) ? 1 : 0;
      p.ovr = Math.min(p.pot, p.ovr + growth);
    } else if (p.age > 30) {
      if (Math.random() < 0.02) p.ovr = Math.max(40, p.ovr - 1);
    }

    // Contract countdown (simplified)
    if (G.week === 1 && G.season > 1) p.contractYears = Math.max(0, p.contractYears - 1);
  }
}

function generateIncomingBid() {
  const listed = G.squad.filter(p => p.transferListed && !p.injuryWeeks);
  const target = listed.length ? pick(listed) : null;
  if (!target) return;
  const buyerClub = pick(CLUBS.filter(c => c.name !== G.userClub));
  const fee = Math.round(target.value * (0.85 + Math.random() * 0.4) * 10) / 10;
  G.incomingBids.push({ player: target, fee, buyerClub: buyerClub.name });
  addInbox(`${buyerClub.name} bid ${fmtM(fee)} for ${target.name}!`, 'warn', 'Agent');
}

function updatePlayerAfterMatch(userIsHome) {
  for (const p of G.squad) {
    if (G.startingXI.includes(p.id)) {
      p.appearances = (p.appearances || 0) + 1;
      p.fitness = clamp(p.fitness - randR(5, 15), 30, 100);
      p.morale = clamp(p.morale + (userIsHome ? 2 : -1), 20, 100);
    }
  }
}


// ============================================================
// END OF SEASON
// ============================================================
function endSeason() {
  const table = getSortedTable(G.userLeague);
  const pos   = table.findIndex(t => t.club === G.userClub) + 1;
  const cfg   = getLeagueConfig(G.userLeague);

  // Prize money
  const numTeams = table.length;
  let prize = cfg?.prize20 || 2;
  if (pos === 1)           prize = cfg?.prize1  || 25;
  else if (pos <= 4)       prize = cfg?.prize4   || 12;
  else if (pos <= numTeams/2) prize = cfg?.prize10 || 7;

  G.budget += prize;

  // Board confidence end-of-season adjustment
  const objMet = checkObjective(pos, cfg);
  if (objMet) {
    G.boardConf = clamp(G.boardConf + 15, 0, 100);
    addInbox(`Board objective met! Excellent season. Bonus prize: ${fmtM(prize)}.`, 'good', 'Chairman');
  } else {
    G.boardConf = clamp(G.boardConf - 10, 0, 100);
    addInbox(`Board objective not met. The board is disappointed. Prize: ${fmtM(prize)}.`, 'bad', 'Chairman');
  }

  // Fan boost from good season
  if (pos <= 5) G.fanConf = clamp(G.fanConf + 8, 0, 100);

  // Show season review
  showSeasonReview(pos, prize, table, objMet);

  // Prepare next season
  G.season++;
  G.week = 1;
  G.consecutiveLosses = 0;
  G.sackWarning = false;
  G.matchHistory = [];

  // Reset league tables
  for (const [leagueId, teams] of Object.entries(G.leagues)) {
    teams.forEach(t => {
      t.p=0; t.w=0; t.d=0; t.l=0; t.gf=0; t.ga=0; t.gd=0; t.pts=0; t.form=[];
      // Slight strength evolution for AI teams
      t.strength = clamp(t.strength + randR(-3, 4), 48, 96);
    });
    const clubs = CLUBS.filter(c => c.league === leagueId);
    G.fixtures[leagueId] = createRoundRobin(clubs.map(c => c.name));
  }

  // Refresh market for new season
  generateMarket();

  // Youth development: occasional breakthrough
  const youthBreakthrough = G.squad.filter(p => p.age <= 20 && p.ovr < p.pot - 5);
  if (youthBreakthrough.length && Math.random() < G.stadium.youthLevel * 0.1) {
    const youngster = pick(youthBreakthrough);
    const boost = randR(3, 8);
    youngster.ovr = Math.min(youngster.pot, youngster.ovr + boost);
    addInbox(`Youth breakthrough! ${youngster.name} improved to OVR ${youngster.ovr}. The academy is paying off.`, 'good', 'Youth Coach');
  }

  // Player value updates
  for (const p of G.squad) {
    p.value = calcValue(p.ovr, p.age, p.pot);
    p.wage = Math.max(p.wage, calcWage(p.ovr, G.userClubData?.strength || 65));
    p.age++;
  }

  G.transferWindow = true;
  addInbox(`Season ${G.season-1} complete. New season begins! Transfer window open.`, 'good', 'Board');
}

function checkObjective(pos, cfg) {
  const obj = G.boardObjective;
  const numTeams = (cfg && G.leagues[G.userLeague]?.length) || 20;
  if (obj === 'Title')      return pos === 1;
  if (obj === 'Top 4')      return pos <= 4;
  if (obj === 'Top 6')      return pos <= 6;
  if (obj === 'Top 8')      return pos <= 8;
  if (obj === 'Top 10')     return pos <= 10;
  if (obj === 'Mid-table')  return pos > numTeams * 0.3 && pos < numTeams * 0.7;
  if (obj === 'Promotion')  return pos <= 2;
  if (obj === 'Survival')   return pos <= numTeams - 3;
  return pos <= Math.ceil(numTeams / 2);
}

function showSeasonReview(pos, prize, table, objMet) {
  const userRow = table[pos - 1] || table[0];
  const topScorer = G.squad.reduce((best, p) => (!best || p.goals > best.goals) ? p : best, null);
  const emoji = pos === 1 ? '🏆' : pos <= 4 ? '⭐' : pos <= 10 ? '✅' : pos <= 15 ? '😐' : '😰';

  const reviewHtml = `
    <div style="text-align:center;">
      <div class="review-trophy">${emoji}</div>
      <h2>Season ${G.season - 1} Complete!</h2>
      <div style="font-size:1.5rem;color:var(--accent2);margin:8px 0;">
        Finished: <strong>#${pos}</strong> in ${getLeagueConfig(G.userLeague)?.name || G.userLeague}
      </div>
      <div style="color:${objMet ? 'var(--success)' : 'var(--danger)'}; margin-bottom:12px;">
        Board objective (${G.boardObjective}): ${objMet ? 'ACHIEVED ✓' : 'NOT MET ✗'}
      </div>
    </div>

    <div class="review-stat-grid">
      <div class="review-stat">
        <div class="review-stat-label">PLAYED</div>
        <div class="review-stat-value">${userRow?.p || 0}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">WINS</div>
        <div class="review-stat-value">${userRow?.w || 0}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">DRAWS</div>
        <div class="review-stat-value">${userRow?.d || 0}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">LOSSES</div>
        <div class="review-stat-value">${userRow?.l || 0}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">GF:GA</div>
        <div class="review-stat-value">${userRow?.gf || 0}:${userRow?.ga || 0}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">POINTS</div>
        <div class="review-stat-value">${userRow?.pts || 0}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">PRIZE MONEY</div>
        <div class="review-stat-value">${fmtM(prize)}</div>
      </div>
      <div class="review-stat">
        <div class="review-stat-label">TOP SCORER</div>
        <div class="review-stat-value">${topScorer ? `${topScorer.last} (${topScorer.goals})` : 'N/A'}</div>
      </div>
    </div>

    <h3 style="margin-top:12px;">Final Table</h3>
    <table class="data-table">
      <tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr>
      ${table.slice(0, 8).map((t, i) => `
        <tr${t.club===G.userClub?' class="user-row"':''}>
          <td>${i+1}</td><td>${t.club}</td><td>${t.p}</td>
          <td>${t.w}</td><td>${t.d}</td><td>${t.l}</td>
          <td>${t.gd}</td><td>${t.pts}</td>
        </tr>
      `).join('')}
    </table>

    <div style="text-align:center;margin-top:16px;">
      <button class="btn-primary" style="padding:12px 32px;" onclick="RG.dismissSeasonReview()">
        &#x25B6; BEGIN SEASON ${G.season}
      </button>
    </div>
  `;

  setHtml('seasonReviewContent', reviewHtml);
  el('seasonReviewDialog').showModal();
}

function dismissSeasonReview() {
  el('seasonReviewDialog').close();
  refreshHud();
  renderTab('dashboard');
}


// ============================================================
// TRANSFERS SCREEN (Pending bids view)
// ============================================================
function renderTransfers() {
  const listed = G.squad.filter(p => p.transferListed);
  setHtml('tab-transfers', `
    <div class="transfers-grid">
      <div>
        <div class="panel mb-8">
          <h2>Your Transfer Listed Players</h2>
          ${listed.length ? listed.map(p => `
            <div class="bid-row">
              <div>
                <span class="pos-badge ${p.position}">${p.position}</span>
                <strong>${p.name}</strong>
                <span class="text-dim text-xs">OVR ${p.ovr} &middot; ${p.age}y</span>
              </div>
              <div>
                <span class="text-accent2">${fmtM(p.value)}</span>
                <button class="btn-sm btn-danger" onclick="RG.sellPlayer(${p.id})" style="margin-left:6px;">SELL</button>
                <button class="btn-sm" onclick="RG.listForSale(${p.id})" style="margin-left:4px;">UNLIST</button>
              </div>
            </div>
          `).join('') : '<p class="text-dim text-sm">No players on transfer list. Go to SQUAD to list players.</p>'}
        </div>

        <div class="panel">
          <h2>Incoming Offers</h2>
          ${G.incomingBids.length ? G.incomingBids.map((bid, i) => `
            <div class="bid-row">
              <div>
                <strong>${bid.buyerClub}</strong> offers <strong style="color:var(--accent2)">${fmtM(bid.fee)}</strong> for <strong>${bid.player.name}</strong>
                <div class="text-xs text-dim">OVR ${bid.player.ovr} &middot; Value: ${fmtM(bid.player.value)}</div>
              </div>
              <div style="display:flex;gap:4px;">
                <button class="btn-sm btn-primary" onclick="RG.acceptBid(${i})">ACCEPT</button>
                <button class="btn-sm btn-danger" onclick="RG.rejectBid(${i})">REJECT</button>
              </div>
            </div>
          `).join('') : '<p class="text-dim text-sm">No incoming offers right now.</p>'}
        </div>
      </div>

      <div>
        <div class="panel">
          <h2>Transfer Summary</h2>
          <div class="preview-stat"><span>Budget Available</span><span style="color:var(--success)">${fmtM(G.budget)}</span></div>
          <div class="preview-stat"><span>Current Wages</span><span style="color:var(--danger)">${fmtM(G.wages)}/w</span></div>
          <div class="preview-stat"><span>Squad Size</span><span>${G.squad.length} players</span></div>
          <div class="preview-stat"><span>Transfer Window</span><span style="color:${isTransferWindowOpen()?'var(--success)':'var(--danger)'}">${isTransferWindowOpen()?'OPEN':'CLOSED'}</span></div>
          <div class="mt-8">
            <p class="text-sm text-dim">Windows: Weeks 1-4 (Summer) &amp; Weeks 20-23 (Winter)</p>
          </div>
          <div class="mt-8">
            <button class="btn-primary full-width" onclick="RG.showTab('scouting')">GO TO SCOUTING MARKET</button>
          </div>
        </div>
      </div>
    </div>
  `);
}

// ============================================================
// SAVE / LOAD
// ============================================================
function saveGame(slot = 1) {
  try {
    const saveData = {
      version: '1.0',
      savedAt: new Date().toISOString(),
      G: {
        screen: G.screen, tab: G.tab,
        managerName: G.managerName, difficulty: G.difficulty,
        season: G.season, week: G.week, totalWeeks: G.totalWeeks,
        userClub: G.userClub, userLeague: G.userLeague,
        budget: G.budget, wages: G.wages, sponsorIncome: G.sponsorIncome,
        boardConf: G.boardConf, fanConf: G.fanConf,
        boardObjective: G.boardObjective,
        consecutiveLosses: G.consecutiveLosses, sackWarning: G.sackWarning,
        stadium: { ...G.stadium },
        squad: G.squad,
        startingXI: G.startingXI,
        subs: G.subs,
        tactics: { ...G.tactics },
        inbox: G.inbox.slice(0, 20),
        matchHistory: G.matchHistory.slice(-20),
        market: G.market.slice(0, 20),
        incomingBids: G.incomingBids,
        leagues: G.leagues,
        fixtures: G.fixtures,
        squadSort: G.squadSort,
        squadFilter: G.squadFilter,
      }
    };
    localStorage.setItem(`retroGaffer_save${slot}`, JSON.stringify(saveData));
    toast(`Game saved to slot ${slot}!`);
  } catch (e) {
    toast('Save failed: ' + e.message, 'danger');
    console.error('Save error:', e);
  }
}

function loadSave(slot = 1) {
  try {
    const raw = localStorage.getItem(`retroGaffer_save${slot}`);
    if (!raw) { toast(`No save found in slot ${slot}.`, 'warning'); return; }
    const data = JSON.parse(raw);
    if (!data.G) { toast('Invalid save file.', 'danger'); return; }

    const s = data.G;
    G.managerName = s.managerName || 'Manager';
    G.difficulty  = s.difficulty || 'standard';
    G.season      = s.season || 1;
    G.week        = s.week || 1;
    G.totalWeeks  = s.totalWeeks || 0;
    G.userClub    = s.userClub;
    G.userLeague  = s.userLeague;
    G.userClubData = CLUBS.find(c => c.name === s.userClub);
    G.budget      = s.budget || 0;
    G.wages       = s.wages || 0;
    G.sponsorIncome = s.sponsorIncome || 0;
    G.boardConf   = s.boardConf || 65;
    G.fanConf     = s.fanConf || 65;
    G.boardObjective = s.boardObjective || 'Mid-table';
    G.consecutiveLosses = s.consecutiveLosses || 0;
    G.sackWarning = s.sackWarning || false;
    G.stadium     = { ...G.stadium, ...s.stadium };
    G.squad       = s.squad || [];
    G.startingXI  = s.startingXI || [];
    G.subs        = s.subs || [];
    G.tactics     = { ...G.tactics, ...s.tactics };
    G.inbox       = s.inbox || [];
    G.matchHistory = s.matchHistory || [];
    G.market      = s.market || [];
    G.incomingBids = s.incomingBids || [];
    G.leagues     = s.leagues || {};
    G.fixtures    = s.fixtures || {};
    G.squadSort   = s.squadSort || { key:'ovr', dir:-1 };
    G.squadFilter = s.squadFilter || 'ALL';
    G.inboxUnread = G.inbox.filter(m => !m.read).length;

    showScreen('gameScreen');
    setupNavListeners();
    refreshHud();
    showTab('dashboard');
    toast(`Loaded: ${G.managerName} at ${G.userClub}, Season ${G.season}`);
  } catch (e) {
    toast('Load failed: ' + e.message, 'danger');
    console.error('Load error:', e);
  }
}

// ============================================================
// NAVIGATION SETUP
// ============================================================
function setupNavListeners() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });
}

// ============================================================
// PUBLIC API — RG namespace
// ============================================================
const RG = {
  startNewGame() { showScreen('setupScreen'); renderSetup(); },
  loadSave, saveGame,
  filterClubsBy, selectClub, confirmStartCareer,
  showTab,
  // Squad
  sortSquad, filterSquad, toggleXI, autoPickXIBtn, listForSale,
  // Tactics
  setFormation, setTacticStyle, setMentality, setSlider,
  // Scouting / Transfers
  setMarketFilter, refreshMarket, initiateTransfer, sellPlayer,
  acceptBid, rejectBid,
  // Stadium
  expandStadium, refurbishStadium, upgradeTraining, upgradeYouth, upgradeScout, upgradeMedical,
  // League
  setLeagueView,
  // Match
  playMatch, closeMatch,
  // Week sim
  simWeekAuto,
  // Season
  endSeason, dismissSeasonReview,
};

// ============================================================
// ENTRY POINT
// ============================================================
(function init() {
  // Pre-initialize player ID counter
  _playerIdCounter = Date.now() % 100000 + 1000;
  showScreen('splashScreen');
})();

