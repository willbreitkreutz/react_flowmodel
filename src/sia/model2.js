class FlowModel {
  constructor(props) {}

  // assuming we have an array of grid elements
  calculateCreepVelocity() {
    // velocity in meters per year
    const Uc =
      ((-1 * (2 * this.A * (this.p * this.g) ** this.n)) / (this.n + 2)) *
      H ** (this.n + 1) *
      Math.abs(slope) ** (this.n - 1) *
      slope;

    return Uc;
  }

  calculateSlidingVelocity() {
    const Us = [];
  }

  combineCreepAndSliding() {
    const Us = this.calculateCreepVelocity();
    const ratioCreep = 1 - (2 / Math.PI) * Math.atan(Us ^ (2 / 100) ^ 2);
  }

  run() {}
}
