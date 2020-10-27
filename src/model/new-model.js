let setInt, clearInt;
if (typeof window !== "undefined") {
  setInt = window.setInterval;
  clearInt = window.clearInterval;
} else {
  setInt = setInterval;
  clearInt = clearInterval;
}

// ratio CFL condition, satisfy for a diffusion equation, problem
// here is that D is not constant so the ratio is hard to figure out...

class FlowModel {
  constructor(props) {
    // configuration
    this.props = props;

    // model domain
    this.colCount = props.colCount || 1000;
    this.modelLength = props.modelLength || 100;
    this.t = props.t || 0;
    this.dt = props.dt || 1 / 365;
    this.dx = (this.modelLength / this.colCount) * 1000;
    this.massBalanceQuantity = props.massBalanceQuantity || 0.3;

    // constants
    this.A = props.A || 10e-16;
    this.n = props.n || 3;
    this.p = props.p || 917;
    this.g = props.g || 9.81;
    this.Afl = (2 * this.A * (this.p * this.g) ** this.n) / (this.n + 2);

    // processing stuff
    this.timer = null;
    this.lateralFluxes = [];
    this.fluxes = [];
    this.nextFlux = [];
    this.iceElevation = props.iceElevation || [];
    this.nextIce = [];
    this.baseElevation = props.baseElevation || [];
    this.onChange = props.onChange || null;
    this.changeInterval = props.changeInterval || 100;

    // allow function for mass balance, or use internal 'exponential 'or 'linear'
    // default is linear unless another is specified or supplied
    this.massBalance = [];
    var generateMassBalanceLinear = function (i) {
      const y = (-2 / this.colCount) * i + 1;
      return y;
    }.bind(this);

    var generateMassBalanceExponential = function (i) {
      const y = 2 - (i / (0.6 * this.colCount)) ** 3;
      return y;
    }.bind(this);

    var generateMassBalanceFn = generateMassBalanceLinear;

    if (props.massBalance) {
      if (typeof props.massBalance === "function") {
        generateMassBalanceFn = props.massBalance;
      } else if (typeof props.massBalance === "string") {
        if (props.massBalance === "exponential") {
          generateMassBalanceFn = generateMassBalanceExponential;
        }
      } else if (
        typeof props.massBalance === "object" &&
        !!props.massBalance.length
      ) {
        this.massBalance = props.massBalance;
        generateMassBalanceFn = (i) => {
          return props.massBalance[i];
        };
      }
    }

    for (var i = 0; i < this.colCount; i++) {
      this.massBalance[i] = generateMassBalanceFn(i) * this.massBalanceQuantity;
    }

    // calculate our initial ice profile, default is no ice
    this.iceElevation = [];
    var generateIceElevationFn = function (i) {
      return i * 0;
    };
    if (props.iceElevation) {
      if (typeof props.iceElevation === "function") {
        generateIceElevationFn = props.iceElevation;
      } else if (
        typeof props.iceElevation === "object" &&
        !!props.iceElevation.length
      ) {
        generateIceElevationFn = (i) => {
          return props.iceElevation[i];
        };
      }
    }
    // eslint-disable-next-line
    for (var i = 0; i < this.colCount; i++) {
      this.iceElevation[i] = generateIceElevationFn(i);
    }
    this.nextIce = [...this.iceElevation];

    // set up our initial base elevation, zero as default
    this.baseElevation = [];
    var generateBaseElevationFn = function (i) {
      return i * 0;
    };
    if (props.baseElevation) {
      if (typeof props.baseElevation === "function") {
        generateBaseElevationFn = props.baseElevation;
      } else if (
        typeof props.baseElevation === "object" &&
        !!props.baseElevation.length
      ) {
        generateBaseElevationFn = (i) => {
          return props.baseElevation[i];
        };
      }
    }
    // eslint-disable-next-line
    for (var i = 0; i < this.colCount; i++) {
      this.baseElevation[i] = generateBaseElevationFn(i);
    }
  }

  getFlux = (Hu, Hd, hu, hd) => {
    const { Afl, dx, n } = this;
    // if there's no ice, bail
    if (!Hu && !Hd) return 0;
    // what is our surface slope from upstream to down (negative means upstream is higher)
    const dh = hd - hu; // m
    // use the mean thickness for big H
    const H = (Hd + Hu) / 2; // m
    // calculate our diffusivity between these columns
    let D = Afl * H ** (n + 2) * Math.abs(dh / dx) ** (n - 1);
    // get the flux between columns
    return (D * dh) / dx;
  };

  calculateLateralFluxes = () => {
    this.lateralFluxes[0] = 0;
    for (var i = 0; i < this.colCount; i++) {
      if (i > 0) {
        this.lateralFluxes[i] = this.getFlux(
          this.iceElevation[i - 1] - this.baseElevation[i - 1],
          this.iceElevation[i] - this.baseElevation[i],
          this.iceElevation[i - 1],
          this.iceElevation[i]
        );
      }
    }
    this.lateralFluxes.push(0);
  };

  getTotalFlux = (i) => {
    const fluxUpstream = this.lateralFluxes[i];
    const fluxDownstream = this.lateralFluxes[i + 1];
    const fluxMassBalance = this.massBalance[i] * this.dx;
    const totalFlux = fluxUpstream + fluxDownstream + fluxMassBalance;
    return totalFlux;
  };

  reset = () => {
    console.log("just refresh the page, not implemented yet");
  };

  pause = () => {
    if (this.timer) {
      clearInt(this.timer);
    }
  };

  start = () => {
    this.timer = setInt(() => {
      this.calculateLateralFluxes();
      for (let i = 0; i < this.colCount; i++) {
        const H = this.iceElevation[i] - this.baseElevation[i];
        const flux = this.getTotalFlux(i);
        this.nextFlux[i] = (flux / this.dx) * this.dt;
        let newH = H + (flux / this.dx) * this.dt;
        this.nextIce[i] =
          newH < 0 ? this.baseElevation[i] : newH + this.baseElevation[i];
      }
      this.t++;
      this.iceElevation = [...this.nextIce];
      this.fluxes = [...this.nextFlux];
      if (this.onChange && typeof this.onChange === "function") {
        if (this.t % this.changeInterval === 0)
          this.onChange({
            t: this.t,
            ice: this.iceElevation,
            base: this.baseElevation,
            massBalance: this.massBalance,
            fluxes: this.fluxes,
          });
      }
    }, 1);
  };
}

module.exports = FlowModel;
