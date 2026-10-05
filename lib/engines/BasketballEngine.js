const SportEngine = require("./SportEngine");

class BasketballEngine extends SportEngine {
  constructor() {
    super("basketball");
  }

  getMetrics() {
    return [
      "points", "rebounds", "assists", "steals", "blocks", 
      "turnovers", "shooting efficiency", "minutes", "defensive metrics"
    ];
  }

  getPositionsOrRoles() {
    return [
      "point guard", "shooting guard", "small forward", 
      "power forward", "center"
    ];
  }

  calculatePerformance(perfData) {
    if (!perfData.minutes || perfData.minutes === 0) return 0;
    
    // Normalize per 36 minutes (standard basketball stat normalization)
    const per36 = (stat) => (stat || 0) / (perfData.minutes / 36);

    let impact = 0;
    
    // Efficiency calculation (e.g. True Shooting conceptually, simplistic here)
    const efficiencyMult = perfData.shootingEfficiency ? (perfData.shootingEfficiency / 50) : 1.0; 

    // Base contribution
    const scoringImpact = per36(perfData.points) * 1.0 * efficiencyMult;
    const playmakingImpact = per36(perfData.assists) * 1.5 - per36(perfData.turnovers) * 1.0;
    const reboundingImpact = per36(perfData.rebounds) * 1.2;
    const defensiveImpact = per36(perfData.steals) * 2.0 + per36(perfData.blocks) * 2.0 + per36(perfData.defensiveMetrics) * 1.0;

    // Role-based weighting
    if (perfData.role === "point guard") {
      impact = scoringImpact * 0.8 + playmakingImpact * 1.5 + defensiveImpact * 1.0 + reboundingImpact * 0.2;
    } else if (perfData.role === "shooting guard") {
      impact = scoringImpact * 1.5 + playmakingImpact * 0.8 + defensiveImpact * 1.0 + reboundingImpact * 0.4;
    } else if (perfData.role === "small forward") {
      impact = scoringImpact * 1.2 + playmakingImpact * 0.8 + defensiveImpact * 1.2 + reboundingImpact * 0.8;
    } else if (perfData.role === "power forward") {
      impact = scoringImpact * 1.0 + playmakingImpact * 0.5 + defensiveImpact * 1.2 + reboundingImpact * 1.5;
    } else if (perfData.role === "center") {
      impact = scoringImpact * 1.0 + playmakingImpact * 0.3 + defensiveImpact * 1.5 + reboundingImpact * 1.8;
    } else {
      impact = scoringImpact + playmakingImpact + reboundingImpact + defensiveImpact;
    }

    // Normalize roughly so that a "good" game lands around 1.0
    return impact / 30;
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
    // Basic implementation for Phase 5
    return 0;
  }
}

module.exports = BasketballEngine;
