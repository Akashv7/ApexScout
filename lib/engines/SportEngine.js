class SportEngine {
  constructor(sportId) {
    this.sportId = sportId;
  }

  getMetrics() {
    throw new Error("getMetrics() must be implemented by subclass");
  }

  getPositionsOrRoles() {
    throw new Error("getPositionsOrRoles() must be implemented by subclass");
  }

  calculatePerformance(perfData) {
    throw new Error("calculatePerformance() must be implemented by subclass");
  }

  calculateRecentForm(history) {
    throw new Error("calculateRecentForm() must be implemented by subclass");
  }

  calculateConsistency(history) {
    throw new Error("calculateConsistency() must be implemented by subclass");
  }

  calculateRoleFit(player, criteria) {
    throw new Error("calculateRoleFit() must be implemented by subclass");
  }

  // Common calculations across all sports
  calculateCompetitionStrength(league) {
    // Basic Elo average translation logic
    const avgRating = league.averageTeamRating || 1500;
    return Math.max(0, Math.min(100, Math.round((avgRating - 1200) / 6)));
  }

  calculateTalentScore(metrics) {
    // Overridable default implementation for calculating Talent Score based on common factors
    return metrics.performance || 50; 
  }

  calculateConfidence(dataQuality) {
    // Default logic based on matchesCounted
    const matchesCounted = dataQuality.matchesCounted || 0;
    if (matchesCounted >= 15) return "HIGH";
    if (matchesCounted >= 5) return "MEDIUM";
    return "LOW";
  }

  generateEvidence(player) {
    // Generate text evidence why a score was generated
    return `Player has a talent score of ${player.talentIndex} with ${player.matchesCounted || 0} matches.`;
  }
}

module.exports = SportEngine;
