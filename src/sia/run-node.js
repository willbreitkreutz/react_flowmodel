const FlowModel = require("./model");
const fs = require("fs");
const { exit } = require("process");
const bed = require("./bed-filtered.json");
const bedHill = require("./bed-hill.json");
bed.reverse();

const config = {
  "flat-cycle-mb": {
    bedConstructor: (i) => {
      return 100;
    },
  },
  "uphill-cycle-mb": {
    bedConstructor: (i) => {
      return 100 + 1.8 * i;
    },
  },
  "downhill-cycle-mb": {
    bedConstructor: (i) => {
      return 1000 - 1.8 * i;
    },
  },
  "terrain-down-cycle-mb": {
    bedConstructor: (i) => {
      return bedHill[Math.round((i / 200) * bedHill.length)] * 2;
    },
  },
  "terrain-up-cycle-mb": {
    bedConstructor: (i) => {
      const e = bedHill[Math.round(((199 - i) / 200) * bedHill.length)] * 2;
      return e;
    },
  },
};

Object.keys(config).forEach((run) => {
  if (!fs.existsSync(run)) {
    fs.mkdirSync(run);
  }
  const model = new FlowModel({
    iceConstructor: (i) => {
      return 0;
    },
    bedConstructor: config[run].bedConstructor,
    iterationsPerYear: 400,
    onChange: (updates) => {
      const yrs = updates.t;
      if (yrs % 10 === 0) {
        const yrsText = "" + yrs;
        const yrsPadded = yrsText.padStart(4, "0");
        fs.writeFile(
          `${run}/data-${yrsPadded}.json`,
          JSON.stringify(updates),
          () => {
            console.log(run, updates.i, yrs);
          }
        );
      }
      // give the other ones time to finish
      setTimeout(() => {
        if (yrs > 2000) {
          return exit();
        }
      }, 200);
    },
  });
  model.start();
});
