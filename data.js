'use strict';
// ============================================================
// RETRO GAFFER — Data Layer
// All game data: player names, clubs, leagues, formations
// ============================================================

// ---- PLAYER NAME POOLS BY NATIONALITY ----
const NAMES = {
  en: {
    first: ['James','Oliver','Harry','Jack','George','Charlie','Noah','Liam','Ethan','Joshua','Thomas','Lucas','Mason','Logan','Alfie','Freddie','Archie','Edward','Theo','Max','Sam','Leo','Adam','Ben','Dylan','Connor','Ryan','Kyle','Callum','Lewis','Scott','Aaron','Jamie','Luke','Nathan','Reece','Jordan','Ashley','Danny','Marc'],
    last:  ['Smith','Jones','Williams','Taylor','Brown','Davies','Wilson','Evans','Thomas','Roberts','Johnson','White','Walker','Hall','Allen','Wright','Green','Baker','Clarke','Wood','Hill','Harris','Turner','Parker','Cook','Morris','Ward','Bennett','Gray','Price','Hughes','Morgan','Ross','Murphy','Bell','Bailey','Cooper','Reed','Kelly','Shaw']
  },
  es: {
    first: ['Carlos','Luis','Diego','Pablo','Miguel','Alejandro','Ivan','Jordi','Marc','Xavi','Sergio','Fernando','Javi','Raul','Adrian','Antonio','Marcos','David','Jorge','Daniel','Alvaro','Rodrigo','Iker','Nacho','Asier','Mikel','Ander','Unai','Borja','Inaki','Oscar','Kike','Santi','Dani','Edu','Juanmi'],
    last:  ['García','López','Martínez','Rodríguez','González','Hernández','Pérez','Torres','Fernández','Jiménez','Sánchez','Díaz','Ruiz','Romero','Álvarez','Moreno','Navarro','Gutiérrez','Molina','Iglesias','Castillo','Ramos','Ortega','Santos','Cabrera','Delgado','Vega','Herrera','Castro','Suárez']
  },
  it: {
    first: ['Marco','Luca','Andrea','Matteo','Lorenzo','Davide','Simone','Alessandro','Emanuele','Paolo','Riccardo','Stefano','Giuseppe','Federico','Nicolo','Giacomo','Roberto','Cristiano','Antonio','Mario','Francesco','Giovanni','Leonardo','Edoardo','Filippo'],
    last:  ['Rossi','Ferrari','Bianchi','Romano','Costa','Conti','Esposito','Ricci','Gallo','Bruno','De Luca','Greco','Lombardi','Barbieri','Villa','Leone','Ferri','Ruggiero','Rizzo','Farina','Pellegrini','Valentini','Galli','Martini','Rinaldi']
  },
  de: {
    first: ['Thomas','Stefan','Michael','Kevin','Lukas','Felix','Niklas','Florian','Julian','Tobias','Markus','Jonas','Kai','Marvin','Tim','Sven','Max','Sebastian','Leon','Timo','Manuel','Levin','Robin','Fabian','Nils','Marcel','Lars'],
    last:  ['Müller','Schmidt','Schneider','Fischer','Weber','Wagner','Becker','Schulz','Hoffmann','Koch','Richter','Bauer','Klein','Wolf','Schröder','Neuer','Reus','Götze','Hummels','Kroos','Werner','Gnabry','Havertz','Kimmich','Wirtz']
  },
  fr: {
    first: ['Pierre','Jean','Antoine','Hugo','Nicolas','Theo','Thomas','Lucas','Adrien','Kylian','Rayan','Moussa','Ibrahima','Paul','Guillaume','Clement','Alexis','Ousmane','Hakim','Youssef','Nabil','Karim','Benzema','Olivier','Kingsley','William','Tanguy','Aurelien'],
    last:  ['Martin','Bernard','Dubois','Thomas','Robert','Richard','Simon','Laurent','Leroy','Petit','Dupont','Moreau','Girard','Andre','Lefebvre','François','Blanc','Fontaine','Lacazette','Pavard','Tchouameni','Camavinga','Griezmann','Mbappe','Dembele','Coman']
  },
  br: {
    first: ['Gabriel','Rafael','Lucas','Matheus','Felipe','Gustavo','Rodrigo','Douglas','Thiago','Willian','Vinicius','Endrick','Richarlison','Roberto','Allan','Caio','Bruno','Marcelo','Casemiro','Renan','Emerson','Danilo','Eder','Everton','Malcom','Firmino'],
    last:  ['Silva','Santos','Oliveira','Souza','Lima','Costa','Ferreira','Rodrigues','Alves','Nascimento','Gomes','Pereira','Barbosa','Carvalho','Freitas','Ribeiro','Neto','Júnior','Ramos','Leite','Fernandes','Magalhaes','Cavalcanti','Teixeira','Mendes']
  },
  ar: {
    first: ['Lionel','Angel','Paulo','Nicolas','Roberto','Esteban','Rodrigo','Marcelo','Leonardo','Mauro','Sergio','Emiliano','Exequiel','Cristian','German','Julian','Leandro','Gonzalo','Erik','Lisandro','Nahuel','Marcos','Milton','Franco'],
    last:  ['Messi','Di Maria','Dybala','Romero','Alvarez','Mac Allister','Martinez','Molina','Montiel','Tagliafico','De Paul','Paredes','Gomez','Fernandez','Acuna','Lautaro','Correa','Palacios','Simeone','Guido','Zarate','Herrera','Suarez','Medina']
  },
  nl: {
    first: ['Stefan','Kevin','Wesley','Virgil','Frenkie','Ryan','Davy','Nathan','Quincy','Donny','Matthijs','Jurgen','Cody','Xavi','Brian','Denzel','Georginio','Davy','Guus','Luuk'],
    last:  ['de Jong','van Dijk','Depay','Wijnaldum','Robben','Sneijder','van Nistelrooy','Huntelaar','van Persie','Kuyt','Arjen','Klaassen','Blind','Strootman','Propper','Ake','Dumfries','Gakpo','Frimpong','Malen']
  },
  pt: {
    first: ['Cristiano','Bruno','Bernardo','Joao','Diogo','Rafael','Goncalo','Rui','Nuno','Ruben','Andre','Pedro','Vitinha','Matheus','Otavio','Ricardo','Luis','Manuel','Tiago','Helder'],
    last:  ['Ronaldo','Fernandes','Silva','Felix','Costa','Leao','Cancelo','Dias','Guerreiro','Carvalho','Neves','Trincao','Jota','Ramos','Neto','Semedo','Pepe','Moutinho','Danilo','Pereira']
  },
  af: {
    first: ['Sadio','Mohamed','Didier','Yaya','Samuel','Riyad','Islam','Sofiane','Achraf','Hakim','Edouard','Nicolas','Wilfried','Mamadou','Gervinho','Cheikhou','Idrissa','Saliou','Ismaila','Bouna'],
    last:  ['Mane','Salah','Drogba','Toure','Eto\'o','Mahrez','Slimani','Feghouli','Hakimi','Ziyech','Mendy','Pepe','Zaha','Sakho','Kouyate','Gueye','Sarr','Cisse','Diallo','Traore']
  }
};

