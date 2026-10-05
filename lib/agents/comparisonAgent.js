/* ============================================================
   ATHLETE COMPARISON AGENT
   Allows comparison of 2-5 athletes, generating a structured
   dataset of measurable differences across universal intelligence
   metrics and generating objective, non-fabricated narrative summaries.
   ============================================================ */

const { getEngineForSport } = require("../ratingEngine");

function compareAthletes(db, playerIds, scoutCriteria = null) {
  if (!playerIds || playerIds.length < 2 || playerIds.length > 5) {
    throw new Error("Must provide between 2 and 5 athlete IDs for comparison.");
  }

  // Retrieve players and ensure they exist
  const players = playerIds.map(id => db.players.find(p => p.id === id)).filter(Boolean);
  
  if (players.length < 2) {
    throw new Error("Not enough valid athletes found to compare.");
  }

  // Ensure all players are of the same sport for fair metric comparison
  const sport = players[0].sport;
  const isSameSport = players.every(p => p.sport === sport);
  if (!isSameSport) {
    throw new Error("Cross-sport comparison is currently unsupported. All athletes must play the same sport.");
  }

  const engine = getEngineForSport(sport);
  const comparisonData = {
    sport,
    athletes: [],
    analysis: {}
  };

  // Extract base metrics
  players.forEach(p => {
    const team = db.teams.find(t => t.id === p.teamId);
    const league = team ? db.leagues.find(l => l.id === team.leagueId) : null;
    
    // Calculate role fit if criteria provided
    let roleFit = null;
    if (scoutCriteria && scoutCriteria.role) {
       roleFit = p.role.toLowerCase() === scoutCriteria.role.toLowerCase() ? 100 : 50;
    }

    // Determine if improving (Recent Form > Performance Score)
    const improvement = (p.recentForm && p.performanceScore) 
      ? p.recentForm - p.performanceScore 
      : 0;

    comparisonData.athletes.push({
      id: p.id,
      name: p.name,
      role: p.role,
      talentIndex: p.talentIndex,
      confidence: p.confidence,
      recentForm: p.recentForm,
      consistency: p.consistency,
      improvement: improvement > 0 ? `+${improvement}` : improvement.toString(),
      competitionStrength: league ? league.strength : "Unknown",
      roleFit: roleFit !== null ? roleFit : "N/A",
      matchesCounted: p.matchesCounted
    });
  });

  // Generate objective summary analysis
  // Find highest talent
  const highestTalent = [...comparisonData.athletes].sort((a, b) => b.talentIndex - a.talentIndex)[0];
  // Find most consistent
  const mostConsistent = [...comparisonData.athletes].sort((a, b) => b.consistency - a.consistency)[0];
  // Find highest potential (biggest improvement + low matches)
  const highestImprovement = [...comparisonData.athletes].sort((a, b) => parseFloat(b.improvement) - parseFloat(a.improvement))[0];

  comparisonData.analysis = {
    highestOverallTalent: `Highest overall talent is ${highestTalent.name} (${highestTalent.talentIndex}).`,
    consistencyLeader: `Most consistent performer is ${mostConsistent.name} (Score: ${mostConsistent.consistency}).`,
    trendLeader: highestImprovement && parseFloat(highestImprovement.improvement) > 0 
      ? `Strongest upward trajectory belongs to ${highestImprovement.name} (${highestImprovement.improvement} recent form delta).`
      : `No significant upward trajectory identified among the candidates.`
  };

  // The LLM would normally consume this JSON payload to generate a conversational narrative
  // For the deterministic engine, we output the raw structured evidence.
  return comparisonData;
}

module.exports = { compareAthletes };
