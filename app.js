const LEAGUES = {
  'Premier League': ['Arsenal', 'Liverpool', 'Manchester City', 'Chelsea', 'Manchester United', 'Tottenham', 'Newcastle', 'Aston Villa', 'Brighton', 'West Ham'],
  'La Liga': ['Real Madrid', 'Barcelona', 'Atletico Madrid', 'Athletic Club', 'Real Sociedad', 'Real Betis', 'Sevilla', 'Valencia', 'Villarreal', 'Girona'],
  'Serie A': ['Inter', 'Milan', 'Juventus', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina', 'Bologna', 'Torino'],
  'Bundesliga': ['Bayern Munich', 'Borussia Dortmund', 'RB Leipzig', 'Bayer Leverkusen', 'Stuttgart', 'Eintracht Frankfurt', 'Wolfsburg', 'Gladbach', 'Freiburg', 'Werder Bremen'],
  'Ligue 1': ['PSG', 'Marseille', 'Monaco', 'Lille', 'Lyon', 'Rennes', 'Nice', 'Lens', 'Nantes', 'Strasbourg']
};

const app = {
  season: 1,
  week: 1,
  selectedTab: 'dashboard',
  userClub: null,
  leagues: {},
  fixtures: {},
  tactics: { style: 'Balanced', press: 50, tempo: 50, formation: '4-4-2' },
  finances: { budget: 65, wages: 2.4, fans: 62, board: 63, sponsor: 0.8 },
  stadium: { level: 1, capacity: 26000, condition: 84 },
  logs: [],
  market: []
};

const rand = (n) => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(v, b));

function buildLeagues() {
  for (const [name, teams] of Object.entries(LEAGUES)) {
    app.leagues[name] = teams.map((club) => ({
      club,
      p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0,
      strength: 58 + rand(28),
      squad: generateSquad(club)
    }));
    app.fixtures[name] = createRoundRobin(teams);
  }
}

function generateSquad(club) {
  const roles = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD', 'MID', 'DEF', 'FWD', 'GK'];
  return roles.map((role, i) => ({
    name: `${club.split(' ')[0]}-${role}${i + 1}`,
    role,
    rating: 55 + rand(35),
    value: 1 + rand(25),
    wage: Number((0.02 + Math.random() * 0.18).toFixed(2))
  }));
}

function createRoundRobin(teams) {
  const list = [...teams];
  if (list.length % 2) list.push('BYE');
  const rounds = [];
  const n = list.length;
  for (let r = 0; r < n - 1; r++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i];
      const b = list[n - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') matches.push({ home: a, away: b, played: false });
    }
    rounds.push(matches);
    list.splice(1, 0, list.pop());
  }
  const reverse = rounds.map((round) => round.map((m) => ({ home: m.away, away: m.home, played: false })));
  return [...rounds, ...reverse];
}

function buildClubSelect() {
  const el = document.getElementById('clubSelect');
  const groups = Object.entries(LEAGUES).map(([league, clubs]) => `
    <h3>${league}</h3>
    <div class="clubGrid">${clubs.map((club) => `<button class="clubBtn" data-league="${league}" data-club="${club}">${club}</button>`).join('')}</div>
  `).join('');
  el.innerHTML = `<h2>Choose Your Club</h2><p>Take charge, win titles, balance the books, build your stadium empire.</p>${groups}`;

  el.querySelectorAll('.clubBtn').forEach((btn) => btn.addEventListener('click', () => {
    app.userClub = { name: btn.dataset.club, league: btn.dataset.league };
    app.logs.unshift(`You signed as manager of ${app.userClub.name}.`);
    document.getElementById('clubSelect').classList.add('hidden');
    document.getElementById('gameLayout').classList.remove('hidden');
    refresh();
  }));
}

function getUserTeam() {
  return app.leagues[app.userClub.league].find((t) => t.club === app.userClub.name);
}

function refreshHud() {
  document.getElementById('clubName').textContent = app.userClub.name;
  document.getElementById('leagueName').textContent = app.userClub.league;
  document.getElementById('seasonNo').textContent = app.season;
  document.getElementById('weekNo').textContent = app.week;
  document.getElementById('budget').textContent = app.finances.budget.toFixed(1);
  document.getElementById('wages').textContent = app.finances.wages.toFixed(2);
  document.getElementById('fans').textContent = app.finances.fans;
  document.getElementById('board').textContent = app.finances.board;
}

function getThisWeekFixture() {
  const round = app.fixtures[app.userClub.league][app.week - 1] || [];
  return round.find((m) => m.home === app.userClub.name || m.away === app.userClub.name);
}

