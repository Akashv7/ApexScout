/* ============================================================
   VERIFICATION AGENT
   Rule-based (not ML) — checks a player's logged performances for
   statistical plausibility, and raises/lowers a confidence score.
   This is the honest version of "video verification": until real
   video/OCR analysis is wired in, this agent verifies what's
   already checkable — internal consistency of the numbers
   themselves against known limits for the format.
   ============================================================ */

const LIMITS = {
  Ground: { maxWicketsPerMatch: 10, maxStrikeRate: 250, maxEconomy: 15 },
  Turf: { maxWicketsPerMatch: 6, maxStrikeRate: 400, maxEconomy: 20 },
};

function runVerification(player, db) {
  const performances = db.matches
    .flatMap(m => (m.performances || []).map(p => ({ ...p, matchId: m.id })))
    .filter(p => p.playerId === player.id);

  const limits = LIMITS[player.format] || LIMITS.Ground;
  const flags = [];

  performances.forEach(perf => {
    if (perf.type === "bowling" && perf.wickets > limits.maxWicketsPerMatch) {
      flags.push(`Match ${perf.matchId}: ${perf.wickets} wickets exceeds plausible max (${limits.maxWicketsPerMatch}) for ${player.format} format.`);
    }
    if (perf.type === "bowling" && perf.economy !== undefined && perf.economy > limits.maxEconomy) {
      flags.push(`Match ${perf.matchId}: economy ${perf.economy} is outside a plausible range.`);
    }
    if (perf.type === "batting" && perf.ballsFaced) {
      const sr = (perf.runs / perf.ballsFaced) * 100;
      if (sr > limits.maxStrikeRate) {
        flags.push(`Match ${perf.matchId}: strike rate ${sr.toFixed(0)} exceeds plausible max (${limits.maxStrikeRate}) for ${player.format} format.`);
      }
    }
  });

  const matchCount = performances.length;
  let confidence;
  if (matchCount === 0) {
    confidence = 0;
  } else {
    // Base confidence rises with sample size (more matches = more to
    // cross-check), then is knocked down per flag raised.
    const sampleConfidence = Math.min(70, 20 + matchCount * 5);
    confidence = Math.max(0, sampleConfidence - flags.length * 25);
  }

  const verdict =
    matchCount === 0 ? "insufficient_data" :
    flags.length === 0 && confidence >= 50 ? "pass" :
    flags.length > 0 ? "flagged" : "low_confidence";

  return { playerId: player.id, matchesChecked: matchCount, confidence, flags, verdict };
}

/**
 * Runs verification and, if it passes cleanly, upgrades the player's
 * trust tier one step (unverified -> community -> agent). Never
 * downgrades automatically — flags are surfaced for human review instead.
 */
function runVerificationAndApply(player, db) {
  const result = runVerification(player, db);
  if (result.verdict === "pass") {
    if (player.trust === "unverified") player.trust = "community";
    else if (player.trust === "community") player.trust = "agent";
  }
  return result;
}

module.exports = { runVerification, runVerificationAndApply };