// ---- FORMATIONS: [GK,DEF,DEF,DEF,DEF,MID,MID,MID,MID,FWD,FWD] - positions as x,y 0-1 ----
// x = 0 (near own goal) to 1 (near opponent goal)
// y = 0 (top) to 1 (bottom)
const FORMATIONS = {
  '4-4-2': {
    home: [[0.05,0.5],[0.22,0.15],[0.22,0.38],[0.22,0.62],[0.22,0.85],[0.48,0.1],[0.48,0.37],[0.48,0.63],[0.48,0.9],[0.74,0.35],[0.74,0.65]],
    roles: ['GK','RB','CB','CB','LB','RM','CM','CM','LM','ST','ST']
  },
  '4-3-3': {
    home: [[0.05,0.5],[0.22,0.15],[0.22,0.38],[0.22,0.62],[0.22,0.85],[0.45,0.2],[0.45,0.5],[0.45,0.8],[0.72,0.15],[0.72,0.5],[0.72,0.85]],
    roles: ['GK','RB','CB','CB','LB','CM','CDM','CM','RW','CF','LW']
  },
  '4-2-3-1': {
    home: [[0.05,0.5],[0.22,0.15],[0.22,0.38],[0.22,0.62],[0.22,0.85],[0.4,0.35],[0.4,0.65],[0.58,0.15],[0.58,0.5],[0.58,0.85],[0.78,0.5]],
    roles: ['GK','RB','CB','CB','LB','CDM','CDM','RAM','CAM','LAM','ST']
  },
  '3-5-2': {
    home: [[0.05,0.5],[0.22,0.25],[0.22,0.5],[0.22,0.75],[0.42,0.1],[0.42,0.33],[0.42,0.5],[0.42,0.67],[0.42,0.9],[0.74,0.35],[0.74,0.65]],
    roles: ['GK','CB','CB','CB','RWB','CM','CDM','CM','LWB','ST','ST']
  },
  '4-5-1': {
    home: [[0.05,0.5],[0.22,0.15],[0.22,0.38],[0.22,0.62],[0.22,0.85],[0.45,0.1],[0.45,0.3],[0.45,0.5],[0.45,0.7],[0.45,0.9],[0.76,0.5]],
    roles: ['GK','RB','CB','CB','LB','RM','CM','CM','CM','LM','ST']
  },
  '5-3-2': {
    home: [[0.05,0.5],[0.2,0.1],[0.2,0.3],[0.2,0.5],[0.2,0.7],[0.2,0.9],[0.48,0.25],[0.48,0.5],[0.48,0.75],[0.74,0.35],[0.74,0.65]],
    roles: ['GK','RWB','CB','CB','CB','LWB','CM','CM','CM','ST','ST']
  },
  '3-4-3': {
    home: [[0.05,0.5],[0.22,0.25],[0.22,0.5],[0.22,0.75],[0.42,0.15],[0.42,0.4],[0.42,0.6],[0.42,0.85],[0.72,0.2],[0.72,0.5],[0.72,0.8]],
    roles: ['GK','CB','CB','CB','RWB','CM','CM','LWB','RW','CF','LW']
  }
};

// ---- LEAGUE CONFIG ----
const LEAGUE_CONFIG = [
  { id: 'premier-league',  name: 'Premier League', country: 'England', tier: 1, promSpots: 0, relSpots: 3, prize1: 160, prize4: 90, prize10: 55, prize20: 30 },
  { id: 'championship',    name: 'Championship',   country: 'England', tier: 2, promSpots: 2, relSpots: 3, prize1: 18, prize4: 12, prize10: 8, prize20: 4, playoff: true },
  { id: 'la-liga',         name: 'La Liga',        country: 'Spain',   tier: 1, promSpots: 0, relSpots: 3, prize1: 55, prize4: 35, prize10: 22, prize20: 10 },
  { id: 'serie-a',         name: 'Serie A',        country: 'Italy',   tier: 1, promSpots: 0, relSpots: 3, prize1: 50, prize4: 32, prize10: 20, prize20: 10 },
  { id: 'bundesliga',      name: 'Bundesliga',     country: 'Germany', tier: 1, promSpots: 0, relSpots: 3, prize1: 48, prize4: 30, prize10: 18, prize20: 9, teamCount: 18 },
  { id: 'ligue-1',         name: 'Ligue 1',        country: 'France',  tier: 1, promSpots: 0, relSpots: 3, prize1: 42, prize4: 26, prize10: 14, prize20: 7, teamCount: 18 },
  { id: 'scottish-prem',   name: 'Scottish Prem',  country: 'Scotland',tier: 1, promSpots: 0, relSpots: 3, prize1: 12, prize4: 7, prize10: 4, prize20: 2, teamCount: 12 }
];

