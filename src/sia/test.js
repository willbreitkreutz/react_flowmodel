function printProgress(progress) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(` ${progress}`);
}

const iterationsPerYear = 250;
for (var t = 0; t < 10000; t++) {
  let r = t % iterationsPerYear;
  let p = r / iterationsPerYear;
  let m = p * 12;
  let y = Math.floor(t / iterationsPerYear);
  // printProgress(Math.floor(m));
  console.log(y, r, p, m, Math.floor(m));
}
