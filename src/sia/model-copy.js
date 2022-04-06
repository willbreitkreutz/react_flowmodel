/**
 * This handles API differences between the Node.js and browser JS runtimes
 * Not part of the model
 */
let setInt, clearInt;
if (typeof window !== "undefined") {
  setInt = window.setInterval;
  clearInt = window.clearInterval;
} else {
  setInt = setInterval;
  clearInt = clearInterval;
}

/**
 * 1D Shallow Ice Approximation Flow Model
 * by @willbreitkreutz
 *
 * Implemented as a JS class.
 *
 * Usage:
 *
 * ```
 * const model = new FlowModel(config);
 * model.start()
 * // run it for a bit then pause
 * model.pause()
 * // start it back up
 * model.start()
 * ```
 */
class FlowModel {
  /**
   * When creating a new FlowModel instance you must provide a configuration object
   * that is fed to the constructor function as the props object.
   *
   * We set a number of defaults, but most can be overridden as needed.
   *
   * The only required option is the onChange callback, without this, the model
   * will run, but you wont see any output, it'll just be doing the work for the fun of it.
   */
  constructor(props) {
    // Defaults
    const defaults = {
      A: 3e-16, // Ice softness
      As: 10000, // Sliding coeficient
      n: 3, // Glen's n
      p: 917, // Density of ice
      pw: 1025, // Density of water
      g: 9.81, // Gravitational acceleration
      Wb: 250, // half-width, in meters
      tb_dry: 1, // what portion of the driving stress does basal drag support when base is dry/frozen
      tb_wet: 1, // what portion of the driving stress does basal drag support when base is saturated
      pct_s: 0.5, // what portion of melt makes it to the base
      K: 0.5, // hydraulic conductivity of subglacial environment
      W0: 2, // max effective thickness of subglacial water, meters
      modelLength: 100, // in KM, important because we convert to meters below
      elementCount: 200, // number of model elements
      iterationsPerYear: 365,
      iceConstructor: function () {
        return 0;
      },
      bedConstructor: function () {
        return 0;
      },
      waterConstructor: function () {
        return 0;
      },
      massBalanceFunc: null,
      onChange: function (data) {
        // doing nothing right now
      },
    };

    const config = Object.assign({}, defaults, props);

    // Flow law constants
    this.A = config.A;
    this.As = config.As;
    this.n = config.n;
    this.p = config.p;
    this.pw = config.pw;
    this.g = config.g;
    this.Wb = config.Wb;
    this.tb_dry = config.tb_dry;
    this.tb_wet = config.tb_wet;
    this.pct_s = config.pct_s;
    this.K = config.K;
    this.W0 = config.W0;

    // Calculate our constant soup for diffusivity, this way you only do the math once
    this.Afl = (2 * this.A * (this.p * this.g) ** this.n) / (this.n + 2);

    // Set up our model domain
    this.modelLength = config.modelLength; // kilometers
    this.elementCount = config.elementCount; // number of ice columns being modeled
    this.dx = (this.modelLength / this.elementCount) * 1000; // change in the x direction in METERS between ice column midpoints
    this.iterationsPerYear = config.iterationsPerYear; // default to once a day

    // Internal time tracking stuff
    this.iteration = 0; // current model iteration
    this.t = 0; // model time in years
    this.dt = 1 / this.iterationsPerYear; // change in time per calculation
    this.timer = null; // this will hold our timeout handler so we can pause it

    // Internal containers
    this.elements = []; // container for model elements
    this.midpoints = []; // container for midpoints, where we do diffusivity

    // Set up any user-provided boundary / initial state calculators
    this.iceConstructor = config.iceConstructor;
    this.bedConstructor = config.bedConstructor;
    this.waterConstructor = config.waterConstructor;
    this.massBalanceFunc = config.massBalanceFunc || this.getMassBalanceGeneric;
    this.onChange = config.onChange;

    // Run our initial state constructors to set up any initial conditions
    // See these methods below
    this.initializeElements(); // create all of our gridpoints
    this.initializeMidpoints(); // create all of our midpoints
    this.initializeIceSurface(); // build out any existing ice surface
    this.initializeBedSurface(); // build out any bed surface geometry
    this.initializeWaterSurface(); // get initial water elevations

    // Now you're ready to run it, but you have to call that in your code
    // Run model.start() and go to that, the last method in the class,
    // to read through the code
  }

