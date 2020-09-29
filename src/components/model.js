// var fs = require("fs");
/**
 * MODEL PARAMETERS
 * Ok, here we go, first we lay out all of our terms
 */
// define our model domain, the number of columns in the x direction
const col = 100;

// define the length of our model domain in kilometers
const len = 100;

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
const getFlux = function (Hu, Hd) {
  // if there's no ice, bail
  if (!Hu && !Hd) return 0;
  // what is our change in thickness from upstream to down (negative means upstream is higher)
  const dH = Hd - Hu; // m
  // use the mean thickness for big H
  const H = (Hd + Hu) / 2; // m
  // calculate our diffusivity between these columns
  let D = Afl * H ** (n + 2) * Math.abs(dH / dx) ** (n - 1);
  // get the flux between columns, I don't think this is quite right
  // D = D > 1 ? 1 : D;
  return D * 0.5 * dH * dx;
};

const getFluxUpstream = function (i) {
  if (i === 0) return 0;
  const f = -1 * getFlux(thickness[i - 1], thickness[i]);
  return f;
};

const getFluxDownstream = function (i) {
  if (i === col - 1) return 0;
  const f = getFlux(thickness[i], thickness[i + 1]);
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
  const dt = 1 / 365; // years
  return window.setInterval(() => {
    for (var i = 0; i < col; i++) {
      const H = thickness[i];
      const flux = getTotalFlux(i);
      let newH = H + (flux / dx) * dt;
      thicknessNext[i] = newH < 0 ? 0 : newH;
    }
    thickness = [...thicknessNext];
    if (onChange && typeof onChange === "function") onChange(thickness);
  }, 1);
}

export default start;
