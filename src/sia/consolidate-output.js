var fs = require("fs");

var files = fs.readdirSync("decades");
var outData = [];
files.forEach((file, i) => {
  var content = fs.readFileSync("decades/" + file, "utf-8");
  outData.push(content);
});
fs.writeFileSync("decades.json", `[${outData.join(",")}]`);
