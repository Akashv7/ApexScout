class Athlete {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.dateOfBirth = data.dateOfBirth || data.age; // mapping old 'age' for now
    this.nationality = data.nationality || data.location; // mapping old 'location' for now
    this.sport = data.sport;
    this.role = data.role; // position/role
    this.teamId = data.teamId;
    this.competitionId = data.competitionId || data.leagueId; // mapping old 'leagueId'
    
    // Core attributes
    this.bio = data.bio || "";
    this.verificationStatus = data.verificationStatus || "unverified";
    this.trustLevel = data.trustLevel || data.trust || "low";
    
    // Intelligence attributes (Calculated via SportEngines)
    this.talentScore = data.talentIndex || null; // mapping old 'talentIndex'
    this.performanceScore = data.performanceScore || null;
    this.recentForm = data.recentForm || null;
    this.consistency = data.consistency || null;
    this.confidence = data.confidence || "LOW";
    this.matchesCounted = data.matchesCounted || 0;
  }

  // Helper method to convert back to a plain object for JSON storage
  toJSON() {
    return { ...this };
  }
}

module.exports = Athlete;
