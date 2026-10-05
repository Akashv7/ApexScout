const SportEngine = require("./SportEngine");

class TennisEngine extends SportEngine {
  constructor() {
    super("tennis");
  }

  getMetrics() {
    return [
      "aces", "double faults", "first serve percentage", 
      "win percentage on first serve", "break points saved", 
      "return games won", "unforced errors"
    ];
  }

  getPositionsOrRoles() {
    return ["singles player", "doubles player"];
  }

  calculatePerformance(perfData) {
    if (!perfData) return 0;

    // Normalizing tennis metrics
    const serveImpact = 
      (perfData.aces || 0) * 1.2 - 
      (perfData.doubleFaults || 0) * 1.5 + 
      ((perfData.firstServePercentage || 0) / 100) * 0.5 + 
      ((perfData.winPercentageOnFirstServe || 0) / 100) * 1.0;

    const returnImpact = 
      (perfData.returnGamesWon || 0) * 2.0;
      
    const resilienceImpact = 
      (perfData.breakPointsSaved || 0) * 1.5;

    const errorPenalty = (perfData.unforcedErrors || 0) * 0.5;

    let impact = serveImpact + returnImpact + resilienceImpact - errorPenalty;

    // Different weights for doubles (e.g., net play matters more, but we'll simplify here)
    if (perfData.role === "doubles player") {
      impact = impact * 1.1; 
    }

    // Normalize roughly so that a strong game lands around 1.0 
    return Math.max(0, impact / 10);
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
    return 0; // Baseline implementation
  }
}

module.exports = TennisEngine;
