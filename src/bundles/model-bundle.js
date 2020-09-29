export default {
  name: "model",

  getReducer: () => {
    const initialData = {
      col: 1000,
      len: 10,
      tMax: 4000,
      A: 10e-16, // Pa^-3 yr^-1
      n: 3,
      p: 917, // kg m^-3
      g: 9.81, // m s^-2
      secPerYear: 31556926,
      massBalanceQuantity: 2, // m/yr
      revision: 0,
      profile: {},
    };

    return (state = initialData, { type, payload }) => {
      switch (type) {
        case "MODEL_INIT_COMPLETE":
        case "MODEL_UPDATE_PROFILE":
          return Object.assign({}, state, payload);
        default:
          return state;
      }
    };
  },

  selectModelCol: (state) => {
    return state.model.col;
  },

  selectModelDeltaX: (state) => {
    const { col, len } = state.model;
    return (len / col) * 1000; // meters
  },

  selectModelAParam: (state) => {
    const { A, secPerYear, p, g, n } = state.model;
    return (2 * (A / secPerYear) * Math.pow(p * g, n)) / (n + 2);
  },

  selectMassBalanceQuantity: (state) => {
    return state.model.massBalanceQuantity;
  },

  selectModelProfile: (state) => {
    return state.model.profile;
  },

  selectModelRevision: (state) => {
    return state.model.revision;
  },

  selectModelSeries: (state) => {
    const { profile } = state.model;
    const data = {
      x: [],
      y: [],
    };

    Object.keys(profile).forEach((i) => {
      data.x.push(i);
      data.y.push(profile[i]);
    });

    return data;
  },

  doModelInit: () => ({ dispatch, store }) => {
    const col = store.selectModelCol();
    const massBalance = [];
    for (var i = 0; i < col; i++) {
      massBalance[i] = (-2 / col) * i + 1;
    }

    let profile = [];
    // initally start with no glacier and see what happens
    const getProfile = function (i) {
      return 0;
    };
    for (var i = 0; i < col; i++) {
      profile[i] = getProfile(i);
    }

    dispatch({
      type: "MODEL_INIT_COMPLETE",
      payload: {
        massBalance: massBalance,
        profile: profile,
      },
    });
  },

  doModelGetFlux: (Hu, Hd) => ({ dispatch, store }) => {
    // if there's no ice, bail
    if (!Hu && !Hd) return 0;
    // what is our change in thickness from upstream to down (negative means upstream is higher)
    const dH = Hd - Hu; // m
    // use the average thickness for big H, there's probably a better way...
    const H = (Hd + Hu) / 2; // m
    // calculate our diffusivity between these columns
    const D = Afl * Math.pow(H, n + 2) * Math.pow(Math.abs(dH / dx), n - 1);
    // get the flux between columns
    // if (D * (dH) > 1000) {
    //   console.log(thickness.length, thicknessNext.length);
    //   console.log("where");
    // }
    return (D * dH) / dx ** 2;
  },

  doModelRunTimestep: () => ({ dispatch, store }) => {},

  doModelRun: () => ({ dispatch, store }) => {
    /**
     * MODEL PARAMETERS
     * Ok, here we go, first we lay out all of our terms
     */
    // define our model domain, the number of columns in the x direction
    const col = 1000;

    // define the length of our model domain in kilometers
    const len = 10;

    // so our change in x for each column is:
    const dx = (len / col) * 1000; // meters

    // define the number of steps to run, t will run at the speed of the browser and will
    // depend on your machines capability.  each t will be a simulation of 1 year
    const tMax = 4000;

    // Glen's flow law constants
    const A = 10e-16; // Pa^-3 yr^-1
    const n = 3;
    const p = 917; // kg m^-3
    const g = 9.81; // m s^-2
    const secPerYear = 31556926; // s

    const Afl = (2 * (A / secPerYear) * Math.pow(p * g, n)) / (n + 2);

    // const Afl = (2 * (A / secPerYear)) / (n + 2)) * Math.pow(p * g, n);

    /**
     * FLUXES
     */
    // the initial mass balance curve is a linear 1 to -1 throughout our model domain
    // with a mutable annual quantity
    const massBalanceQuantity = 2; // m/yr
    const massBalance = [];
    for (var i = 0; i < col; i++) {
      massBalance[i] = (-2 / col) * i + 1;
    }

    /**
     * GLACIER PROPERTIES
     */
    // the initial thickness of our glacier
    let thickness = [];
    const getThickness = function (i) {
      // initally start with no glacier and see what happens
      return 0;
    };
    for (var i = 0; i < col; i++) {
      thickness[i] = getThickness(i);
    }

    // create a copy of thickness that we can use as a staging location for each timestep
    let thicknessNext = [...thickness];

    /**
     * PROCESSING
     */
    const getFlux = function (Hu, Hd) {};

    const getFluxUpstream = function (i) {
      if (i === 0) return 0;
      const f = -1 * getFlux(thickness[i - 1], thickness[i]);
      // if (i === 0) console.log(f);
      return f;
    };

    const getFluxDownstream = function (i) {
      if (i === col - 1) return 0;
      const f = getFlux(thickness[i], thickness[i + 1]);
      // if (i === 0) console.log(f);
      return f;
    };

    const getFluxMassBalance = function (i) {
      const f = massBalance[i] * massBalanceQuantity * dx; // m2
      // if (i === 0) console.log(f);
      return f;
    };

    const getTotalFlux = function (i) {
      const fluxU = getFluxUpstream(i);
      const fluxD = getFluxDownstream(i);
      const fluxMb = getFluxMassBalance(i);
      const totalFlux = fluxU + fluxD + fluxMb;
      // if (i === 499) console.log(499, fluxU, fluxD, fluxMb);
      // if (i === 500) console.log(500, fluxU, fluxD, fluxMb);
      // if (i === 501) console.log(501, fluxU, fluxD, fluxMb);
      // if (totalFlux === Infinity) {
      //   console.log(thickness.length, thicknessNext.length);
      //   console.log("where");
      // }
      return totalFlux;
    };

    /**
     * LOOP
     */
    for (var t = 0; t < tMax; t++) {
      for (var i = 0; i < col; i++) {
        // if (i === 0) console.log(thickness[i]);
        const H = thickness[i];
        const flux = getTotalFlux(i);
        let newH = H + flux / dx;
        if (isNaN(newH)) {
          newH = 0;
          // console.log("ugh");
        }
        // if (newH === Infinity) {
        //   console.log("what");
        // }
        thicknessNext[i] = newH < 0 ? 0 : newH;
      }
      thickness = [...thicknessNext];
      dispatch({
        type: "MODEL_UPDATE_PROFILE",
        payload: {
          revision: t,
          profile: {},
        },
      });
    }
  },
};
