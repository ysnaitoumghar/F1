/* ═══════════════════════════════════════════════════════════════
   PIT WALL — données (2026). Facile à éditer : tout le site lit ce fichier.
   Sources grille : the-race.com (liste FIA), calendrier : motorsportmagazine.com (16/09/2026).
   Couleurs d'équipe : approximations des livrées 2026 — à ajuster si besoin.
   `stats` des pilotes : voir STATS ci-dessous.
   ═══════════════════════════════════════════════════════════════ */
(function (root) {
  const teams = [
    { id: 'mclaren', name: 'McLaren', full: 'McLaren Mastercard F1 Team', base: 'Woking, Royaume-Uni', engine: 'Mercedes', chassis: 'McLaren', color: '#FF8000', color2: '#0B0B0B', founded: 1963, drivers: ['norris', 'piastri'],
      history: "Fondée par Bruce McLaren en 1963, l'écurie de Woking est l'une des plus titrées de l'histoire : des années Senna–Prost aux couleurs papaya revenues au sommet." },
    { id: 'mercedes', name: 'Mercedes', full: 'Mercedes-AMG PETRONAS Formula One Team', base: 'Brackley, Royaume-Uni', engine: 'Mercedes', chassis: 'Mercedes', color: '#27F4D2', color2: '#0B0B0B', founded: 1954, drivers: ['russell', 'antonelli'],
      history: "Revenue en 2010 sur une base Brawn GP, l'équipe a dominé l'ère hybride avec huit titres constructeurs consécutifs de 2014 à 2021." },
    { id: 'redbull', name: 'Red Bull Racing', full: 'Oracle Red Bull Racing', base: 'Milton Keynes, Royaume-Uni', engine: 'Red Bull Ford', chassis: 'Red Bull Racing', color: '#3671C6', color2: '#E10600', founded: 2005, drivers: ['verstappen', 'hadjar'],
      history: "Née en 2005 en reprenant Jaguar, l'équipe a gagné quatre titres avec Vettel puis plusieurs avec Verstappen. 2026 marque ses premiers moteurs maison, avec Ford." },
    { id: 'ferrari', name: 'Ferrari', full: 'Scuderia Ferrari HP', base: 'Maranello, Italie', engine: 'Ferrari', chassis: 'Ferrari', color: '#E80020', color2: '#FFEB00', founded: 1929, drivers: ['leclerc', 'hamilton'],
      history: "Seule équipe présente depuis le premier championnat en 1950, la Scuderia détient le record de titres constructeurs." },
    { id: 'williams', name: 'Williams', full: 'Atlassian Williams F1 Team', base: 'Grove, Royaume-Uni', engine: 'Mercedes', chassis: 'Williams', color: '#64C4FF', color2: '#041E42', founded: 1977, drivers: ['albon', 'sainz'],
      history: "Neuf titres constructeurs, surtout dans les années 80–90. Après une longue traversée du désert, l'écurie de Grove remonte la pente." },
    { id: 'racingbulls', name: 'Racing Bulls', full: 'Visa Cash App Racing Bulls F1 Team', base: 'Faenza, Italie', engine: 'Red Bull Ford', chassis: 'Racing Bulls', color: '#6692FF', color2: '#FFFFFF', founded: 1985, drivers: ['lawson', 'lindblad'],
      history: "Ex-Minardi puis Toro Rosso et AlphaTauri, l'équipe de Faenza sert de tremplin aux jeunes talents du programme Red Bull." },
    { id: 'astonmartin', name: 'Aston Martin', full: 'Aston Martin Aramco F1 Team', base: 'Silverstone, Royaume-Uni', engine: 'Honda', chassis: 'Aston Martin Aramco', color: '#229971', color2: '#CEDC00', founded: 2021, drivers: ['alonso', 'stroll'],
      history: "Renaissance de l'ancienne Jordan–Force India–Racing Point, l'équipe vert British Racing s'appuie en 2026 sur un partenariat moteur avec Honda." },
    { id: 'haas', name: 'Haas', full: 'TGR Haas F1 Team', base: 'Kannapolis, États-Unis', engine: 'Ferrari', chassis: 'Haas', color: '#B6BABD', color2: '#E10600', founded: 2016, drivers: ['bearman', 'ocon'],
      history: "Seule équipe américaine de la grille jusqu'à l'arrivée de Cadillac, Haas a débuté en 2016 et s'appuie sur une étroite collaboration technique avec Ferrari." },
    { id: 'audi', name: 'Audi', full: 'Audi Revolut F1 Team', base: 'Hinwil, Suisse', engine: 'Audi', chassis: 'Audi', color: '#F50537', color2: '#C9CCD1', founded: 1993, drivers: ['hulkenberg', 'bortoleto'],
      history: "Reprise de Sauber, Audi entre en F1 en 2026 en tant que constructeur à part entière, avec son propre groupe propulseur." },
    { id: 'alpine', name: 'Alpine', full: 'BWT Alpine F1 Team', base: 'Enstone, Royaume-Uni', engine: 'Mercedes', chassis: 'Alpine', color: '#2293D1', color2: '#FF87BC', founded: 1981, drivers: ['gasly', 'colapinto'],
      history: "Héritière de Toleman, Benetton et Renault, l'équipe d'Enstone a connu deux titres avec Alonso (2005-2006). En 2026, elle passe au moteur Mercedes." },
    { id: 'cadillac', name: 'Cadillac', full: 'Cadillac Formula 1 Team', base: 'Fishers, États-Unis', engine: 'Ferrari', chassis: 'Cadillac', color: '#A7ADB5', color2: '#111111', founded: 2026, drivers: ['perez', 'bottas'],
      history: "Onzième équipe de la grille, Cadillac (TWG / General Motors) fait ses débuts en 2026 avec deux vétérans, Pérez et Bottas." }
  ];

  // [id, prénom, nom, numéro, équipe, nationalité, code pays ISO, année de naissance]
  const D = [
    ['norris', 'Lando', 'Norris', 1, 'mclaren', 'Britannique', 'GB', 1999],
    ['piastri', 'Oscar', 'Piastri', 81, 'mclaren', 'Australien', 'AU', 2001],
    ['russell', 'George', 'Russell', 63, 'mercedes', 'Britannique', 'GB', 1998],
    ['antonelli', 'Kimi', 'Antonelli', 12, 'mercedes', 'Italien', 'IT', 2006],
    ['verstappen', 'Max', 'Verstappen', 3, 'redbull', 'Néerlandais', 'NL', 1997],
    ['hadjar', 'Isack', 'Hadjar', 6, 'redbull', 'Français', 'FR', 2004],
    ['leclerc', 'Charles', 'Leclerc', 16, 'ferrari', 'Monégasque', 'MC', 1997],
    ['hamilton', 'Lewis', 'Hamilton', 44, 'ferrari', 'Britannique', 'GB', 1985],
    ['albon', 'Alexander', 'Albon', 23, 'williams', 'Thaïlandais', 'TH', 1996],
    ['sainz', 'Carlos', 'Sainz', 55, 'williams', 'Espagnol', 'ES', 1994],
    ['lawson', 'Liam', 'Lawson', 30, 'racingbulls', 'Néo-Zélandais', 'NZ', 2002],
    ['lindblad', 'Arvid', 'Lindblad', 41, 'racingbulls', 'Britannique', 'GB', 2007],
    ['alonso', 'Fernando', 'Alonso', 14, 'astonmartin', 'Espagnol', 'ES', 1981],
    ['stroll', 'Lance', 'Stroll', 18, 'astonmartin', 'Canadien', 'CA', 1998],
    ['bearman', 'Oliver', 'Bearman', 87, 'haas', 'Britannique', 'GB', 2005],
    ['ocon', 'Esteban', 'Ocon', 31, 'haas', 'Français', 'FR', 1996],
    ['hulkenberg', 'Nico', 'Hülkenberg', 27, 'audi', 'Allemand', 'DE', 1987],
    ['bortoleto', 'Gabriel', 'Bortoleto', 5, 'audi', 'Brésilien', 'BR', 2004],
    ['gasly', 'Pierre', 'Gasly', 10, 'alpine', 'Français', 'FR', 1996],
    ['colapinto', 'Franco', 'Colapinto', 43, 'alpine', 'Argentin', 'AR', 2003],
    ['perez', 'Sergio', 'Pérez', 11, 'cadillac', 'Mexicain', 'MX', 1990],
    ['bottas', 'Valtteri', 'Bottas', 77, 'cadillac', 'Finlandais', 'FI', 1989]
  ];
  // Statistiques de carrière — Wikipédia, arrêtées au GP de São Paulo 2026 (manche 20). [titres, GP, victoires, podiums, poles, meilleurs tours, points]
  // Antonelli, Albon, Alonso, Gasly : valeurs issues d'un résumé de page, à revérifier.
  const STATS = {
    norris: [1,172,14,50,20,20,1676],
    piastri: [0,90,9,28,6,9,951],
    russell: [0,172,8,32,12,13,1295],
    antonelli: [1,44,9,19,7,11,540],
    verstappen: [4,253,74,139,50,38,3723.5],
    hadjar: [0,41,0,4,0,0,173],
    leclerc: [0,193,9,56,27,15,1921],
    hamilton: [7,400,106,209,105,70,5279.5],
    albon: [0,150,0,2,0,1,318],
    sainz: [0,253,4,29,6,4,1343.5],
    lawson: [0,55,0,0,0,0,133],
    lindblad: [0,20,0,0,0,0,38],
    alonso: [2,448,32,106,22,26,2400],
    stroll: [0,213,0,3,1,0,325],
    bearman: [0,47,0,0,0,0,71],
    ocon: [0,199,1,4,0,1,490],
    hulkenberg: [0,274,0,1,1,2,636],
    bortoleto: [0,44,0,0,0,0,33],
    gasly: [0,198,1,5,1,3,500],
    colapinto: [0,47,0,0,0,0,32],
    perez: [0,305,6,39,3,12,1638],
    bottas: [0,267,10,67,20,19,1797]
  };
  const statsAsOf = 'GP de São Paulo 2026';
  const drivers = D.map((d) => ({
    id: d[0], first: d[1], last: d[2], number: d[3], team: d[4], nationality: d[5], country: d[6], born: d[7],
    stats: (function (a) { return { titles: a[0], races: a[1], wins: a[2], podiums: a[3], poles: a[4], fastest: a[5], points: a[6] }; })(STATS[d[0]])
  }));

  // [id, GP, circuit, ville, pays, code, longueur km, date de course, sprint, note]
  const C = [
    ['australia', 'Grand Prix d\'Australie', 'Albert Park Circuit', 'Melbourne', 'Australie', 'AU', 5.278, '2026-03-08', false],
    ['china', 'Grand Prix de Chine', 'Shanghai International Circuit', 'Shanghai', 'Chine', 'CN', 5.451, '2026-03-15', true],
    ['japan', 'Grand Prix du Japon', 'Suzuka International Racing Course', 'Suzuka', 'Japon', 'JP', 5.807, '2026-03-29', false],
    ['miami', 'Grand Prix de Miami', 'Miami International Autodrome', 'Miami', 'États-Unis', 'US', 5.412, '2026-05-03', true],
    ['canada', 'Grand Prix du Canada', 'Circuit Gilles-Villeneuve', 'Montréal', 'Canada', 'CA', 4.361, '2026-05-24', true],
    ['monaco', 'Grand Prix de Monaco', 'Circuit de Monaco', 'Monaco', 'Monaco', 'MC', 3.337, '2026-06-07', false],
    ['barcelona', 'Grand Prix d\'Espagne (Barcelone)', 'Circuit de Barcelona-Catalunya', 'Montmeló', 'Espagne', 'ES', 4.657, '2026-06-14', false],
    ['austria', 'Grand Prix d\'Autriche', 'Red Bull Ring', 'Spielberg', 'Autriche', 'AT', 4.318, '2026-06-28', false],
    ['britain', 'Grand Prix de Grande-Bretagne', 'Silverstone Circuit', 'Silverstone', 'Royaume-Uni', 'GB', 5.891, '2026-07-05', true],
    ['belgium', 'Grand Prix de Belgique', 'Circuit de Spa-Francorchamps', 'Stavelot', 'Belgique', 'BE', 7.004, '2026-07-19', false],
    ['hungary', 'Grand Prix de Hongrie', 'Hungaroring', 'Budapest', 'Hongrie', 'HU', 4.381, '2026-07-26', false],
    ['netherlands', 'Grand Prix des Pays-Bas', 'Circuit Zandvoort', 'Zandvoort', 'Pays-Bas', 'NL', 4.259, '2026-08-23', true],
    ['italy', 'Grand Prix d\'Italie', 'Autodromo Nazionale Monza', 'Monza', 'Italie', 'IT', 5.793, '2026-09-06', false],
    ['madrid', 'Grand Prix d\'Espagne (Madrid)', 'Madring', 'Madrid', 'Espagne', 'ES', 5.47, '2026-09-13', false, 'Nouveau circuit urbain, première en 2026.'],
    ['azerbaijan', 'Grand Prix d\'Azerbaïdjan', 'Baku City Circuit', 'Bakou', 'Azerbaïdjan', 'AZ', 6.003, '2026-09-26', false],
    ['singapore', 'Grand Prix de Singapour', 'Marina Bay Street Circuit', 'Singapour', 'Singapour', 'SG', 4.94, '2026-10-11', true],
    ['usa', 'Grand Prix des États-Unis', 'Circuit of the Americas', 'Austin', 'États-Unis', 'US', 5.513, '2026-10-25', false],
    ['mexico', 'Grand Prix de Mexico', 'Autódromo Hermanos Rodríguez', 'Mexico', 'Mexique', 'MX', 4.304, '2026-11-01', false],
    ['brazil', 'Grand Prix de São Paulo', 'Autódromo José Carlos Pace (Interlagos)', 'São Paulo', 'Brésil', 'BR', 4.309, '2026-11-08', false],
    ['lasvegas', 'Grand Prix de Las Vegas', 'Las Vegas Strip Circuit', 'Las Vegas', 'États-Unis', 'US', 6.201, '2026-11-21', false, 'Départ samedi 20h (heure locale).'],
    ['qatar', 'Grand Prix du Qatar', 'Lusail International Circuit', 'Lusail', 'Qatar', 'QA', 5.419, '2026-11-29', false, 'Date à confirmer (incertitudes Moyen-Orient).'],
    ['abudhabi', 'Grand Prix d\'Abou Dhabi', 'Yas Marina Circuit', 'Abou Dhabi', 'Émirats arabes unis', 'AE', 5.281, '2026-12-06', false, 'Date à confirmer (incertitudes Moyen-Orient).']
  ];
  const circuits = C.map((c, i) => ({
    id: c[0], round: i + 1, gp: c[1], name: c[2], city: c[3], country: c[4], code: c[5], length: c[6], date: c[7], sprint: c[8], note: c[9] || ''
  }));

  root.PITWALL = { season: 2026, teams, drivers, circuits, statsAsOf };
  if (typeof module !== 'undefined') module.exports = root.PITWALL;
})(typeof window !== 'undefined' ? window : globalThis);
