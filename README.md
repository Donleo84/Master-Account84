# ⚽ RETRO GAFFER

**Football Management Revival — Premier Manager Soul · Modern Craft · Serious Depth**

A deeply playable retro football management game inspired by the classic titles of the late 1990s and early 2000s (Premier Manager, LMA Manager, Championship Manager). Built for modern browsers with a pixel-art retro aesthetic.

---

## Features

### Leagues & Clubs
- **7 leagues**: Premier League, Championship, La Liga, Serie A, Bundesliga, Ligue 1, Scottish Premier
- **100+ clubs** with real-world-inspired budgets, stadiums, and objectives
- **Named players** with full attribute sets (PAC, SHO, PAS, DEF, PHY, GKP)
- Player morale, fitness, form, injury tracking, and contract years

### Management Systems
- **Squad Management** — sortable player table, position filter, XI selection
- **Tactics** — 7 formations (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 4-5-1, 5-3-2, 3-4-3), style sliders, mentality
- **Scouting Market** — 20+ players per refresh, scout level affects quality
- **Transfers** — buy, sell, negotiation, incoming bid handling
- **Finances** — weekly cash flow, matchday revenue, wage bill, prize money
- **Stadium** — expand capacity, upgrade Training/Youth/Scouting/Medical (5 levels each)

### Match Experience
- **Live canvas match engine** — pixel pitch with coloured player dots in formation
- **Event-driven simulation** — goals, saves, shots, corners, fouls, cards, injuries
- **Rich commentary** — 60+ commentary lines with player name substitution
- **Speed control** — 1x, 2x, 5x, 10x or instant result
- **Live tactical changes** — cycle style mid-match, pause anytime
- **Live match stats** — possession, shots on target, corners, cards

### Season Loop
- Full league season (38 rounds Premier League / Championship, 34 Bundesliga & Ligue 1)
- Round-robin fixture generator — home and away for every team
- League table with form guide, promotion/relegation zones
- End-of-season review with prize money, stats, and next season setup
- Multi-season progression — player development, squad evolution, AI strength changes

### Board & Progression
- Board confidence and fan confidence meters
- Board objective (Title / Top 4 / Survival / Promotion etc.)
- Sack warning after 3 consecutive losses
- Weekly inbox messages — results, warnings, transfer news

### Player Development
- Age curves — peak at 24-28, natural decline after 30
- Training ground level affects development speed
- Youth academy breakthrough events
- Injury recovery affected by medical facility level

### Save / Load
- 2 save slots (localStorage)
- Auto-tracking of match history, inbox, squad state

---

## Getting Started

### Option 1: Open directly
```bash
open index.html
# or double-click index.html in your file explorer
```

### Option 2: Local server (recommended to avoid browser restrictions)
```bash
# Python
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```
Then visit: **http://localhost:8000**

---

## How to Play

1. **NEW CAREER** → Enter your manager name + choose difficulty
2. **Filter leagues** → Browse clubs → Click to see club preview
3. **START CAREER** → Game begins with transfer window open
4. **SQUAD tab** → Review your players, set your starting XI
5. **TACTICS tab** → Choose formation, style, and sliders
6. **SCOUTING tab** → Buy players from the market
7. **DASHBOARD** → Play next match or sim the week
8. **MATCH** → Watch live, adjust mentality, control speed
9. **LEAGUE / FIXTURES** → Track your progress
10. **STADIUM** → Expand and upgrade facilities
11. Repeat for 38 rounds → End-of-season review → Next season

---

## Architecture

```
retro-gaffer/
├── index.html      # Game HTML structure (screens, dialogs)
├── styles.css      # Complete retro dark styling (~780 lines)
├── data.js         # Game data: 100+ clubs, player name pools,
│                   # formations, commentary, generators (~490 lines)
└── app.js          # Complete game engine (~2,700 lines):
                    # ├── Game state (G object)
                    # ├── Screen/tab management
                    # ├── All UI renderers
                    # ├── Match simulation engine
                    # ├── Canvas renderer
                    # ├── Season/week management
                    # ├── Transfer/finance systems
                    # ├── Player development
                    # └── Save/load (localStorage)
```

No build step required. Pure HTML + CSS + vanilla JavaScript.

---

## Post-MVP Roadmap

### Near-term
- [ ] Cup competitions (FA Cup, domestic cups)
- [ ] European competition qualification and rounds
- [ ] Staff hiring (assistant manager, scouts, physio)
- [ ] Richer transfer negotiations (counter-offers, loan system)
- [ ] Player contract renewal system
- [ ] Substitutions during live match

### Medium-term
- [ ] Audio — crowd, commentary stings, goal celebrations
- [ ] Deeper youth academy — track prospects over years
- [ ] Manager history and achievements screen
- [ ] Season summary stats cards (shareable screenshots)
- [ ] Promotion/relegation between tiers

### Long-term
- [ ] Mod support — custom databases, kit colours, league packs
- [ ] Online leaderboard / challenge modes
- [ ] Mobile-friendly layout
- [ ] Controller/keyboard navigation

---

## Design Principles

- **Retro soul** — CRT scanlines, chunky panels, monospace fonts, limited palette
- **Modern usability** — sortable tables, tooltips, autosave, responsive layout
- **Addictive loop** — tight weekly cycle, constant inbox feedback, visible progress
- **Tactically meaningful** — formation, style, mentality and sliders all affect match outcome
- **Emergent stories** — miracle wins, injury crises, youth breakthroughs, title charges

---

*All club names and player names are fictional inspirations only. No copyrighted assets used.*