// ---- CLUBS DATA ----
// strength: 50–95 (overall team quality, affects match AI and player generation)
// budget: transfer budget in £m
// wages: weekly wage bill in £m
// cap: stadium capacity
// nats: nationality pool for player generation (first element is dominant)
const CLUBS = [
  // PREMIER LEAGUE
  { name:'Arsenal',            league:'premier-league', short:'ARS', kitH:'#EF0107', kitA:'#FFD700', stadium:'Emirates Stadium',       cap:60704, budget:120, wages:5.2, strength:87, obj:'Top 4',    patience:'Medium', nats:['en','br','fr','pt','es'] },
  { name:'Chelsea',            league:'premier-league', short:'CHE', kitH:'#034694', kitA:'#FFD700', stadium:'Stamford Bridge',         cap:41841, budget:150, wages:6.1, strength:82, obj:'Top 4',    patience:'Low',    nats:['en','es','fr','br','de'] },
  { name:'Liverpool',          league:'premier-league', short:'LIV', kitH:'#C8102E', kitA:'#F6EB61', stadium:'Anfield',                  cap:61276, budget:110, wages:5.5, strength:88, obj:'Title',    patience:'Medium', nats:['en','nl','br','es','af'] },
  { name:'Manchester City',    league:'premier-league', short:'MCI', kitH:'#6CABDD', kitA:'#FFFFFF', stadium:'Etihad Stadium',           cap:53400, budget:160, wages:7.0, strength:93, obj:'Title',    patience:'Low',    nats:['en','es','br','de','pt'] },
  { name:'Manchester United',  league:'premier-league', short:'MUN', kitH:'#DA291C', kitA:'#FFE500', stadium:'Old Trafford',             cap:74140, budget:100, wages:5.8, strength:80, obj:'Top 4',    patience:'Low',    nats:['en','es','br','ar','pt'] },
  { name:'Tottenham',          league:'premier-league', short:'TOT', kitH:'#FFFFFF', kitA:'#132257', stadium:'Tottenham Hotspur Stad.', cap:62850, budget:80,  wages:4.8, strength:76, obj:'Top 6',    patience:'Medium', nats:['en','es','br','kr','fr'] },
  { name:'Newcastle',          league:'premier-league', short:'NEW', kitH:'#241F20', kitA:'#FFFFFF', stadium:'St. James\' Park',         cap:52305, budget:95,  wages:4.4, strength:77, obj:'Top 6',    patience:'Medium', nats:['en','br','fr','es','af'] },
  { name:'Aston Villa',        league:'premier-league', short:'AVL', kitH:'#95BFE5', kitA:'#670E36', stadium:'Villa Park',               cap:42785, budget:65,  wages:3.8, strength:74, obj:'Top 8',    patience:'Medium', nats:['en','es','br','fr','ar'] },
  { name:'Brighton',           league:'premier-league', short:'BRI', kitH:'#0057B8', kitA:'#FFFFFF', stadium:'Amex Stadium',             cap:31800, budget:55,  wages:3.2, strength:71, obj:'Top 8',    patience:'High',   nats:['en','br','fr','de','es'] },
  { name:'West Ham',           league:'premier-league', short:'WHU', kitH:'#7A263A', kitA:'#1BB1E7', stadium:'London Stadium',           cap:62500, budget:55,  wages:3.5, strength:70, obj:'Top 10',   patience:'Medium', nats:['en','br','es','af','fr'] },
  { name:'Everton',            league:'premier-league', short:'EVE', kitH:'#003399', kitA:'#FFFFFF', stadium:'Goodison Park',            cap:39414, budget:35,  wages:3.1, strength:62, obj:'Survival', patience:'Low',    nats:['en','br','af','es','fr'] },
  { name:'Fulham',             league:'premier-league', short:'FUL', kitH:'#FFFFFF', kitA:'#CC0000', stadium:'Craven Cottage',           cap:25700, budget:38,  wages:2.8, strength:64, obj:'Survival', patience:'High',   nats:['en','es','br','af','pt'] },
  { name:'Brentford',          league:'premier-league', short:'BRE', kitH:'#E30613', kitA:'#FFFFFF', stadium:'Gtech Community Stad.',   cap:17250, budget:32,  wages:2.5, strength:65, obj:'Survival', patience:'High',   nats:['en','de','da','no','nl'] },
  { name:'Crystal Palace',     league:'premier-league', short:'CRY', kitH:'#1B458F', kitA:'#A7A5A6', stadium:'Selhurst Park',            cap:25486, budget:35,  wages:2.7, strength:63, obj:'Survival', patience:'Medium', nats:['en','af','br','es','fr'] },
  { name:'Wolves',             league:'premier-league', short:'WOL', kitH:'#FDB913', kitA:'#231F20', stadium:'Molineux',                 cap:31750, budget:38,  wages:2.9, strength:65, obj:'Survival', patience:'Medium', nats:['en','pt','br','es','af'] },
  { name:'Nottm Forest',       league:'premier-league', short:'NFO', kitH:'#DD0000', kitA:'#FFFFFF', stadium:'City Ground',              cap:30445, budget:40,  wages:3.0, strength:63, obj:'Survival', patience:'Medium', nats:['en','br','af','fr','es'] },
  { name:'Bournemouth',        league:'premier-league', short:'BOU', kitH:'#DA291C', kitA:'#000000', stadium:'Vitality Stadium',         cap:11307, budget:28,  wages:2.3, strength:60, obj:'Survival', patience:'High',   nats:['en','br','af','es','fr'] },
  { name:'Luton Town',         league:'premier-league', short:'LUT', kitH:'#F78F1E', kitA:'#FFFFFF', stadium:'Kenilworth Road',          cap:10356, budget:18,  wages:1.8, strength:55, obj:'Survival', patience:'High',   nats:['en','af','es','br','fr'] },
  { name:'Burnley',            league:'premier-league', short:'BUR', kitH:'#6C1D45', kitA:'#99D6EA', stadium:'Turf Moor',                cap:21944, budget:20,  wages:1.9, strength:54, obj:'Survival', patience:'High',   nats:['en','br','af','es','fr'] },
  { name:'Sheffield United',   league:'premier-league', short:'SHU', kitH:'#EE2737', kitA:'#000000', stadium:'Bramall Lane',             cap:32050, budget:22,  wages:2.0, strength:53, obj:'Survival', patience:'High',   nats:['en','af','es','br','fr'] },

  // CHAMPIONSHIP
  { name:'Leeds United',       league:'championship',   short:'LEE', kitH:'#FFFFFF', kitA:'#FFD700', stadium:'Elland Road',              cap:37890, budget:22,  wages:2.5, strength:67, obj:'Promotion', patience:'Low',   nats:['en','br','es','af','fr'] },
  { name:'Leicester City',     league:'championship',   short:'LEI', kitH:'#003090', kitA:'#FFE500', stadium:'King Power Stadium',       cap:32312, budget:28,  wages:2.8, strength:70, obj:'Promotion', patience:'Medium',nats:['en','af','es','br','fr'] },
  { name:'Ipswich Town',       league:'championship',   short:'IPS', kitH:'#0044A0', kitA:'#FFFFFF', stadium:'Portman Road',             cap:29500, budget:15,  wages:1.9, strength:64, obj:'Promotion', patience:'High',  nats:['en','nl','br','de','es'] },
  { name:'Southampton',        league:'championship',   short:'SOU', kitH:'#D71920', kitA:'#FFFFFF', stadium:'St. Mary\'s Stadium',      cap:32384, budget:18,  wages:2.1, strength:63, obj:'Promotion', patience:'Medium',nats:['en','br','af','es','fr'] },
  { name:'Middlesbrough',      league:'championship',   short:'MID', kitH:'#E21E24', kitA:'#FFFFFF', stadium:'Riverside Stadium',        cap:34742, budget:12,  wages:1.7, strength:60, obj:'Top 6',    patience:'Medium',nats:['en','br','af','es','fr'] },
  { name:'Sunderland',         league:'championship',   short:'SUN', kitH:'#EB172B', kitA:'#000000', stadium:'Stadium of Light',         cap:49000, budget:10,  wages:1.5, strength:58, obj:'Top 6',    patience:'Medium',nats:['en','af','br','es','fr'] },
  { name:'Norwich City',       league:'championship',   short:'NOR', kitH:'#00A650', kitA:'#FFF200', stadium:'Carrow Road',              cap:27359, budget:12,  wages:1.6, strength:61, obj:'Top 6',    patience:'High',  nats:['en','de','br','nl','es'] },
  { name:'Watford',            league:'championship',   short:'WAT', kitH:'#FBEE23', kitA:'#ED2127', stadium:'Vicarage Road',            cap:22200, budget:11,  wages:1.6, strength:59, obj:'Top 6',    patience:'Low',   nats:['en','es','it','br','af'] },
  { name:'QPR',                league:'championship',   short:'QPR', kitH:'#1D5BA4', kitA:'#FFFFFF', stadium:'Loftus Road',              cap:18360, budget:8,   wages:1.3, strength:55, obj:'Mid-table', patience:'Medium',nats:['en','br','af','es','fr'] },
  { name:'Swansea City',       league:'championship',   short:'SWA', kitH:'#FFFFFF', kitA:'#121212', stadium:'Swansea.com Stadium',      cap:20937, budget:8,   wages:1.2, strength:55, obj:'Mid-table', patience:'High',  nats:['en','es','br','af','fr'] },
  { name:'Plymouth Argyle',    league:'championship',   short:'PLY', kitH:'#007B5E', kitA:'#FFFFFF', stadium:'Home Park',                cap:17900, budget:6,   wages:1.0, strength:52, obj:'Mid-table', patience:'High',  nats:['en','br','af','es','fr'] },
  { name:'Bristol City',       league:'championship',   short:'BRS', kitH:'#E3001B', kitA:'#FFFFFF', stadium:'Ashton Gate',              cap:27000, budget:7,   wages:1.1, strength:53, obj:'Mid-table', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'Stoke City',         league:'championship',   short:'STK', kitH:'#E03A3E', kitA:'#FFFFFF', stadium:'bet365 Stadium',           cap:30089, budget:9,   wages:1.4, strength:56, obj:'Mid-table', patience:'Medium',nats:['en','es','af','br','nl'] },
  { name:'Hull City',          league:'championship',   short:'HUL', kitH:'#F5A12D', kitA:'#000000', stadium:'MKM Stadium',              cap:25400, budget:7,   wages:1.1, strength:54, obj:'Mid-table', patience:'High',  nats:['en','af','es','br','fr'] },
  { name:'Millwall',           league:'championship',   short:'MIL', kitH:'#001D5E', kitA:'#FFFFFF', stadium:'The Den',                  cap:20146, budget:7,   wages:1.1, strength:53, obj:'Mid-table', patience:'High',  nats:['en','af','es','br','fr'] },
  { name:'Cardiff City',       league:'championship',   short:'CAR', kitH:'#0070B5', kitA:'#C8102E', stadium:'Cardiff City Stadium',     cap:33280, budget:8,   wages:1.2, strength:54, obj:'Mid-table', patience:'Medium',nats:['en','es','af','br','fr'] },
  { name:'Coventry City',      league:'championship',   short:'COV', kitH:'#59CCEA', kitA:'#FFFFFF', stadium:'Coventry Building Soc. A.', cap:32609,budget:8,   wages:1.2, strength:57, obj:'Top 6',    patience:'High',  nats:['en','af','es','br','fr'] },
  { name:'Preston North End',  league:'championship',   short:'PRE', kitH:'#FFFFFF', kitA:'#000000', stadium:'Deepdale',                 cap:23404, budget:6,   wages:0.9, strength:52, obj:'Mid-table', patience:'High',  nats:['en','af','es','br','fr'] },
  { name:'Birmingham City',    league:'championship',   short:'BIR', kitH:'#0000FF', kitA:'#FFFFFF', stadium:'St Andrews',               cap:29409, budget:6,   wages:1.0, strength:51, obj:'Survival', patience:'Low',   nats:['en','af','es','br','fr'] },
  { name:'Blackburn Rovers',   league:'championship',   short:'BLA', kitH:'#1C2C5B', kitA:'#FFFFFF', stadium:'Ewood Park',               cap:31367, budget:7,   wages:1.1, strength:53, obj:'Mid-table', patience:'Medium',nats:['en','af','es','br','fr'] },

  // LA LIGA
  { name:'Real Madrid',        league:'la-liga',        short:'RMA', kitH:'#FFFFFF', kitA:'#000080', stadium:'Santiago Bernabeu',        cap:81044, budget:200, wages:9.5, strength:93, obj:'Title',    patience:'Low',   nats:['es','br','fr','pt','de'] },
  { name:'Barcelona',          league:'la-liga',        short:'BAR', kitH:'#A50021', kitA:'#FFD700', stadium:'Estadi Olímpic',           cap:55926, budget:140, wages:7.8, strength:86, obj:'Title',    patience:'Low',   nats:['es','br','fr','ar','de'] },
  { name:'Atletico Madrid',    league:'la-liga',        short:'ATL', kitH:'#CB3524', kitA:'#FFFFFF', stadium:'Cívitas Metropolitano',    cap:68456, budget:80,  wages:5.2, strength:83, obj:'Top 4',    patience:'Medium',nats:['es','ar','fr','br','pt'] },
  { name:'Athletic Bilbao',    league:'la-liga',        short:'ATH', kitH:'#EE2523', kitA:'#FFFFFF', stadium:'San Mamés',                cap:53289, budget:30,  wages:2.2, strength:71, obj:'Top 6',    patience:'High',  nats:['es'] },
  { name:'Real Sociedad',      league:'la-liga',        short:'RSO', kitH:'#FFFFFF', kitA:'#1F5AA3', stadium:'Reale Arena',              cap:39500, budget:28,  wages:2.1, strength:70, obj:'Top 6',    patience:'High',  nats:['es','fr','ar','br','pt'] },
  { name:'Real Betis',         league:'la-liga',        short:'BET', kitH:'#00954C', kitA:'#FFFFFF', stadium:'Estadio Benito Villamarín',cap:60721, budget:32,  wages:2.5, strength:70, obj:'Top 6',    patience:'Medium',nats:['es','br','ar','fr','pt'] },
  { name:'Sevilla',            league:'la-liga',        short:'SEV', kitH:'#FFFFFF', kitA:'#D82020', stadium:'Ramón Sánchez-Pizjuán',   cap:43883, budget:35,  wages:2.8, strength:72, obj:'Top 6',    patience:'Medium',nats:['es','br','ar','fr','af'] },
  { name:'Villarreal',         league:'la-liga',        short:'VIL', kitH:'#FFE000', kitA:'#1B5FA5', stadium:'Estadio de la Cerámica',  cap:23500, budget:30,  wages:2.3, strength:71, obj:'Top 8',    patience:'High',  nats:['es','br','ar','fr','nl'] },
  { name:'Valencia',           league:'la-liga',        short:'VAL', kitH:'#FFFFFF', kitA:'#FF7000', stadium:'Mestalla',                 cap:49430, budget:25,  wages:2.0, strength:66, obj:'Top 8',    patience:'Low',   nats:['es','br','ar','fr','pt'] },
  { name:'Girona',             league:'la-liga',        short:'GIR', kitH:'#CD1D26', kitA:'#FFFFFF', stadium:'Estadi Montilivi',         cap:13450, budget:22,  wages:1.8, strength:68, obj:'Top 8',    patience:'High',  nats:['es','br','ar','fr','en'] },
  { name:'Celta Vigo',         league:'la-liga',        short:'CEL', kitH:'#75AADB', kitA:'#FFFFFF', stadium:'Abanca-Balaídos',          cap:29000, budget:18,  wages:1.5, strength:62, obj:'Mid-table', patience:'Medium',nats:['es','br','ar','pt','af'] },
  { name:'Osasuna',            league:'la-liga',        short:'OSA', kitH:'#D3002B', kitA:'#1C4F8E', stadium:'El Sadar',                 cap:23576, budget:12,  wages:1.1, strength:60, obj:'Mid-table', patience:'High',  nats:['es','br','af','fr','ar'] },
  { name:'Getafe',             league:'la-liga',        short:'GET', kitH:'#006BB6', kitA:'#FFFFFF', stadium:'Coliseum Alfonso Pérez',   cap:17700, budget:10,  wages:1.0, strength:59, obj:'Survival', patience:'High',  nats:['es','br','ar','af','fr'] },
  { name:'Alaves',             league:'la-liga',        short:'ALA', kitH:'#1E50A2', kitA:'#FFFFFF', stadium:'Mendizorrotza',            cap:19840, budget:8,   wages:0.9, strength:56, obj:'Survival', patience:'High',  nats:['es','br','ar','af','fr'] },
  { name:'Rayo Vallecano',     league:'la-liga',        short:'RAY', kitH:'#FFFFFF', kitA:'#C50E2F', stadium:'Campo de Fútbol de Vallecas',cap:14708,budget:8,  wages:0.9, strength:57, obj:'Survival', patience:'High',  nats:['es','br','ar','fr','af'] },
  { name:'Mallorca',           league:'la-liga',        short:'MAL', kitH:'#CE1B2B', kitA:'#000000', stadium:'Visit Mallorca Estadi',    cap:23142, budget:9,   wages:1.0, strength:58, obj:'Survival', patience:'High',  nats:['es','br','ar','af','fr'] },
  { name:'Las Palmas',         league:'la-liga',        short:'LPA', kitH:'#FFE600', kitA:'#0000FF', stadium:'Gran Canaria',             cap:32392, budget:7,   wages:0.8, strength:55, obj:'Survival', patience:'High',  nats:['es','br','ar','af','fr'] },
  { name:'Cadiz',              league:'la-liga',        short:'CAD', kitH:'#F5D200', kitA:'#0046BE', stadium:'Nuevo Mirandilla',         cap:20700, budget:7,   wages:0.8, strength:53, obj:'Survival', patience:'High',  nats:['es','br','ar','af','fr'] },
  { name:'Granada',            league:'la-liga',        short:'GRN', kitH:'#D3002B', kitA:'#FFFFFF', stadium:'Nuevo Los Cármenes',       cap:22524, budget:8,   wages:0.9, strength:55, obj:'Survival', patience:'Medium',nats:['es','br','ar','af','fr'] },
  { name:'Almeria',            league:'la-liga',        short:'ALM', kitH:'#D20A0A', kitA:'#000000', stadium:'Power Horse Stadium',      cap:16135, budget:7,   wages:0.8, strength:52, obj:'Survival', patience:'High',  nats:['es','br','ar','af','fr'] },

  // SERIE A
  { name:'Inter Milan',        league:'serie-a',        short:'INT', kitH:'#010E80', kitA:'#000000', stadium:'Stadio San Siro',          cap:75923, budget:85,  wages:5.5, strength:88, obj:'Title',    patience:'Low',   nats:['it','ar','br','nl','de'] },
  { name:'AC Milan',           league:'serie-a',        short:'ACM', kitH:'#F0001C', kitA:'#000000', stadium:'Stadio San Siro',          cap:75923, budget:80,  wages:5.1, strength:84, obj:'Title',    patience:'Low',   nats:['it','fr','br','es','pt'] },
  { name:'Juventus',           league:'serie-a',        short:'JUV', kitH:'#000000', kitA:'#FFFFFF', stadium:'Allianz Stadium',          cap:41507, budget:75,  wages:5.8, strength:82, obj:'Title',    patience:'Low',   nats:['it','br','es','fr','ar'] },
  { name:'Napoli',             league:'serie-a',        short:'NAP', kitH:'#087EC2', kitA:'#FFFFFF', stadium:'Stadio Maradona',          cap:54726, budget:65,  wages:4.4, strength:82, obj:'Top 4',    patience:'Low',   nats:['it','br','ar','af','nl'] },
  { name:'Roma',               league:'serie-a',        short:'ROM', kitH:'#9B1D20', kitA:'#F5C600', stadium:'Stadio Olimpico',          cap:70634, budget:55,  wages:4.2, strength:79, obj:'Top 4',    patience:'Low',   nats:['it','ar','br','es','nl'] },
  { name:'Lazio',              league:'serie-a',        short:'LAZ', kitH:'#87D8F7', kitA:'#FFFFFF', stadium:'Stadio Olimpico',          cap:70634, budget:45,  wages:3.5, strength:76, obj:'Top 6',    patience:'Medium',nats:['it','br','ar','es','pt'] },
  { name:'Atalanta',           league:'serie-a',        short:'ATA', kitH:'#1C4E9A', kitA:'#000000', stadium:'Gewiss Stadium',           cap:24747, budget:42,  wages:3.2, strength:77, obj:'Top 6',    patience:'High',  nats:['it','br','es','af','nl'] },
  { name:'Fiorentina',         league:'serie-a',        short:'FIO', kitH:'#623082', kitA:'#FFFFFF', stadium:'Artemio Franchi',          cap:43147, budget:35,  wages:2.8, strength:73, obj:'Top 6',    patience:'Medium',nats:['it','ar','br','es','fr'] },
  { name:'Bologna',            league:'serie-a',        short:'BOL', kitH:'#1A1A1A', kitA:'#C30000', stadium:'Renato Dall\'Ara',         cap:38279, budget:28,  wages:2.2, strength:69, obj:'Top 8',    patience:'High',  nats:['it','br','es','ar','nl'] },
  { name:'Torino',             league:'serie-a',        short:'TOR', kitH:'#8B2346', kitA:'#FFFFFF', stadium:'Olimpico Grande Torino',   cap:28140, budget:22,  wages:1.9, strength:65, obj:'Top 10',   patience:'Medium',nats:['it','br','es','ar','af'] },
  { name:'Monza',              league:'serie-a',        short:'MON', kitH:'#FFFFFF', kitA:'#FF0000', stadium:'Stadio Brianteo',          cap:18568, budget:25,  wages:2.0, strength:64, obj:'Mid-table', patience:'High',  nats:['it','br','ar','es','pt'] },
  { name:'Udinese',            league:'serie-a',        short:'UDI', kitH:'#000000', kitA:'#FFFFFF', stadium:'Dacia Arena',              cap:25144, budget:15,  wages:1.5, strength:60, obj:'Mid-table', patience:'High',  nats:['it','ar','br','af','es'] },
  { name:'Empoli',             league:'serie-a',        short:'EMP', kitH:'#1D7DC1', kitA:'#FFFFFF', stadium:'Carlo Castellani',         cap:16284, budget:10,  wages:1.2, strength:56, obj:'Survival', patience:'High',  nats:['it','br','ar','es','af'] },
  { name:'Frosinone',          league:'serie-a',        short:'FRO', kitH:'#FFD700', kitA:'#0000FF', stadium:'Stadio Benito Stirpe',     cap:16227, budget:8,   wages:1.0, strength:52, obj:'Survival', patience:'High',  nats:['it','br','ar','es','af'] },
  { name:'Genoa',              league:'serie-a',        short:'GEN', kitH:'#C60C1C', kitA:'#0000FF', stadium:'Luigi Ferraris',           cap:36536, budget:12,  wages:1.3, strength:57, obj:'Survival', patience:'Medium',nats:['it','ar','br','es','af'] },
  { name:'Cagliari',           league:'serie-a',        short:'CAG', kitH:'#004A9C', kitA:'#FFFFFF', stadium:'Unipol Domus',             cap:16416, budget:8,   wages:0.9, strength:53, obj:'Survival', patience:'High',  nats:['it','ar','br','es','af'] },
  { name:'Salernitana',        league:'serie-a',        short:'SAL', kitH:'#6D1117', kitA:'#FFFFFF', stadium:'Arechi',                   cap:37245, budget:7,   wages:0.9, strength:51, obj:'Survival', patience:'High',  nats:['it','br','ar','es','af'] },
  { name:'Lecce',              league:'serie-a',        short:'LEC', kitH:'#FFD700', kitA:'#C20D2B', stadium:'Ettore Giardiniero',       cap:33876, budget:7,   wages:0.9, strength:51, obj:'Survival', patience:'High',  nats:['it','br','ar','es','af'] },
  { name:'Hellas Verona',      league:'serie-a',        short:'HEL', kitH:'#003399', kitA:'#F9D616', stadium:'Marcantonio Bentegodi',    cap:39211, budget:9,   wages:1.0, strength:54, obj:'Survival', patience:'Medium',nats:['it','br','ar','es','af'] },
  { name:'Sassuolo',           league:'serie-a',        short:'SAS', kitH:'#2FAB56', kitA:'#000000', stadium:'MAPEI Stadium',            cap:21584, budget:12,  wages:1.4, strength:61, obj:'Mid-table', patience:'High',  nats:['it','br','es','ar','af'] },

  // BUNDESLIGA
  { name:'Bayern Munich',      league:'bundesliga',     short:'BAY', kitH:'#DC052D', kitA:'#FFFFFF', stadium:'Allianz Arena',            cap:75024, budget:160, wages:8.5, strength:93, obj:'Title',    patience:'Low',   nats:['de','br','fr','es','pt'] },
  { name:'Borussia Dortmund',  league:'bundesliga',     short:'BVB', kitH:'#FDE100', kitA:'#000000', stadium:'Signal Iduna Park',        cap:81365, budget:80,  wages:5.5, strength:83, obj:'Top 4',    patience:'Medium',nats:['de','br','fr','es','nl'] },
  { name:'RB Leipzig',         league:'bundesliga',     short:'RBL', kitH:'#DD0741', kitA:'#FFFFFF', stadium:'Red Bull Arena',           cap:47069, budget:70,  wages:4.8, strength:81, obj:'Top 4',    patience:'Medium',nats:['de','at','fr','es','br'] },
  { name:'Bayer Leverkusen',   league:'bundesliga',     short:'B04', kitH:'#E32221', kitA:'#000000', stadium:'BayArena',                 cap:30210, budget:65,  wages:4.2, strength:83, obj:'Top 4',    patience:'Medium',nats:['de','fr','br','es','nl'] },
  { name:'Stuttgart',          league:'bundesliga',     short:'STG', kitH:'#FFFFFF', kitA:'#CC0000', stadium:'MHPArena',                 cap:60449, budget:38,  wages:2.8, strength:72, obj:'Top 6',    patience:'High',  nats:['de','fr','br','es','ja'] },
  { name:'Eintracht Frankfurt', league:'bundesliga',    short:'SGE', kitH:'#E2001A', kitA:'#000000', stadium:'Deutsche Bank Park',       cap:51500, budget:40,  wages:3.0, strength:73, obj:'Top 6',    patience:'Medium',nats:['de','fr','es','br','nl'] },
  { name:'Wolfsburg',          league:'bundesliga',     short:'WOB', kitH:'#65B32E', kitA:'#000000', stadium:'Volkswagen Arena',         cap:30000, budget:35,  wages:2.5, strength:68, obj:'Top 8',    patience:'High',  nats:['de','br','es','fr','nl'] },
  { name:'Gladbach',           league:'bundesliga',     short:'BMG', kitH:'#000000', kitA:'#FFFFFF', stadium:'Borussia-Park',            cap:54042, budget:32,  wages:2.3, strength:67, obj:'Top 8',    patience:'Medium',nats:['de','fr','br','es','nl'] },
  { name:'Freiburg',           league:'bundesliga',     short:'SCF', kitH:'#E2001A', kitA:'#000000', stadium:'Europa-Park Stadion',      cap:34700, budget:22,  wages:1.8, strength:68, obj:'Top 8',    patience:'High',  nats:['de','br','fr','at','nl'] },
  { name:'Werder Bremen',      league:'bundesliga',     short:'SVW', kitH:'#1D9053', kitA:'#FFFFFF', stadium:'Wohninvest Weserstadion',  cap:42100, budget:22,  wages:1.9, strength:65, obj:'Mid-table', patience:'High',  nats:['de','nl','br','fr','es'] },
  { name:'Hoffenheim',         league:'bundesliga',     short:'TSG', kitH:'#1C63B7', kitA:'#FFFFFF', stadium:'PreZero Arena',            cap:30150, budget:22,  wages:1.8, strength:64, obj:'Mid-table', patience:'High',  nats:['de','br','fr','es','nl'] },
  { name:'Augsburg',           league:'bundesliga',     short:'FCA', kitH:'#BA3733', kitA:'#007236', stadium:'WWK Arena',                cap:30660, budget:15,  wages:1.4, strength:60, obj:'Survival', patience:'High',  nats:['de','br','ko','fr','es'] },
  { name:'Union Berlin',       league:'bundesliga',     short:'FCU', kitH:'#E2001A', kitA:'#FFFFFF', stadium:'An der Alten Försterei',   cap:22012, budget:20,  wages:1.7, strength:64, obj:'Mid-table', patience:'High',  nats:['de','br','nl','fr','es'] },
  { name:'Mainz',              league:'bundesliga',     short:'M05', kitH:'#C3112D', kitA:'#FFFFFF', stadium:'MEWA Arena',               cap:33305, budget:15,  wages:1.4, strength:61, obj:'Mid-table', patience:'High',  nats:['de','br','af','fr','es'] },
  { name:'Bochum',             league:'bundesliga',     short:'VfL', kitH:'#005CA9', kitA:'#FFFFFF', stadium:'Vonovia Ruhrstadion',      cap:27599, budget:12,  wages:1.2, strength:56, obj:'Survival', patience:'High',  nats:['de','br','af','fr','es'] },
  { name:'Heidenheim',         league:'bundesliga',     short:'HDH', kitH:'#D3012E', kitA:'#FFFFFF', stadium:'Voith-Arena',              cap:15000, budget:10,  wages:1.0, strength:55, obj:'Survival', patience:'High',  nats:['de','br','af','fr','es'] },
  { name:'Darmstadt',          league:'bundesliga',     short:'SV9', kitH:'#006CB5', kitA:'#FFFFFF', stadium:'Merck-Stadion',            cap:17810, budget:8,   wages:0.9, strength:51, obj:'Survival', patience:'High',  nats:['de','br','af','fr','es'] },
  { name:'Cologne',            league:'bundesliga',     short:'KOE', kitH:'#FFFFFF', kitA:'#EF0000', stadium:'RheinEnergieStadion',      cap:49827, budget:18,  wages:1.6, strength:60, obj:'Survival', patience:'Medium',nats:['de','br','af','fr','es'] },

  // LIGUE 1
  { name:'PSG',                league:'ligue-1',        short:'PSG', kitH:'#004170', kitA:'#DA291C', stadium:'Parc des Princes',         cap:47929, budget:220, wages:12.5,strength:93, obj:'Title',    patience:'Low',   nats:['fr','br','es','pt','ar'] },
  { name:'Marseille',          league:'ligue-1',        short:'OM',  kitH:'#2FAEE0', kitA:'#FFFFFF', stadium:'Vélodrome',                cap:67394, budget:40,  wages:3.2, strength:72, obj:'Top 4',    patience:'Low',   nats:['fr','br','af','es','ar'] },
  { name:'Monaco',             league:'ligue-1',        short:'MON', kitH:'#ED1C24', kitA:'#FFFFFF', stadium:'Stade Louis II',           cap:18523, budget:55,  wages:3.8, strength:74, obj:'Top 4',    patience:'Low',   nats:['fr','br','es','ar','pt'] },
  { name:'Lille',              league:'ligue-1',        short:'LIL', kitH:'#E50000', kitA:'#FFFFFF', stadium:'Stade Pierre-Mauroy',      cap:50157, budget:30,  wages:2.5, strength:70, obj:'Top 4',    patience:'Medium',nats:['fr','br','af','es','pt'] },
  { name:'Lyon',               league:'ligue-1',        short:'OL',  kitH:'#FFFFFF', kitA:'#0047AB', stadium:'Groupama Stadium',         cap:59186, budget:35,  wages:2.8, strength:70, obj:'Top 4',    patience:'Low',   nats:['fr','br','af','es','ar'] },
  { name:'Rennes',             league:'ligue-1',        short:'REN', kitH:'#B2001C', kitA:'#000000', stadium:'Roazhon Park',             cap:29778, budget:25,  wages:2.2, strength:68, obj:'Top 6',    patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Nice',               league:'ligue-1',        short:'NCE', kitH:'#E00026', kitA:'#000000', stadium:'Allianz Riviera',          cap:35624, budget:22,  wages:2.0, strength:67, obj:'Top 6',    patience:'Medium',nats:['fr','br','af','es','ar'] },
  { name:'Lens',               league:'ligue-1',        short:'RCL', kitH:'#FFD700', kitA:'#C31319', stadium:'Stade Bollaert-Delelis',   cap:38223, budget:20,  wages:1.8, strength:68, obj:'Top 6',    patience:'High',  nats:['fr','br','af','es','pt'] },
  { name:'Nantes',             league:'ligue-1',        short:'FCN', kitH:'#F7A800', kitA:'#006B3C', stadium:'Stade de la Beaujoire',    cap:37473, budget:15,  wages:1.5, strength:62, obj:'Mid-table', patience:'Medium',nats:['fr','br','af','es','ar'] },
  { name:'Strasbourg',         league:'ligue-1',        short:'RCS', kitH:'#1B5EAC', kitA:'#FFFFFF', stadium:'Stade de la Meinau',       cap:29230, budget:12,  wages:1.3, strength:61, obj:'Mid-table', patience:'High',  nats:['fr','br','af','de','es'] },
  { name:'Reims',              league:'ligue-1',        short:'SDR', kitH:'#E30613', kitA:'#FFFFFF', stadium:'Stade Auguste-Delaune',    cap:20500, budget:10,  wages:1.1, strength:60, obj:'Mid-table', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Lorient',            league:'ligue-1',        short:'FCL', kitH:'#F4820C', kitA:'#000000', stadium:'Stade du Moustoir',        cap:18500, budget:8,   wages:1.0, strength:57, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Toulouse',           league:'ligue-1',        short:'TFC', kitH:'#702078', kitA:'#FFFFFF', stadium:'Stadium de Toulouse',      cap:35472, budget:9,   wages:1.0, strength:59, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Montpellier',        league:'ligue-1',        short:'MHC', kitH:'#0659A7', kitA:'#FFFFFF', stadium:'Stade de la Mosson',       cap:32900, budget:9,   wages:1.0, strength:58, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Clermont',           league:'ligue-1',        short:'CFC', kitH:'#E00020', kitA:'#FFFFFF', stadium:'Gabriel Montpied',         cap:11980, budget:6,   wages:0.8, strength:53, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Metz',               league:'ligue-1',        short:'FCM', kitH:'#9D162E', kitA:'#000000', stadium:'Saint-Symphorien',         cap:25636, budget:7,   wages:0.8, strength:52, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Le Havre',           league:'ligue-1',        short:'HAC', kitH:'#0054A6', kitA:'#FFFFFF', stadium:'Océane',                   cap:25178, budget:7,   wages:0.8, strength:53, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },
  { name:'Brest',              league:'ligue-1',        short:'SB29',kitH:'#CF122A', kitA:'#FFFFFF', stadium:'Francis-Le Blé',           cap:15272, budget:7,   wages:0.8, strength:56, obj:'Survival', patience:'High',  nats:['fr','br','af','es','ar'] },

  // SCOTTISH PREMIER
  { name:'Celtic',             league:'scottish-prem',  short:'CEL', kitH:'#16A34A', kitA:'#FFFFFF', stadium:'Celtic Park',              cap:60411, budget:22,  wages:1.6, strength:75, obj:'Title',    patience:'Low',   nats:['en','af','es','jp','br'] },
  { name:'Rangers',            league:'scottish-prem',  short:'RNG', kitH:'#1B3A8B', kitA:'#FFFFFF', stadium:'Ibrox Stadium',            cap:50817, budget:18,  wages:1.4, strength:74, obj:'Title',    patience:'Low',   nats:['en','nl','af','br','es'] },
  { name:'Hearts',             league:'scottish-prem',  short:'HEA', kitH:'#9B1724', kitA:'#FFFFFF', stadium:'Tynecastle Park',          cap:19841, budget:5,   wages:0.6, strength:61, obj:'Top 4',    patience:'Medium',nats:['en','af','br','es','nl'] },
  { name:'Hibs',               league:'scottish-prem',  short:'HIB', kitH:'#005000', kitA:'#FFFFFF', stadium:'Easter Road',              cap:20421, budget:5,   wages:0.6, strength:60, obj:'Top 4',    patience:'Medium',nats:['en','af','br','es','fr'] },
  { name:'Aberdeen',           league:'scottish-prem',  short:'ABD', kitH:'#CC0000', kitA:'#FFFFFF', stadium:'Pittodrie',                cap:20866, budget:3,   wages:0.4, strength:57, obj:'Top 6',    patience:'High',  nats:['en','af','br','es','nl'] },
  { name:'Dundee United',      league:'scottish-prem',  short:'DUN', kitH:'#F47B20', kitA:'#000000', stadium:'Tannadice Park',           cap:14223, budget:2,   wages:0.3, strength:53, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'Livingston',         league:'scottish-prem',  short:'LIV', kitH:'#FFD700', kitA:'#000000', stadium:'Tony Macaroni Arena',      cap:10122, budget:1,   wages:0.2, strength:50, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'St Mirren',          league:'scottish-prem',  short:'STM', kitH:'#000000', kitA:'#FFFFFF', stadium:'SMISA Stadium',            cap:8023,  budget:1,   wages:0.2, strength:50, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'Motherwell',         league:'scottish-prem',  short:'MOT', kitH:'#F5A623', kitA:'#000000', stadium:'Fir Park',                 cap:13742, budget:1,   wages:0.2, strength:51, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'St Johnstone',       league:'scottish-prem',  short:'STJ', kitH:'#003399', kitA:'#FFFFFF', stadium:'McDiarmid Park',           cap:10673, budget:1,   wages:0.2, strength:50, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'Ross County',        league:'scottish-prem',  short:'ROS', kitH:'#004B9A', kitA:'#FFFFFF', stadium:'Global Energy Stadium',    cap:6541,  budget:1,   wages:0.2, strength:49, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] },
  { name:'Kilmarnock',         league:'scottish-prem',  short:'KIL', kitH:'#002D62', kitA:'#FFFFFF', stadium:'Rugby Park',               cap:17891, budget:2,   wages:0.3, strength:52, obj:'Survival', patience:'High',  nats:['en','af','br','es','fr'] }
];

// ---- PLAYER GENERATION ----
let _playerIdCounter = 1;

function genId() { return _playerIdCounter++; }

function pickName(natPool) {
  const nat = natPool[Math.floor(Math.random() * Math.min(natPool.length, 3))]; // bias toward first 3
  const pool = NAMES[nat] || NAMES.en;
  const f = pool.first[Math.floor(Math.random() * pool.first.length)];
  const l = pool.last[Math.floor(Math.random() * pool.last.length)];
  return { full: `${f} ${l}`, first: f, last: l, nat };
}

function ageToMultiplier(age) {
  // Peak 24-28, decline after 30
  if (age < 20) return 0.82;
  if (age < 22) return 0.90;
  if (age < 24) return 0.96;
  if (age <= 28) return 1.00;
  if (age <= 30) return 0.97;
  if (age <= 32) return 0.93;
  if (age <= 34) return 0.87;
  return 0.80;
}

function generatePlayer(clubStrength, position, nats, isFirst = false) {
  const nm = pickName(nats);
  const age = isFirst ? (21 + Math.floor(Math.random() * 10)) : (17 + Math.floor(Math.random() * 18));
  const ageMult = ageToMultiplier(age);
  const baseOvr = isFirst
    ? Math.round(clubStrength * 0.95 + (Math.random() * 10 - 5))
    : Math.round(clubStrength * 0.78 + (Math.random() * 18 - 9));
  const ovr = Math.round(Math.max(40, Math.min(99, baseOvr * ageMult)));
  const pot = Math.min(99, ovr + Math.floor(Math.random() * (age < 23 ? 18 : age < 27 ? 8 : 3)));

  // Position-weighted stats
  const r = () => Math.round(30 + Math.random() * 65);
  const rB = (b) => Math.round(Math.max(30, Math.min(99, b + (Math.random() * 20 - 10))));
  let pac, sho, pas, def, phy, gkp;

  if (position === 'GK') {
    pac = rB(55); sho = rB(25); pas = rB(55); def = rB(30); phy = rB(65); gkp = rB(ovr + 5);
  } else if (position === 'DEF') {
    pac = rB(ovr - 5); sho = rB(ovr - 20); pas = rB(ovr - 10); def = rB(ovr + 5); phy = rB(ovr); gkp = 15 + Math.floor(Math.random() * 10);
  } else if (position === 'MID') {
    pac = rB(ovr - 8); sho = rB(ovr - 5); pas = rB(ovr + 5); def = rB(ovr - 10); phy = rB(ovr - 5); gkp = 10 + Math.floor(Math.random() * 10);
  } else { // FWD
    pac = rB(ovr + 5); sho = rB(ovr + 8); pas = rB(ovr - 8); def = rB(ovr - 25); phy = rB(ovr - 5); gkp = 8 + Math.floor(Math.random() * 8);
  }
  pac = clampStat(pac); sho = clampStat(sho); pas = clampStat(pas);
  def = clampStat(def); phy = clampStat(phy); gkp = clampStat(gkp);

  // Value in £m, wage in £m/week
  const value = calcValue(ovr, age, pot);
  const wage = calcWage(ovr, clubStrength);

  return {
    id: genId(),
    name: nm.full,
    first: nm.first,
    last: nm.last,
    nat: nm.nat,
    age,
    position,
    ovr,
    pot,
    pac, sho, pas, def, phy, gkp,
    morale: 60 + Math.floor(Math.random() * 30),
    fitness: 75 + Math.floor(Math.random() * 25),
    form: 0,          // -10 to +10
    injuryWeeks: 0,
    suspended: 0,
    value,
    wage,
    goals: 0,
    assists: 0,
    appearances: 0,
    yellowCards: 0,
    redCards: 0,
    contractYears: 1 + Math.floor(Math.random() * 4),
    transferListed: false,
    playerRating: ovr, // in-season match rating accumulator
  };
}

function clampStat(v) { return Math.max(30, Math.min(99, Math.round(v))); }

function calcValue(ovr, age, pot) {
  const base = Math.pow((ovr - 40) / 55, 2.2) * 80;
  const ageFactor = age < 22 ? 1.4 : age < 25 ? 1.2 : age < 28 ? 1.0 : age < 30 ? 0.85 : age < 33 ? 0.6 : 0.3;
  const potFactor = (pot - ovr) > 10 ? 1.15 : 1.0;
  return Math.max(0.1, Math.round((base * ageFactor * potFactor) * 10) / 10);
}

function calcWage(ovr, clubStrength) {
  const base = Math.pow((ovr - 40) / 55, 2) * 0.25;
  const clubFactor = 0.7 + (clubStrength / 100) * 0.6;
  return Math.max(0.01, Math.round(base * clubFactor * 100) / 100);
}

function generateSquad(club) {
  const sq = [];
  const str = club.strength;
  const nats = club.nats;

  // GKs: 2
  sq.push(generatePlayer(str, 'GK', nats, true));
  sq.push(generatePlayer(str, 'GK', nats, false));

  // DEF: 6
  for (let i = 0; i < 4; i++) sq.push(generatePlayer(str, 'DEF', nats, true));
  for (let i = 0; i < 2; i++) sq.push(generatePlayer(str, 'DEF', nats, false));

  // MID: 6
  for (let i = 0; i < 4; i++) sq.push(generatePlayer(str, 'MID', nats, true));
  for (let i = 0; i < 2; i++) sq.push(generatePlayer(str, 'MID', nats, false));

  // FWD: 4
  for (let i = 0; i < 3; i++) sq.push(generatePlayer(str, 'FWD', nats, true));
  sq.push(generatePlayer(str, 'FWD', nats, false));

  // Youth (2-3 youngsters)
  const youthCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < youthCount; i++) {
    const pos = ['DEF','MID','MID','FWD'][Math.floor(Math.random() * 4)];
    const p = generatePlayer(str - 15, pos, nats, false);
    p.age = 17 + Math.floor(Math.random() * 4);
    p.pot = Math.min(99, p.ovr + 12 + Math.floor(Math.random() * 15));
    sq.push(p);
  }

  return sq;
}

