class Competition {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.sport = data.sport || "Cricket"; // Default for legacy data
    this.region = data.region;
    this.format = data.format;
    
    // Derived Intelligence
    this.strength = data.strength || 50; 
  }

  toJSON() {
    return { ...this };
  }
}

module.exports = Competition;
