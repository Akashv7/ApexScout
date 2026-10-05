/* ============================================================
   AI SCOUTING REPORT AGENT
   Generates structured, highly detailed scouting reports 
   using strictly verified deterministic intelligence data.
   No LLM hallucinations allowed.
   ============================================================ */

const { classifyTalent } = require("./discoveryAgent");

function generateScoutingReport(db, playerId) {
  const player = db.players.find(p => p.id === playerId);
  if (!player) throw new Error("Player not found");

  const team = db.teams.find(t => t.id === player.teamId);
  const league = team ? db.leagues.find(l => l.id === team.leagueId) : null;
  const leagueStrength = league ? league.strength : 50;

  // Retrieve hidden gem classification if any
  const { classification, evidence } = classifyTalent(player, leagueStrength);

  // Compile the report components
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      reportType: "AI_GENERATED_SCOUTING_REPORT"
    },
    sections: {
      1: {
        title: "Athlete Overview",
        content: `${player.name}, aged ${player.age || "Unknown"}. Based in ${player.location || "Unknown"}.`
      },
      2: {
        title: "Sport and Role",
        content: `Plays ${player.sport}, operating primarily as a ${player.role}.`
      },
      3: {
        title: "Recent Performance",
        content: player.recentForm 
          ? `Current Recent Form score sits at ${player.recentForm} out of 100.`
          : "Insufficient recent match data."
      },
      4: {
        title: "Historical Performance",
        content: player.performanceScore
          ? `Overall historical Performance Score is ${player.performanceScore}. Consistency rating: ${player.consistency}.`
          : "Insufficient historical match data."
      },
      5: {
        title: "Competition Context",
        content: league 
          ? `Currently competing in ${league.name} (Competition Strength Rating: ${league.strength}/100).`
          : "Competition data unavailable."
      },
      6: {
        title: "Strength Indicators",
        content: (player.talentIndex > 75) 
          ? `High overall talent baseline (${player.talentIndex}). Displays ability to dominate at current competition level.`
          : "Average baseline performance."
      },
      7: {
        title: "Development Indicators",
        content: (player.recentForm > player.performanceScore)
          ? `Positive development trajectory identified. Recent form (+${player.recentForm - player.performanceScore}) exceeds historical baseline.`
          : `Performance is stable or declining compared to historical baseline.`
      },
      8: {
        title: "Areas Requiring Further Evaluation",
        content: player.confidence !== "HIGH"
          ? `Small sample size (${player.matchesCounted} matches). Requires further scouting to validate baseline metrics.`
          : `Metrics are highly stable. Recommend advanced video analysis for technique validation.`
      },
      9: {
        title: "Confidence",
        content: `Data Confidence Level: ${player.confidence}`
      },
      10: {
        title: "Verification",
        content: `Trust Status: ${player.trust.toUpperCase()}`
      },
      11: {
        title: "Why the Athlete was Discovered",
        content: classification 
          ? `Flagged as [${classification.toUpperCase()}]. ${evidence.join(" ")}`
          : "Discovered via standard performance metrics query."
      },
      12: {
        title: "Data Limitations",
        content: "Report is strictly derived from statistical inputs and lacks qualitative biomechanical or psychological assessment."
      }
    }
  };

  return report;
}

module.exports = { generateScoutingReport };
