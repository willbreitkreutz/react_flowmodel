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
    // Flags
    this.sliding = props.sliding || false;

    // Defaults
    const defaults = {
      A: 3e-16,
      As: 73,
      n: 3,
      p: 917,
      g: 9.81,
      Wb: 250, // half-width, in meters
      modelLength: 100, // in KM, important because we convert to meters below
      elementCount: 200,
      iterationsPerYear: 365,
      iceConstructor: function () {
        return 0;
      },
      bedConstructor: function () {
        return 0;
      },
      massBalanceFunc: null,
      onChange: function (data) {
        // doing nothing right now
      },
    };

    const config = Object.assign({}, defaults, props);

    // Flow law constants
    this.A = config.A; // Ice softness
    // A_s such that if Tb =100 kPa and HAB=100 m, Us=1000 myr, from their chart === 10000
    this.As = config.As; // Sliding Parameter
    this.n = config.n; // Glen's n
    this.p = config.p; // Density of Ice
    this.g = config.g; // Gravitational acceleration
    this.Wb = config.Wb; // Half width at the base in meters

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
    this.massBalanceFunc = config.massBalanceFunc || this.getMassBalanceGeneric;
    this.onChange = config.onChange;

    // Run our initial state constructors to set up any initial conditions
    // See these methods below
    this.initializeElements(); // create all of our gridpoints
    this.initializeMidpoints(); // create all of our midpoints
    this.initializeIceSurface(); // build out any existing ice surface
    this.initializeBedSurface(); // build out any bed surface geometry

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
        diffusivity_up: 0,
        flux_up: 0,
        diffusivity_down: 0,
        flux_down: 0,
        totalFlux: 0,
        massBalanceFlux: 0,
        iteration: 0,
        deltaH: 0,
        velocity: 0,
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
        velocity: 0,
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

      // calculate our slope
      const slope = (iceElevationDown - iceElevationUp) / this.dx;

      // calculate our mean thickness
      const H = (thicknessDown + thicknessUp) / 2;

      // calculate diffusivity
      const D =
        H ** 4 *
        Math.abs(slope) ** 2 *
        ((2 / 5) * this.A * (this.p * this.g) ** 3 * H * (2 * this.Wb) +
          this.As * (2 * this.Wb));
      // const D = this.sliding
      //   ? H ** (this.n + 1) *
      //     Math.abs(slope) ** (this.n - 1) *
      //     (this.Afl * H * (2 * this.Wb) + this.As * (2 * this.Wb))
      //   : this.Afl * H ** (this.n + 2) * Math.abs(slope) ** (this.n - 1);

      // calculate depth averaged velocity
      const U =
        -1 *
        this.Afl *
        H ** (this.n + 1) *
        Math.abs(slope) ** (this.n - 1) *
        slope;

      // calculate flux in the downstream direction
      const flux = D * slope; // going to be a negative number if slope is downstream

      // set our midpoint values for plotting
      midpoint.diffusivity = D;
      midpoint.slope = slope;
      midpoint.flux = flux;
      midpoint.velocity = U;

      // populate our element on the upstream side
      elementUp.diffusivity_down = D; // store our diffusivity for plotting
      elementUp.flux_down = flux; // flux_down is negative since our slope is negative

      // populate our element on the downstream side
      elementDown.diffusivity_up = D; // store our diffusivity for plotting
      elementDown.flux_up = -1 * flux; // make flux_up positive since it's an incoming value

      // if we get a busted diffusivity then it means our model is unstable
      if (isNaN(D)) {
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
   * Calculate our mass balance flux, we take a precipitation value
   * and then multiply by this.dx to get a quantity so that we can plot
   * it and see the actual change in area that it accounts for
   *
   * This version adds some janky seasonality to the thing, basically we cycle
   * our equilibrium point up and down the line every 500 years
   */
  getMassBalanceIceAge = (i) => {
    let iceAgeCoef = Math.sin((Math.ceil(this.t) / 500) * (2 * Math.PI));
    iceAgeCoef = Math.round(iceAgeCoef * 100) / 100;
    const y = 2 - (i / ((0.3 + 0.2 * iceAgeCoef) * this.elementCount)) ** 3;
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
