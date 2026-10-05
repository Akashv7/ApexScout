/* ============================================================
   TALENT INDEX ENGINE
   This is the real implementation of the core idea: a rating
   that adjusts a player's raw performance by the strength of
   the opposition they faced, so stats become comparable across
   leagues of very different quality.

   Approach (deliberately simple + fully documented, not a black box):

   1. TEAM STRENGTH — every match updates both teams' Elo ratings.
      Beating a strong team gains more rating than beating a weak one.
      (Standard Elo: K-factor = 24, starting rating = 1500.)

   2. LEAGUE STRENGTH — a league's displayed "strength" (0-100) is
      just its teams' average Elo rating, rescaled for readability.

   3. PLAYER TALENT INDEX — for every match performance, we compute
      a raw "impact" score from the stats (runs/strike-rate for
      batting, wickets/economy for bowling), then multiply it by
      the *opposing team's Elo rating at the time of that match*
      (relative to the 1500 baseline). A big innings against a
      1700-rated team counts for more than the same innings against
      a 1300-rated team. Impacts are averaged across a player's
      matches and rescaled into a 0-100 index.

   This whole file recomputes ratings from scratch on every call —
   deterministic and simple to reason about (fine at prototype scale;
   an incremental update would be the production optimization).
   ============================================================ */

const CricketEngine = require("./engines/CricketEngine");
const FootballEngine = require("./engines/FootballEngine");
const BasketballEngine = require("./engines/BasketballEngine");
const TennisEngine = require("./engines/TennisEngine");

function getEngineForSport(sport) {
  if (sport && sport.toLowerCase() === "football") {
    return new FootballEngine();
  }
  if (sport && sport.toLowerCase() === "basketball") {
    return new BasketballEngine();
  }
  if (sport && sport.toLowerCase() === "tennis") {
    return new TennisEngine();
  }
  return new CricketEngine(); // default to cricket for legacy
}

const START_RATING = 1500;
const K_FACTOR = 24;

function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function ratingToLeagueStrength(rating) {
  // 1200 -> 0, 1800 -> 100 (roughly), clamped
  return Math.max(0, Math.min(100, Math.round((rating - 1200) / 6)));
}

/**
 * Recomputes team ratings, league strength, and every player's Talent Index
 * from the full match history. Mutates and returns the db object.
 */
function recompute(db) {
  // Reset each team to its baseline rating. Within a single closed league,
  // Elo is zero-sum (wins/losses just redistribute points among that
  // league's own teams) — so leagues need genuinely different starting
  // baselines, or every league would converge to the same average and
  // "league strength" would be meaningless. `initialRating` is the seeded
  // prior for how competitive that league is; matches then move individual
  // teams up/down around it.
  db.teams.forEach(t => (t.rating = t.initialRating || START_RATING));
  const playerImpacts = {}; // playerId -> array of weighted impacts

  // Replay matches in chronological order so ratings evolve realistically
  const matches = [...db.matches].sort((a, b) => new Date(a.date) - new Date(b.date));

  matches.forEach(match => {
    const teamA = db.teams.find(t => t.id === match.teamAId);
    const teamB = db.teams.find(t => t.id === match.teamBId);
    if (!teamA || !teamB) return;

    // Snapshot ratings BEFORE this match — used to weight player performances
    const ratingA = teamA.rating;
    const ratingB = teamB.rating;

    // Update team ratings (Elo)
    const scoreA = match.winnerTeamId === teamA.id ? 1 : match.winnerTeamId === teamB.id ? 0 : 0.5;
    const scoreB = 1 - scoreA;
    const eA = expectedScore(ratingA, ratingB);
    const eB = expectedScore(ratingB, ratingA);
    teamA.rating = Math.round(ratingA + K_FACTOR * (scoreA - eA));
    teamB.rating = Math.round(ratingB + K_FACTOR * (scoreB - eB));

    // Score each player's performance in this match, weighted by opponent's
    // pre-match rating relative to baseline
    (match.performances || []).forEach(perf => {
      const player = db.players.find(p => p.id === perf.playerId);
      if (!player) return;
      const opponentRating = player.teamId === match.teamAId ? ratingB : ratingA;
      const opponentMultiplier = opponentRating / START_RATING;

      // Route to correct engine based on player's sport
      const engine = getEngineForSport(player.sport);
      // We pass the role so the engine knows how to weight stats
      const rawImpact = engine.calculatePerformance({ ...perf, role: player.role });

      const weighted = rawImpact * opponentMultiplier;
      if (!playerImpacts[player.id]) playerImpacts[player.id] = [];
      playerImpacts[player.id].push(weighted);
    });
  });

  // Recompute league strength from member teams
  db.leagues.forEach(league => {
    const teams = db.teams.filter(t => t.leagueId === league.id);
    const avgRating = teams.length
      ? teams.reduce((s, t) => s + t.rating, 0) / teams.length
      : START_RATING;
    league.strength = ratingToLeagueStrength(avgRating);
  });

  db.players.forEach(player => {
    const impacts = playerImpacts[player.id] || [];
    const engine = getEngineForSport(player.sport);

    if (impacts.length === 0) {
      player.talentIndex = null; // not enough match data yet
      player.performanceScore = null;
      player.recentForm = null;
      player.consistency = null;
      player.confidence = "LOW";
      return;
    }
    const avgImpact = impacts.reduce((s, v) => s + v, 0) / impacts.length;
    
    // Baseline 50 = "average" performance; scale swings the index up/down.
    // Clamped to [5, 99] so it never looks falsely perfect or zero.
    const performanceScore = Math.round(Math.max(5, Math.min(99, 50 + avgImpact * 15)));
    
    player.performanceScore = performanceScore;
    player.matchesCounted = impacts.length;
    
    player.recentForm = engine.calculateRecentForm(impacts);
    player.consistency = engine.calculateConsistency(impacts);
    
    player.talentIndex = engine.calculateTalentScore({ performance: performanceScore });
    player.confidence = engine.calculateConfidence({ matchesCounted: player.matchesCounted });
  });

  return db;
}

module.exports = { recompute, START_RATING, K_FACTOR };
