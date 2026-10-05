const SportEngine = require("./SportEngine");

class FootballEngine extends SportEngine {
  constructor() {
    super("football");
  }

  getMetrics() {
    return [
      "goals", "assists", "xG", "xA", "key passes", 
      "progressive passes", "tackles", "interceptions", 
      "pressing", "minutes"
    ];
  }

  getPositionsOrRoles() {
    return ["goalkeeper", "defender", "midfielder", "winger", "forward"];
  }

  calculatePerformance(perfData) {
    if (!perfData.minutes || perfData.minutes === 0) return 0;
    
    // Normalize per 90 minutes
    const per90 = (stat) => (stat || 0) / (perfData.minutes / 90);

    let impact = 0;
    
    // Attacking Contribution
    const attackingImpact = 
      per90(perfData.goals) * 1.5 + 
      per90(perfData.assists) * 1.0 + 
      per90(perfData.xG) * 0.5 + 
      per90(perfData.xA) * 0.4 +
      per90(perfData.keyPasses) * 0.2 +
      per90(perfData.progressivePasses) * 0.1;

    // Defensive Contribution
    const defensiveImpact = 
      per90(perfData.tackles) * 0.3 + 
      per90(perfData.interceptions) * 0.3 + 
      per90(perfData.pressing) * 0.1;

    // Position-based weighting
    if (["forward", "winger"].includes(perfData.role)) {
      impact = attackingImpact * 1.2 + defensiveImpact * 0.4;
    } else if (perfData.role === "midfielder") {
      impact = attackingImpact * 0.8 + defensiveImpact * 0.8;
    } else if (perfData.role === "defender") {
      impact = attackingImpact * 0.2 + defensiveImpact * 1.5;
    } else if (perfData.role === "goalkeeper") {
      // Simplistic GK impact based on assumed available stats for now
      impact = defensiveImpact * 1.5; 
    } else {
      impact = attackingImpact * 0.7 + defensiveImpact * 0.7; // fallback
    }

    // Normalize roughly so that a "good" game lands around 1.0 (similar to Cricket baseline)
    return impact / 2;
  }

  calculateRecentForm(history) {
    if (!history || history.length === 0) return 0;
    const recent = history.slice(-3);
    const avgImpact = recent.reduce((s, v) => s + v, 0) / recent.length;
    return Math.round(Math.max(5, Math.min(99, 50 + avgImpact * 15)));
  }

  calculateConsistency(history) {
    if (!history || history.length < 3) return 0;
    const avg = history.reduce((s, v) => s + v, 0) / history.length;
    const sqDiffs = history.map(v => Math.pow(v - avg, 2));
    const variance = sqDiffs.reduce((s, v) => s + v, 0) / history.length;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = Math.max(5, Math.min(99, 100 - (stdDev * 30)));
    return Math.round(consistencyScore);
  }

  calculateRoleFit(player, criteria) {
    // Basic implementation for Phase 4
    return 0;
  }
}

module.exports = FootballEngine;
