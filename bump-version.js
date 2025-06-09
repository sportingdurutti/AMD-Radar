// bump-version.js
const fs = require("fs");

const pkgPath = "./package.json";
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

const [major, minor, patch] = pkg.version.split(".").map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;
pkg.version = newVersion;

// Update package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

// Create/update version.txt
fs.writeFileSync("./docs/version.txt", newVersion + "\n");

console.log(`✅ Version bumped to ${newVersion}`);
