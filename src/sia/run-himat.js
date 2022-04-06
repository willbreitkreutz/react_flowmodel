const FlowModel = require("./model-copy");
const fs = require("fs");
const { exit } = require("process");
const inputs = require("./surface_09377.json");
const massBalance = require("./mb_09377_2000-2100.json");

const bed = inputs.bed.reverse();
const surface = inputs.surface.reverse();
const water = inputs.water.reverse();

const writeOutputEveryNYears = 0.1;
const runNYears = 99;
const iterationsPerYear = 5000;

const config = {
  "G09377_2000-2100_add_water": {
    A: 3.5e-25,
    As: 30000,
    Wb: 100,
    K: 0.8,
    pct_s: 0.8,
    modelLength: 5.2,
    elementCount: surface.length,
    bedConstructor: (i) => {
      return bed[i];
    },
    iceConstructor: (i) => {
      return surface[i];
    },
    waterConstructor: (i) => {
      return water[i];
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
      iterationsPerYear: iterationsPerYear,
      massBalanceFunc: function (i, m, y) {
        // return 0;
        return (
          (massBalance[y][m] / this.iterationsPerYear) * this.dx * 2 * this.Wb
        );
      },
      onChange: (updates) => {
        if (updates.i % (writeOutputEveryNYears * iterationsPerYear) === 0) {
          let yrsText = "" + updates.t;
          if (yrsText.indexOf(".") === -1) yrsText += ".0";
          const yrsPadded = yrsText.padStart(6, "0");
          const filename = `${run}/data-${yrsPadded}.json`;
          fs.writeFile(filename, JSON.stringify(updates), () => {
            // console.log(run, updates.i, yrsPadded);
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(
              `Iteration: ${updates.i}, writing ${filename}`
            );
          });
        }
        // give the other ones time to finish
        setTimeout(() => {
          if (updates.t > runNYears) {
            const end = new Date();
            console.log(" ");
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
