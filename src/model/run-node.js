const FlowModel = require("./new-model");
const bed = require("./bed-filtered.json");
const fs = require("fs");
const { exit } = require("process");

// dt = 1/2 day
const dt = 0.5 / 365;
// change interval = 10 years
const changeInterval = 10 * 365 * 2;

const model = new FlowModel({
  baseElevation: bed.reverse(),
  changeInterval: changeInterval,
  dt: dt,
  massBalance: "exponential",
  onChange: (updates) => {
    const yrs = (updates.t / changeInterval) * 10;
    if (updates.ice.includes(NaN)) {
      return exit();
    }
    fs.writeFile(
      `decades/node-ice-${yrs}.json`,
      JSON.stringify(updates.ice),
      () => {
        console.log(updates.t, yrs);
      }
    );
  },
});
model.start();

// ran it to 3467500 iterations,  4750 model years
