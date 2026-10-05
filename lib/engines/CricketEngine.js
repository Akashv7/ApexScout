const SportEngine = require("./SportEngine");

class CricketEngine extends SportEngine {
  constructor() {
    super("cricket");
  }

  getMetrics() {
    return [
      "runs", "wickets", "strike rate", "batting average", "economy", 
      "bowling average", "recent form", "opponent strength"
    ];
  }

  getPositionsOrRoles() {
    return ["batter", "bowler", "all-rounder", "wicketkeeper"];
  }

  calculatePerformance(perfData) {
    if (perfData.type === "batting") {
      return this._battingImpact(perfData);
    } else if (perfData.type === "bowling") {
      return this._bowlingImpact(perfData);
    }
    return 0;
  }

  _battingImpact(perf) {
    if (!perf.runs) return 0;
    const strikeRate = perf.ballsFaced ? (perf.runs / perf.ballsFaced) * 100 : 100;
    return (perf.runs * (strikeRate / 100)) / 50; // normalized around a 50-run, SR-100 knock = impact 1.0
  }

  _bowlingImpact(perf) {
    if (perf.wickets === undefined) return 0;
    const economyPenalty = perf.economy !== undefined ? Math.max(0, (perf.economy - 5) * 0.35) : 0;
    return (perf.wickets * 0.9 - economyPenalty) / 3;
  }

  calculateRecentForm(history) {
    if (!history || history.length === 0) return 0;
    // Get the last up to 3 matches
    const recent = history.slice(-3);
    const avgImpact = recent.reduce((s, v) => s + v, 0) / recent.length;
    return Math.round(Math.max(5, Math.min(99, 50 + avgImpact * 15)));
  }

  calculateConsistency(history) {
    if (!history || history.length < 3) return 0;
    // Calculate standard deviation of impacts to measure consistency
    const avg = history.reduce((s, v) => s + v, 0) / history.length;
    const sqDiffs = history.map(v => Math.pow(v - avg, 2));
    const variance = sqDiffs.reduce((s, v) => s + v, 0) / history.length;
    const stdDev = Math.sqrt(variance);
    // Lower stdDev means higher consistency (maxing out around 99)
    const consistencyScore = Math.max(5, Math.min(99, 100 - (stdDev * 30)));
    return Math.round(consistencyScore);
  }

  calculateRoleFit(player, criteria) {
    // Basic implementation for Phase 1
    return 0;
  }
}

module.exports = CricketEngine;
