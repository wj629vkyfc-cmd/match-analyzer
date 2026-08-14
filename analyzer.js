// =====================================================
// MATCH ANALYZER - MOTEUR D'ANALYSE V1
// =====================================================

// Limite une valeur entre 0 et 100
function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}


// -----------------------------------------------------
// MOYENNE
// -----------------------------------------------------

function average(values) {
  if (!values || values.length === 0) return 0;

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}


// -----------------------------------------------------
// FORME D'UNE ÉQUIPE
// -----------------------------------------------------

function calculateForm(results) {
  /*
    results exemple :
    ["W", "W", "D", "L", "W"]

    W = victoire
    D = nul
    L = défaite
  */

  if (!results || results.length === 0) {
    return 50;
  }

  const points = {
    W: 3,
    D: 1,
    L: 0
  };

  const total = results.reduce(
    (sum, result) => sum + (points[result] || 0),
    0
  );

  return clamp((total / (results.length * 3)) * 100);
}


// -----------------------------------------------------
// FORCE OFFENSIVE
// -----------------------------------------------------

function calculateAttack(goalsScored) {
  if (!goalsScored || goalsScored.length === 0) {
    return 50;
  }

  const avgGoals = average(goalsScored);

  /*
    0 but = faible
    1 but = moyen
    2 buts = bon
    3+ = très bon
  */

  return clamp((avgGoals / 3) * 100);
}


// -----------------------------------------------------
// FORCE DÉFENSIVE
// -----------------------------------------------------

function calculateDefense(goalsConceded) {
  if (!goalsConceded || goalsConceded.length === 0) {
    return 50;
  }

  const avgConceded = average(goalsConceded);

  /*
    Moins une équipe encaisse,
    meilleure est sa note défensive.
  */

  return clamp(100 - (avgConceded / 3) * 100);
}


// -----------------------------------------------------
// ANALYSE D'UNE ÉQUIPE
// -----------------------------------------------------

function analyzeTeam(team) {

  const formScore = calculateForm(team.recentResults);

  const attackScore = calculateAttack(
    team.goalsScored
  );

  const defenseScore = calculateDefense(
    team.goalsConceded
  );

  const homeAwayScore = clamp(
    team.homeAwayScore ?? 50
  );

  const overall =
    formScore * 0.35 +
    attackScore * 0.25 +
    defenseScore * 0.25 +
    homeAwayScore * 0.15;

  return {
    form: Math.round(formScore),
    attack: Math.round(attackScore),
    defense: Math.round(defenseScore),
    homeAway: Math.round(homeAwayScore),
    overall: Math.round(overall)
  };
}


// -----------------------------------------------------
// ANALYSE DU MATCH
// -----------------------------------------------------

function analyzeMatch(homeTeam, awayTeam) {

  const home = analyzeTeam(homeTeam);
  const away = analyzeTeam(awayTeam);

  /*
    Avantage domicile.
  */

  const homeStrength = home.overall + 5;
  const awayStrength = away.overall;

  const totalStrength =
    homeStrength + awayStrength;

  let homeWin =
    (homeStrength / totalStrength) * 100;

  let awayWin =
    (awayStrength / totalStrength) * 100;

  /*
    Une partie de la probabilité est réservée
    au match nul.
  */

  const draw = 25;

  homeWin = homeWin * 0.75;
  awayWin = awayWin * 0.75;

  /*
    Normalisation
  */

  const total =
    homeWin + draw + awayWin;

  homeWin = (homeWin / total) * 100;
  awayWin = (awayWin / total) * 100;

  return {
    homeWin: Math.round(homeWin),
    draw: Math.round(draw),
    awayWin: Math.round(awayWin),

    doubleChance1X:
      Math.round(homeWin + draw),

    doubleChanceX2:
      Math.round(draw + awayWin),

    doubleChance12:
      Math.round(homeWin + awayWin),

    over15: calculateOver15(home, away),

    over25: calculateOver25(home, away),

    under35: calculateUnder35(home, away),

    btts: calculateBTTS(home, away),

    confidence: calculateConfidence(
      home,
      away,
      homeWin,
      draw,
      awayWin
    )
  };
}


// -----------------------------------------------------
// OVER 1.5
// -----------------------------------------------------

function calculateOver15(home, away) {

  const attack =
    (home.attack + away.attack) / 2;

  const confidence =
    50 + attack * 0.45;

  return Math.round(clamp(confidence));
}


// -----------------------------------------------------
// OVER 2.5
// -----------------------------------------------------

function calculateOver25(home, away) {

  const attack =
    (home.attack + away.attack) / 2;

  const defense =
    100 - (
      (home.defense + away.defense) / 2
    );

  const value =
    attack * 0.65 +
    defense * 0.35;

  return Math.round(
    clamp(35 + value * 0.5)
  );
}


// -----------------------------------------------------
// UNDER 3.5
// -----------------------------------------------------

function calculateUnder35(home, away) {

  const defense =
    (home.defense + away.defense) / 2;

  return Math.round(
    clamp(45 + defense * 0.5)
  );
}


// -----------------------------------------------------
// BTTS
// -----------------------------------------------------

function calculateBTTS(home, away) {

  const attack =
    (home.attack + away.attack) / 2;

  const defensiveWeakness =
    100 - (
      (home.defense + away.defense) / 2
    );

  return Math.round(
    clamp(
      30 +
      attack * 0.45 +
      defensiveWeakness * 0.25
    )
  );
}


// -----------------------------------------------------
// CONFIANCE GLOBALE
// -----------------------------------------------------

function calculateConfidence(
  home,
  away,
  homeWin,
  draw,
  awayWin
) {

  const strongestProbability =
    Math.max(
      homeWin,
      draw,
      awayWin
    );

  const teamConsistency =
    100 -
    Math.abs(
      home.overall -
      away.overall
    );

  const confidence =
    strongestProbability * 0.60 +
    teamConsistency * 0.40;

  return Math.round(
    clamp(confidence)
  );
}


// -----------------------------------------------------
// CHOIX DU MARCHÉ PRINCIPAL
// -----------------------------------------------------

function getBestMarket(analysis) {

  const markets = [
    {
      name: "Victoire équipe domicile",
      value: analysis.homeWin
    },

    {
      name: "Match nul",
      value: analysis.draw
    },

    {
      name: "Victoire équipe extérieure",
      value: analysis.awayWin
    },

    {
      name: "Double chance 1X",
      value: analysis.doubleChance1X
    },

    {
      name: "Double chance X2",
      value: analysis.doubleChanceX2
    },

    {
      name: "Double chance 12",
      value: analysis.doubleChance12
    },

    {
      name: "Over 1.5",
      value: analysis.over15
    },

    {
      name: "Over 2.5",
      value: analysis.over25
    },

    {
      name: "Under 3.5",
      value: analysis.under35
    },

    {
      name: "BTTS",
      value: analysis.btts
    }
  ];

  markets.sort(
    (a, b) => b.value - a.value
  );

  return markets[0];
}


// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------

window.MatchAnalyzer = {

  analyzeMatch,

  analyzeTeam,

  getBestMarket,

  calculateForm,

  calculateAttack,

  calculateDefense

};
