class Sport {
  constructor(id, name, engine) {
    this.id = id;
    this.name = name;
    this.engine = engine;
  }

  getEngine() {
    return this.engine;
  }

  getRoles() {
    return this.engine.getPositionsOrRoles();
  }

  getMetrics() {
    return this.engine.getMetrics();
  }
}

module.exports = Sport;