function renderDashboard() {
  const fixture = getThisWeekFixture();
  const div = document.getElementById('dashboard');
  div.innerHTML = `
    <div class="cards">
      <div class="card">
        <h3>Next Match</h3>
        <p>${fixture ? `${fixture.home} vs ${fixture.away}` : 'Season finished'}</p>
        <button id="playMatch" ${fixture ? '' : 'disabled'}>Play Match</button>
        <button id="simWeek">Sim Week</button>
      </div>
      <div class="card">
        <h3>Squad Pulse</h3>
        <p>Avg Rating: ${avgSquad(getUserTeam()).toFixed(1)}</p>
        <p>Morale Boost Week: ${(app.tactics.style === 'Attacking' ? '+2' : '+1')} potential</p>
      </div>
      <div class="card">
        <h3>Board Objective</h3>
        <p>Finish in top 4 and keep board confidence above 55%.</p>
      </div>
      <div class="card">
        <h3>Manager Log</h3>
        <pre>${app.logs.slice(0, 8).join('\n')}</pre>
      </div>
    </div>
  `;

  const play = document.getElementById('playMatch');
  if (play) play.addEventListener('click', playUserMatch);
  document.getElementById('simWeek').addEventListener('click', () => simulateWeek(false));
}

function renderTactics() {
  document.getElementById('tactics').innerHTML = `
    <h3>Tactical Board</h3>
    <div class="cards">
      <div class="card">
        <label>Formation</label>
        <select id="formationSel">
          ${['4-4-2', '4-3-3', '4-2-3-1', '3-5-2'].map((f) => `<option ${app.tactics.formation === f ? 'selected' : ''}>${f}</option>`).join('')}
        </select>
      </div>
      <div class="card">
        <label>Style</label>
        <select id="styleSel">${['Defensive', 'Balanced', 'Attacking'].map((s) => `<option ${app.tactics.style === s ? 'selected' : ''}>${s}</option>`)}</select>
      </div>
      <div class="card"><label>Press: <span id="pressVal">${app.tactics.press}</span></label><input id="press" type="range" min="0" max="100" value="${app.tactics.press}" /></div>
      <div class="card"><label>Tempo: <span id="tempoVal">${app.tactics.tempo}</span></label><input id="tempo" type="range" min="0" max="100" value="${app.tactics.tempo}" /></div>
    </div>
  `;
  document.getElementById('formationSel').onchange = (e) => app.tactics.formation = e.target.value;
  document.getElementById('styleSel').onchange = (e) => app.tactics.style = e.target.value;
  document.getElementById('press').oninput = (e) => { app.tactics.press = +e.target.value; document.getElementById('pressVal').textContent = e.target.value; };
  document.getElementById('tempo').oninput = (e) => { app.tactics.tempo = +e.target.value; document.getElementById('tempoVal').textContent = e.target.value; };
}

function refillMarket() {
  app.market = Array.from({ length: 14 }, (_, i) => ({
    name: `Prospect-${app.season}-${i + 1}`,
    role: ['GK', 'DEF', 'MID', 'FWD'][rand(4)],
    rating: 58 + rand(30),
    fee: 2 + rand(28),
    wage: Number((0.04 + Math.random() * 0.2).toFixed(2))
  }));
}

function renderTransfers() {
  const squad = getUserTeam().squad;
  document.getElementById('transfers').innerHTML = `
    <h3>Transfer Centre</h3>
    <div class="cards">
      <div class="card">
        <h4>Market</h4>
        ${app.market.map((p, i) => `<div>${p.name} (${p.role}) ${p.rating} OVR - £${p.fee}m <button data-buy="${i}">Buy</button></div>`).join('')}
      </div>
      <div class="card">
        <h4>Your Squad (sell to raise funds)</h4>
        ${squad.slice(0, 12).map((p, i) => `<div>${p.name} ${p.rating} OVR - value £${p.value}m <button data-sell="${i}">Sell</button></div>`).join('')}
      </div>
    </div>
  `;
  document.querySelectorAll('[data-buy]').forEach((btn) => btn.onclick = () => buyPlayer(+btn.dataset.buy));
  document.querySelectorAll('[data-sell]').forEach((btn) => btn.onclick = () => sellPlayer(+btn.dataset.sell));
}

function buyPlayer(i) {
  const p = app.market[i];
  if (!p) return;
  if (app.finances.budget < p.fee) return toast('Not enough budget.');
  app.finances.budget -= p.fee;
  app.finances.wages += p.wage;
  getUserTeam().squad.push({ ...p, value: p.fee + rand(8) });
  app.logs.unshift(`Signed ${p.name} for £${p.fee}m.`);
  app.market.splice(i, 1);
  refresh();
}