// ---- ROUND ROBIN FIXTURE GENERATOR ----
function createRoundRobin(teamNames) {
  const list = [...teamNames];
  if (list.length % 2) list.push('__BYE__');
  const n = list.length;
  const rounds = [];
  for (let r = 0; r < n - 1; r++) {
    const matches = [];
    for (let i = 0; i < n / 2; i++) {
      const a = list[i], b = list[n - 1 - i];
      if (a !== '__BYE__' && b !== '__BYE__') {
        matches.push({ home: a, away: b, played: false, hg: 0, ag: 0 });
      }
    }
    rounds.push(matches);
    list.splice(1, 0, list.pop());
  }
  const returnLegs = rounds.map(round =>
    round.map(m => ({ home: m.away, away: m.home, played: false, hg: 0, ag: 0 }))
  );
  return [...rounds, ...returnLegs];
}

// ---- COMMENTARY POOLS ----
const COMMENTARY = {
  kickoff: ['Kick-off! The match is underway!', 'The referee blows the whistle — we\'re off!', 'And we\'re underway here at {stadium}!'],
  halfTime: ['Half-time! The players head for the tunnel.', 'The whistle blows for half-time. Time to regroup.', 'Forty-five minutes gone. Time for the team talk.'],
  fullTime: ['Full-time! What a match!', 'The final whistle blows!', 'And that\'s it — the game is over!', 'The referee ends it. Full time!'],
  goal: [
    '{scorer} finds the net! What a strike!',
    'GOAL! {scorer} makes no mistake!',
    '{scorer} slots it home — {team} take the lead!',
    'Brilliant! {scorer} with a clinical finish!',
    '{scorer} heads it in! {team} lead!',
    'The goalkeeper had no chance. {scorer}!',
    '{scorer} drives it home from the edge of the box!',
    'GET IN! {scorer} puts {team} ahead!',
    '{scorer} with the composed finish. Back of the net!',
    '{scorer} latches onto the through ball and scores!'
  ],
  ownGoal: [
    'Oh no — an own goal! Unfortunate for {team}!',
    'Unlucky! That deflects off {defender} into the net!',
    'Own goal! The defender can\'t believe it!'
  ],
  shotSaved: [
    'Great save! The keeper keeps {team} out!',
    '{keeper} to the rescue — fine stop!',
    'Brilliant reflexes from the goalkeeper!',
    'Off the line! {team} are denied.',
    'Shot saved! The keeper is equal to it.',
    '{scorer} tries his luck but the keeper is alert!'
  ],
  shotMissed: [
    'Over the bar! {scorer} will be disappointed with that.',
    'Wide! {scorer} had a chance there.',
    '{scorer} blazes it over — should have done better!',
    'The ball sails into the crowd. Chance wasted.',
    'Narrowly wide from {scorer}. So close!',
    'Off the woodwork! {team} are denied by the post!'
  ],
  corner: [
    'Corner to {team}! Keeper punches it away.',
    '{team} win a corner. There\'s a chance building here.',
    'Corner flag reached — set piece opportunity for {team}.'
  ],
  foul: [
    'Free kick to {team}. The referee points to the spot... no, it\'s a free kick.',
    '{player} is brought down. Referee awards the foul.',
    'Crunching tackle! That\'s a free kick near the box.',
    'Foul on {player}. {team} with a dangerous set piece.'
  ],
  yellow: [
    '{player} goes into the book. One more and he\'s off.',
    'Yellow card for {player}. The referee has had enough.',
    '{player} is cautioned. Dangerous territory.'
  ],
  red: [
    'RED CARD! {player} is off! What drama!',
    'Straight red for {player}! {team} are down to ten men!',
    '{player} receives a second yellow and is dismissed!'
  ],
  injury: [
    '{player} is down and receiving treatment.',
    'Physios on the pitch for {player} — this looks serious.',
    'Oh dear. {player} hobbles off. Could be a long one.'
  ],
  pressure: [
    '{team} are on top now. The pressure is mounting.',
    'Sustained {team} pressure. Something has to give.',
    '{team} are really pushing for the equaliser.'
  ],
  tactical: [
    'You signal a tactical change from the touchline.',
    'You\'re adjusting the shape. The players acknowledge it.',
    'Instructing your players to push higher. Let\'s see if it works.'
  ]
};

function pickComm(type, vars = {}) {
  const pool = COMMENTARY[type];
  if (!pool) return '';
  let line = pool[Math.floor(Math.random() * pool.length)];
  for (const [k, v] of Object.entries(vars)) {
    line = line.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return line;
}
