var bed = require("./bed-filtered.json");
/**
 * MODEL PARAMETERS
 * Ok, here we go, first we lay out all of our terms
 */
// define our model domain, the number of columns in the x direction
const col = 1000;

// define the length of our model domain in kilometers
const len = 75;

// so our change in x for each column is:
const dx = (len / col) * 1000; // meters

// Glen's flow law constants
const A = 10e-16; // Pa^-3 yr^-1
const n = 3;
const p = 917; // kg m^-3
const g = 9.81; // m s^-2
// const secPerYear = 31556926; // s -> do we need this term?

const Afl = (2 * A * Math.pow(p * g, n)) / (n + 2);

/**
 * FLUXES
 */
// the initial mass balance curve is a linear 1 to -1 throughout our model domain
// with a mutable annual quantity
const massBalanceQuantity = 0.3; // m/yr
const massBalance = [];
for (var i = 0; i < col; i++) {
  const x = i;
  // linear
  // const y = (-2 / col) * x + 1;
  // exponential
  const y = 2 - (x / (0.6 * col)) ** 3;
  massBalance[i] = y * massBalanceQuantity;
}

/**
 * INITIAL GLACIER PROPERTIES
 */
// the ground surface elevation
let base = [];
bed.reverse();
const getBase = function (i) {
  return bed[i];
};
// eslint-disable-next-line
for (var i = 0; i < col; i++) {
  base[i] = getBase(i);
}

// the initial ice elevation of our glacier
let ice = [];
const getIce = function (i) {
  // initally start with no glacier and see what happens
  return 0;
};
// eslint-disable-next-line
for (var i = 0; i < col; i++) {
  ice[i] = getIce(i);
}

// create a copy of thickness that we can use as a staging location for each timestep
let iceNext = [...ice];

/**
 * PROCESSING
 */
const getFlux = function (Hu, Hd, hu, hd) {
  // if there's no ice, bail
  if (!Hu && !Hd) return 0;
  // what is our surface slope from upstream to down (negative means upstream is higher)
  const dh = hd - hu; // m
  // use the mean thickness for big H
  const H = (Hd + Hu) / 2; // m
  // calculate our diffusivity between these columns
  let D = Afl * H ** (n + 2) * Math.abs(dh / dx) ** (n - 1);
  // get the flux between columns, I don't think this is quite right
  return D * (dh / dx);
};

const getFluxUpstream = function (i) {
  if (i === 0) return 0;
  const f =
    -1 *
    getFlux(ice[i - 1] - base[i - 1], ice[i] - base[i], ice[i - 1], ice[i]);
  return f;
};

const getFluxDownstream = function (i) {
  if (i === col - 1) return 0;
  const f = getFlux(
    ice[i] - base[i],
    ice[i + 1] - base[i + 1],
    ice[i],
    ice[i + 1]
  );
  return f;
};

const getFluxMassBalance = function (i) {
  const f = massBalance[i] * dx; // m2
  return f;
};

const getTotalFlux = function (i) {
  const fluxU = getFluxUpstream(i);
  const fluxD = getFluxDownstream(i);
  const fluxMb = getFluxMassBalance(i);
  const totalFlux = fluxU + fluxD + fluxMb;
  return totalFlux;
};

/**
 * LOOP
 */
function start(onChange) {
  let t = 0;
  let y = 0;
  const dt = 1 / 365 / 2; // years
  return setInterval(() => {
    for (var i = 0; i < col; i++) {
      const H = ice[i] - base[i];
      const flux = getTotalFlux(i);
      let newH = H + (flux / dx) * dt;
      iceNext[i] = newH < 0 ? base[i] : newH + base[i];
    }
    t++;
    ice = [...iceNext];
    if (onChange && typeof onChange === "function") {
      if (ice.includes(NaN)) {
        onChange(null);
      } else {
        if (t % (365 * 2) === 0) {
          ++y;
          onChange({ ice, base, massBalance, y });
        }
      }
    }
  }, 1);
}

module.exports = start;