function sellPlayer(i) {
  const squad = getUserTeam().squad;
  const p = squad[i];
  if (!p) return;
  app.finances.budget += p.value;
  app.finances.wages = clamp(Number((app.finances.wages - p.wage).toFixed(2)), 0.2, 9);
  app.logs.unshift(`Sold ${p.name} for £${p.value}m.`);
  squad.splice(i, 1);
  refresh();
}

function renderFinances() {
  document.getElementById('finances').innerHTML = `
    <h3>Finance Office</h3>
    <table class="table">
      <tr><th>Category</th><th>Per Week (£m)</th></tr>
      <tr><td>Sponsorship</td><td>${app.finances.sponsor.toFixed(2)}</td></tr>
      <tr><td>Matchday Revenue</td><td>${((app.stadium.capacity * 0.00002) * (app.finances.fans / 100)).toFixed(2)}</td></tr>
      <tr><td>Wages</td><td>- ${app.finances.wages.toFixed(2)}</td></tr>
      <tr><td>Maintenance</td><td>- ${(0.12 * app.stadium.level).toFixed(2)}</td></tr>
    </table>
  `;
}

function renderStadium() {
  document.getElementById('stadium').innerHTML = `
    <h3>Stadium & Infrastructure</h3>
    <p>Level ${app.stadium.level} | Capacity ${app.stadium.capacity.toLocaleString()} | Condition ${app.stadium.condition}%</p>
    <button id="expandBtn">Expand Stand (£${(8 * app.stadium.level).toFixed(1)}m)</button>
    <button id="restoreBtn">Improve Pitch (£2m)</button>
  `;
  document.getElementById('expandBtn').onclick = () => {
    const cost = Number((8 * app.stadium.level).toFixed(1));
    if (app.finances.budget < cost) return toast('Budget too low for expansion.');
    app.finances.budget -= cost;
    app.stadium.level++;
    app.stadium.capacity += 7000;
    app.finances.fans = clamp(app.finances.fans + 3, 0, 100);
    app.logs.unshift(`Stadium expanded. New capacity ${app.stadium.capacity}.`);
    refresh();
  };
  document.getElementById('restoreBtn').onclick = () => {
    if (app.finances.budget < 2) return toast('Budget too low.');
    app.finances.budget -= 2;
    app.stadium.condition = clamp(app.stadium.condition + 12, 0, 100);
    app.logs.unshift('Pitch and facilities improved.');
    refresh();
  };
}

function renderLeague() {
  const tableRows = [...app.leagues[app.userClub.league]].sort((a, b) => b.pts - a.pts || b.gd - a.gd)
    .map((t, i) => `<tr ${t.club === app.userClub.name ? 'style="color: var(--accent);"' : ''}><td>${i + 1}</td><td>${t.club}</td><td>${t.p}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf}:${t.ga}</td><td>${t.pts}</td></tr>`).join('');
  document.getElementById('league').innerHTML = `
    <h3>${app.userClub.league} Table</h3>
    <table class="table"><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF:GA</th><th>Pts</th></tr>${tableRows}</table>
  `;
}

function applyFinanceTick(matchBonus = 0) {
  const matchRevenue = (app.stadium.capacity * 0.00002) * (app.finances.fans / 100);
  const delta = app.finances.sponsor + matchRevenue + matchBonus - app.finances.wages - (0.12 * app.stadium.level);
  app.finances.budget = Number((app.finances.budget + delta).toFixed(2));
  app.stadium.condition = clamp(app.stadium.condition - (0.6 + rand(10) / 10), 42, 100);
}

function styleMod() {
  if (app.tactics.style === 'Attacking') return 8;
  if (app.tactics.style === 'Defensive') return -6;
  return 0;
}

function avgSquad(team) {
  return team.squad.reduce((a, p) => a + p.rating, 0) / team.squad.length;
}

function simulateMatch(home, away, isUserMatch = false) {
  const h = findTeam(home);
  const a = findTeam(away);
  const hPow = h.strength + avgSquad(h) * 0.35 + (isUserMatch && home === app.userClub.name ? styleMod() : 0);
  const aPow = a.strength + avgSquad(a) * 0.35 + (isUserMatch && away === app.userClub.name ? styleMod() : 0);
  const homeGoals = clamp(Math.round((Math.random() * 2.2) + (hPow - aPow) / 30), 0, 6);
  const awayGoals = clamp(Math.round((Math.random() * 2.0) + (aPow - hPow) / 30), 0, 6);
  return [homeGoals, awayGoals];
}

