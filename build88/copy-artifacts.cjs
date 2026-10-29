const fs = require("node:fs");
const crypto = require("node:crypto");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const source = path.join(__dirname, "native", "app", "build", "outputs", "apk", "release", "app-release.apk");
const localTarget = path.join(__dirname, "BS小手机_3.77.apk");
const published = path.join(root, "BS小手机.apk");
fs.copyFileSync(source, localTarget);
fs.copyFileSync(localTarget, published);

const hash = crypto.createHash("sha256").update(fs.readFileSync(localTarget)).digest("hex").toUpperCase();
fs.writeFileSync(
  path.join(__dirname, "SHA256.txt"),
  `${hash}  BS小手机_3.77.apk\n`,
  "utf8"
);
console.log(JSON.stringify({ published, bytes: fs.statSync(published).size, sha256: hash }, null, 2));