  /**
   * Create default elements for each gridpoint in the model
   */
  initializeElements = () => {
    for (var i = 0; i < this.elementCount; i++) {
      this.elements[i] = {
        iceElevation: 0,
        bedElevation: 0,
        waterElevation: 0,
        effective_pressure: 0,
        diffusivity_up: 0,
        flux_up: 0,
        diffusivity_down: 0,
        flux_down: 0,
        totalFlux: 0,
        massBalanceFlux: 0,
        iteration: 0,
        deltaH: 0,
        deformation_velocity: 0,
        sliding_velocity: 0,
        Qw_up: 0,
        Qw_down: 0,
      };
    }
  };

  /**
   * Create default midpoints for each location between gridpoints
   */
  initializeMidpoints = () => {
    for (var i = 0; i < this.elementCount - 1; i++) {
      this.midpoints[i] = {
        elementDown: i + 1,
        elementUp: i,
        diffusivity: 0,
        slope: 0,
        flux: 0,
        deformation_velocity: 0,
        sliding_velocity: 0,
        Qw: 0,
        Ne: 0,
      };
    }
  };

  /**
   * Build out ice surface if there is one
   */
  initializeIceSurface = () => {
    this.elements.forEach((el, i) => {
      el.iceElevation = this.iceConstructor(i);
    });
  };

  /**
   * Build out the bed geometry if there is one
   */
  initializeBedSurface = () => {
    this.elements.forEach((el, i) => {
      el.bedElevation = this.bedConstructor(i);
    });
  };

  /**
   * Build out any water body geometry
   */
  initializeWaterSurface = () => {
    this.elements.forEach((el, i) => {
      el.waterElevation = this.waterConstructor(i);
    });
  };

  /**
   * STEP 2 - Calculate our diffusivity stuff
   */
  calculateMidpoints = () => {
    // for each model midpoint
    for (var i = 0; i < this.midpoints.length; i++) {
      // grab our current midpoint
      const midpoint = this.midpoints[i];

      // get our model elements on either side
      const elementUp = this.elements[midpoint.elementUp];
      const elementDown = this.elements[midpoint.elementDown];

      // get info from our model elements
      const iceElevationUp = elementUp.iceElevation;
      const iceElevationDown = elementDown.iceElevation;

      const bedElevationUp = elementUp.bedElevation;
      const bedElevationDown = elementDown.bedElevation;

      const thicknessUp = iceElevationUp - bedElevationUp;
      const thicknessDown = iceElevationDown - bedElevationDown;

      const waterElevationUp = elementUp.waterElevation;
      const waterElevationDown = elementDown.waterElevation;

      const depthUp = waterElevationUp - bedElevationUp;
      const depthDown = waterElevationDown - bedElevationDown;

      // calculate our slope
      const slope = (iceElevationDown - iceElevationUp) / this.dx;

      // calculate our mean thickness
      const H = (thicknessDown + thicknessUp) / 2;

      // calculate mean water depth (effective thickness of water)
      const W = (depthUp + depthDown) / 2;

      // effective pressure
      const Ne = this.p * this.g * H - this.pw * this.g * W;

      // water pressures
      const pressureUp = 0.95 * this.p * this.g * H * (depthUp / this.W0);
      const pressureDown = 0.95 * this.p * this.g * H * (depthDown / this.W0);

      // calculate sliding speed
      const Us = Ne > 0 ? this.As * Ne ** -0.5 : 0;

      // What ratio of creep to sliding to use
      const ratioCreep = 1 - (2 / Math.PI) * Math.atan(Us ** 2 / 100 ** 2);

      // calculate diffusivity
      const D =
        H ** 4 *
        Math.abs(slope) ** 2 *
        ((2 / 5) * this.A * (this.p * this.g) ** 3 * H * (2 * this.Wb));

      // calculate depth averaged creep velocity
      const U =
        -1 *
        this.Afl *
        H ** (this.n + 1) *
        Math.abs(slope) ** (this.n - 1) *
        slope;

      // calculate flux in the downstream direction
      // const flux = -1 * ratioCreep * (D * slope) + (1 - ratioCreep) * (Us * H);
      const flux = -1 * D * slope + Us * H;

      // calculate our water flux
      const Qw = W * this.K * ((pressureDown - pressureUp) / this.dx);

      // set our midpoint values for plotting
      midpoint.diffusivity = D;
      midpoint.slope = slope;
      midpoint.flux = -1 * flux;
      // midpoint.velocity = ratioCreep * U + (1 - ratioCreep) * Us;
      midpoint.velocity = U + Us;
      midpoint.sliding_velocity = Us;
      midpoint.Qw = Qw;
      midpoint.Ne = Ne;

      // populate our element on the upstream side
      elementUp.diffusivity_down = D; // store our diffusivity for plotting
      elementUp.flux_down = -1 * flux; // flux_down is negative since our slope is negative
      elementUp.Qw_down = Qw;

      // populate our element on the downstream side
      elementDown.diffusivity_up = D; // store our diffusivity for plotting
      elementDown.flux_up = flux; // positive since it's an incoming value
      elementDown.Qw_up = -1 * Qw;

      // if we get a busted diffusivity then it means our model is unstable
      if (isNaN(D) || isNaN(flux)) {
        this.pause();
        console.log(midpoint);
      }
    }
  };

