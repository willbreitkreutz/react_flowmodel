const FlowModel = require("./model");
const fs = require("fs");
const { exit } = require("process");
const bed = require("./bed-filtered.json");
const bedHill = require("./bed-hill.json");
bed.reverse();

// const config = {
//   "flat-cycle-mb": {
//     bedConstructor: (i) => {
//       return 100;
//     },
//   },
//   "uphill-cycle-mb": {
//     bedConstructor: (i) => {
//       return 100 + 1.8 * i;
//     },
//   },
//   "downhill-cycle-mb": {
//     bedConstructor: (i) => {
//       return 1000 - 1.8 * i;
//     },
//   },
//   "terrain-down-cycle-mb": {
//     bedConstructor: (i) => {
//       return bedHill[Math.round((i / 200) * bedHill.length)] * 2;
//     },
//   },
//   "terrain-up-cycle-mb": {
//     bedConstructor: (i) => {
//       const e = bedHill[Math.round(((199 - i) / 200) * bedHill.length)] * 2;
//       return e;
//     },
//   },
// };

const config = {
  "flat-sliding": {
    As: 73,
    bedConstructor: (i) => {
      return 0;
    },
  },
  "flat-no-sliding": {
    As: 0,
    bedConstructor: (i) => {
      return 0;
    },
  },
};

const start = new Date();
Object.keys(config).forEach((run) => {
  if (!fs.existsSync(run)) {
    fs.mkdirSync(run);
  }

  const modelConfig = Object.assign(
    {},
    {
      iterationsPerYear: 5000,
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
          if (yrs > 3000) {
            const end = new Date();
            console.log(`Completed in ${(end - start) / 1000 / 60} minutes`);
            return exit();
          }
        }, 200);
      },
    },
    config[run]
  );

  const model = new FlowModel(modelConfig);
  model.start();
});