function findTeam(club) {
  for (const l of Object.values(app.leagues)) {
    const t = l.find((x) => x.club === club);
    if (t) return t;
  }
}

function recordResult(teamA, teamB, ga, gb) {
  teamA.p++; teamB.p++;
  teamA.gf += ga; teamA.ga += gb; teamA.gd = teamA.gf - teamA.ga;
  teamB.gf += gb; teamB.ga += ga; teamB.gd = teamB.gf - teamB.ga;
  if (ga > gb) { teamA.w++; teamA.pts += 3; teamB.l++; }
  else if (ga < gb) { teamB.w++; teamB.pts += 3; teamA.l++; }
  else { teamA.d++; teamB.d++; teamA.pts++; teamB.pts++; }
}

function simulateWeek(skipUserFixture = true) {
  for (const [league, rounds] of Object.entries(app.fixtures)) {
    const round = rounds[app.week - 1];
    if (!round) continue;
    round.forEach((m) => {
      if (m.played) return;
      const involvesUser = (m.home === app.userClub.name || m.away === app.userClub.name) && league === app.userClub.league;
      if (skipUserFixture && involvesUser) return;
      const [hg, ag] = simulateMatch(m.home, m.away, involvesUser);
      const home = findTeam(m.home);
      const away = findTeam(m.away);
      recordResult(home, away, hg, ag);
      m.played = true;
      if (involvesUser) {
        handleUserOutcome(hg, ag, m.home === app.userClub.name);
        app.logs.unshift(`Auto-sim: ${m.home} ${hg}-${ag} ${m.away}`);
      }
    });
  }
  applyFinanceTick();
  if (allPlayedForWeek(app.week)) {
    app.week++;
    if (app.week > app.fixtures[app.userClub.league].length) endSeason();
  }
  refresh();
}

function allPlayedForWeek(week) {
  return Object.keys(app.fixtures).every((l) => (app.fixtures[l][week - 1] || []).every((m) => m.played));
}

function handleUserOutcome(hg, ag, userHome) {
  const gs = userHome ? hg : ag;
  const gc = userHome ? ag : hg;
  if (gs > gc) { app.finances.fans = clamp(app.finances.fans + 2, 0, 100); app.finances.board = clamp(app.finances.board + 2, 0, 100); applyFinanceTick(0.5); }
  else if (gs === gc) { app.finances.fans = clamp(app.finances.fans + 0, 0, 100); }
  else { app.finances.fans = clamp(app.finances.fans - 2, 0, 100); app.finances.board = clamp(app.finances.board - 2, 0, 100); }
}

function endSeason() {
  const table = [...app.leagues[app.userClub.league]].sort((a, b) => b.pts - a.pts || b.gd - a.gd);
  const pos = table.findIndex((t) => t.club === app.userClub.name) + 1;
  const bonus = pos === 1 ? 25 : pos <= 4 ? 14 : pos <= 7 ? 7 : 2;
  app.finances.budget += bonus;
  app.finances.board = clamp(app.finances.board + (pos <= 4 ? 8 : -5), 0, 100);
  app.logs.unshift(`Season ${app.season} complete. Finished #${pos}. Prize money £${bonus}m.`);

  app.season++;
  app.week = 1;
  for (const [league, teams] of Object.entries(app.leagues)) {
    teams.forEach((t) => { t.p = t.w = t.d = t.l = t.gf = t.ga = t.gd = t.pts = 0; t.strength = clamp(t.strength + rand(7) - 3, 50, 95); });
    app.fixtures[league] = createRoundRobin(LEAGUES[league]);
  }
  refillMarket();
}