  /**
   * Calculate our mass balance flux, we take a precipitation value
   * and then multiply by this.dx to get a quantity so that we can plot
   * the total flux as a quantity and see the actual change that it accounts for
   */
  getMassBalanceGeneric = (i) => {
    const y = 2 - (i / (0.4 * this.elementCount)) ** 3;
    return y * this.dx * 2 * this.Wb;
  };

  /**
   * Get mass balance using our built in generic function or a user provided one
   * Calls the mass balance function with the location along the flowline and
   * the current month
   */
  getMassBalance = (i) => {
    const month = Math.floor(
      ((this.iteration % this.iterationsPerYear) / this.iterationsPerYear) * 12
    );
    const year = Math.floor(this.iteration / this.iterationsPerYear);
    return this.massBalanceFunc(i, month, year);
  };

  /**
   * STEP 3 - Calculate our new ice surface using the data
   * derived at our midpoints
   */
  calculateElements = () => {
    for (var i = 0; i < this.elements.length; i++) {
      // get our element
      const element = this.elements[i];

      // handle our lower boundary condition, not sure I like this approach
      // but for now just use an equivalent flux down so that we let any influx out
      if (i === this.elements.length - 1) {
        element.flux_down = element.flux_up;
      }

      // increment our iteration counter
      element.iteration = element.iteration + 1;

      // get our mass balance
      element.massBalanceFlux = this.getMassBalance(i);

      // how much water makes it to the base
      const meltFlux =
        element.massBalanceFlux < 0 ? -1 * element.massBalanceFlux : 0;
      const newWaterElevation =
        element.waterElevation +
        ((element.Qw_up + element.Qw_down + this.pct_s * meltFlux) / this.dx) *
          this.dt;
      element.waterElevation =
        newWaterElevation <= element.bedElevation
          ? element.bedElevation
          : newWaterElevation;

      // get our total flux
      element.totalFlux =
        element.flux_up + element.flux_down + element.massBalanceFlux;

      // convert total flux to a change in thickness and add that to our ice elevation
      element.deltaH = (element.totalFlux / this.dx / (2 * this.Wb)) * this.dt; // get the change within our timestep

      // update our element, if our ice is no taller than our bed, then keep bed elevation
      const newIceElevation = element.iceElevation + element.deltaH;
      element.iceElevation =
        newIceElevation <= element.bedElevation
          ? element.bedElevation
          : newIceElevation;

      if (isNaN(newIceElevation)) {
        console.log("Broked");
      }

      // convert total flux to a velocity
      const H = element.iceElevation - element.bedElevation;
      element.velocity =
        H > 0
          ? (element.totalFlux / H / (2 * this.Wb)) * this.iterationsPerYear
          : 0;
    }
  };

  /**
   * Kill the timer, stop the model
   */
  pause = () => {
    if (this.timer) clearInt(this.timer);
    this.timer = null;
  };

  /**
   * STEP 1, START HERE
   * Creates a timer that will try and run each model iteration once every millisecond,
   * Our computer won't do the math that fast, so this essentially just lines up the work
   * and let's the computer go as fast as it can in this single thread.
   */
  start = () => {
    // Create our timer that will try to run a function every millisecond
    this.timer = setInt(() => {
      ++this.iteration; // increment our counter
      this.t = this.iteration / this.iterationsPerYear; // calculate t in model years
      this.calculateMidpoints(); // loop through our midpoints
      this.calculateElements(); // loop through our model elements
      // Call the change handler with the accumulated data
      // the handler will get an object containing timing info and arrays of elements and midpoints
      // as they exist for this step
      this.onChange({
        i: this.iteration,
        t: this.t,
        elements: [...this.elements],
        midpoints: [...this.midpoints],
      });
      // do it all again...
    }, 0);
  };
}

module.exports = FlowModel;
