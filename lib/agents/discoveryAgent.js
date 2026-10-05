/* ============================================================
   UNIVERSAL HIDDEN TALENT ENGINE
   Identifies athletes with strong performance relative to 
   competition visibility, strength, exposure, and improvement.
   ============================================================ */

function classifyTalent(player, leagueStrength) {
  const isHighPerformance = player.performanceScore >= 75;
  const isLowStrengthLeague = leagueStrength <= 45;
  const isImproving = player.recentForm > player.performanceScore + 5;
  const isConsistent = player.consistency >= 80;
  const hasLowExposure = player.matchesCounted < 10 && player.matchesCounted > 3;
  const hasHighConfidence = player.confidence === "HIGH";

  let classification = null;
  let evidence = [];

  if (isHighPerformance && isLowStrengthLeague && hasHighConfidence) {
    classification = "Undervalued";
    evidence.push(`Maintains a high performance score (${player.performanceScore}) in a lower-strength competition (${leagueStrength}).`);
  } else if (isImproving && isHighPerformance) {
    classification = "Rising";
    evidence.push(`Recent form (${player.recentForm}) is significantly higher than historical performance (${player.performanceScore}).`);
  } else if (isHighPerformance && hasLowExposure) {
    classification = "Emerging";
    evidence.push(`Shows strong initial performance (${player.performanceScore}) but limited match exposure (${player.matchesCounted} matches).`);
  } else if (isHighPerformance && isConsistent && hasHighConfidence) {
    classification = "Consistent";
    evidence.push(`Highly consistent performances (Consistency Score: ${player.consistency}) with high data confidence.`);
  } else if (isHighPerformance) {
    // If they just have a high performance without the other flags, they might be a specialist if their stats lean a specific way
    // For now, broadly classify as Specialist if they don't fit the main hidden gem categories
    classification = "Specialist";
    evidence.push(`High performance score (${player.performanceScore}) within their designated role.`);
  }

  return { classification, evidence };
}

function findHiddenGems(db, limit = 10) {
  const scored = db.players
    .filter(p => p.talentIndex !== null && p.talentIndex !== undefined)
    .map(p => {
      const team = db.teams.find(t => t.id === p.teamId);
      const league = team ? db.leagues.find(l => l.id === team.leagueId) : null;
      const leagueStrength = league ? league.strength : 50;
      
      const { classification, evidence } = classifyTalent(p, leagueStrength);

      // Score for ranking: We want to bubble up Undervalued and Rising players first
      let hiddenGemScore = p.talentIndex;
      if (classification === "Undervalued") hiddenGemScore += 15;
      if (classification === "Rising") hiddenGemScore += 10;
      if (classification === "Emerging") hiddenGemScore += 5;
      
      return {
        playerId: p.id,
        name: p.name,
        sport: p.sport,
        role: p.role,
        talentIndex: p.talentIndex,
        performanceScore: p.performanceScore,
        confidence: p.confidence,
        leagueName: league ? league.name : "Unknown league",
        leagueStrength,
        classification,
        evidence: evidence.join(" "),
        hiddenGemScore,
      };
    })
    .filter(p => p.classification !== null)
    .sort((a, b) => b.hiddenGemScore - a.hiddenGemScore)
    .slice(0, limit);

  return scored;
}

module.exports = { findHiddenGems, classifyTalent };