function playUserMatch() {
  const fx = getThisWeekFixture();
  if (!fx || fx.played) return;

  const dialog = document.getElementById('matchDialog');
  dialog.showModal();
  document.getElementById('closeMatch').classList.add('hidden');
  document.getElementById('matchTitle').textContent = `${fx.home} vs ${fx.away}`;
  document.getElementById('homeScore').textContent = '0';
  document.getElementById('awayScore').textContent = '0';
  document.getElementById('minute').textContent = '0';
  document.getElementById('liveStyle').textContent = app.tactics.style;
  document.getElementById('commentary').textContent = 'Kick-off!';

  const state = {
    minute: 0, home: 0, away: 0, speed: 1, ended: false,
    ball: { x: 320, y: 180, vx: 2, vy: 1.6 }
  };

  const canvas = document.getElementById('pitch');
  const ctx = canvas.getContext('2d');

  const tick = () => {
    if (state.ended) return;
    for (let s = 0; s < state.speed; s++) {
      state.minute++;
      if (Math.random() < 0.09) {
        const attackHome = Math.random() < (fx.home === app.userClub.name ? 0.52 + styleMod() / 100 : 0.48 - styleMod() / 100);
        const prob = attackHome ? 0.22 : 0.2;
        if (Math.random() < prob) {
          if (attackHome) state.home++; else state.away++;
          logComment(`${state.minute}' GOAL! ${attackHome ? fx.home : fx.away} strike!`);
        } else {
          logComment(`${state.minute}' Big chance missed by ${attackHome ? fx.home : fx.away}.`);
        }
      }
      if (state.minute >= 90) {
        finish();
        break;
      }
      animateBall(state.ball, canvas);
    }
    drawPitch(ctx, state);
    document.getElementById('minute').textContent = state.minute;
    document.getElementById('homeScore').textContent = state.home;
    document.getElementById('awayScore').textContent = state.away;
  };

  const timer = setInterval(tick, 250);

  function finish() {
    state.ended = true;
    clearInterval(timer);
    const home = findTeam(fx.home);
    const away = findTeam(fx.away);
    recordResult(home, away, state.home, state.away);
    fx.played = true;
    handleUserOutcome(state.home, state.away, fx.home === app.userClub.name);
    app.logs.unshift(`Played: ${fx.home} ${state.home}-${state.away} ${fx.away}`);
    simulateWeek(true);
    document.getElementById('closeMatch').classList.remove('hidden');
  }

  document.querySelectorAll('[data-speed]').forEach((btn) => btn.onclick = () => state.speed = +btn.dataset.speed);
  document.getElementById('mentalityBtn').onclick = () => {
    app.tactics.style = app.tactics.style === 'Attacking' ? 'Balanced' : app.tactics.style === 'Balanced' ? 'Defensive' : 'Attacking';
    document.getElementById('liveStyle').textContent = app.tactics.style;
    logComment(`You switch to ${app.tactics.style} mentality.`);
  };
  document.getElementById('instantBtn').onclick = () => {
    const [hg, ag] = simulateMatch(fx.home, fx.away, true);
    state.home = hg; state.away = ag; state.minute = 90;
    finish();
  };
  document.getElementById('closeMatch').onclick = () => dialog.close();

  function logComment(line) {
    const c = document.getElementById('commentary');
    c.textContent = `${line}\n${c.textContent}`.slice(0, 1200);
  }
}

function animateBall(ball, canvas) {
  ball.x += ball.vx + (Math.random() - 0.5) * 2;
  ball.y += ball.vy + (Math.random() - 0.5) * 2;
  if (ball.x < 15 || ball.x > canvas.width - 15) ball.vx *= -1;
  if (ball.y < 15 || ball.y > canvas.height - 15) ball.vy *= -1;
}

function drawPitch(ctx, st) {
  ctx.fillStyle = '#2f8437'; ctx.fillRect(0, 0, 640, 360);
  ctx.strokeStyle = '#d9f7d6'; ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 620, 340);
  ctx.beginPath(); ctx.moveTo(320, 10); ctx.lineTo(320, 350); ctx.stroke();
  ctx.beginPath(); ctx.arc(320, 180, 44, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = '#1426c9';
    ctx.fillRect(80 + i * 28, 70 + ((i % 3) * 60), 8, 8);
    ctx.fillStyle = '#ce2222';
    ctx.fillRect(550 - i * 28, 70 + ((i % 3) * 60), 8, 8);
  }
  ctx.fillStyle = '#fff2a8';
  ctx.fillRect(st.ball.x, st.ball.y, 6, 6);
}

function bindTabs() {
  document.querySelectorAll('.tabs button').forEach((btn) => btn.addEventListener('click', () => {
    app.selectedTab = btn.dataset.tab;
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tabContent').forEach((s) => s.classList.add('hidden'));
    document.getElementById(app.selectedTab).classList.remove('hidden');
    refreshTab();
  }));
}

function refreshTab() {
  if (!app.userClub) return;
  if (app.selectedTab === 'dashboard') renderDashboard();
  if (app.selectedTab === 'tactics') renderTactics();
  if (app.selectedTab === 'transfers') renderTransfers();
  if (app.selectedTab === 'finances') renderFinances();
  if (app.selectedTab === 'stadium') renderStadium();
  if (app.selectedTab === 'league') renderLeague();
}

function toast(msg) {
  app.logs.unshift(`⚠ ${msg}`);
  refreshTab();
}

function refresh() {
  refreshHud();
  refreshTab();
}

function init() {
  buildLeagues();
  refillMarket();
  buildClubSelect();
  bindTabs();
}

init();
