// Zgradi paket aplikacije v mapo dist/: dist/backend, dist/frontend, dist/package.json
const fs = require("fs");
const path = require("path");
const {execSync} = require("child_process");

const koren = path.join(__dirname, "..");
const dist = path.join(koren, "dist");

const BACKEND_IZKLJUCI = ["node_modules", "tests", "coverage", "seed.js", ".env"];
const FRONTEND_IZKLJUCI = ["node_modules", "tests", "coverage", "package.json", "package-lock.json"];

function kopiraj(izvor, cilj, izkljuci) {
    fs.cpSync(izvor, cilj, {
        recursive: true,
        filter: (pot) => !izkljuci.includes(path.basename(pot)),
    });
}

function zgradi() {
    fs.rmSync(dist, {recursive: true, force: true});
    fs.mkdirSync(dist, {recursive: true});

    kopiraj(path.join(koren, "backend"), path.join(dist, "backend"), BACKEND_IZKLJUCI);
    kopiraj(path.join(koren, "frontend"), path.join(dist, "frontend"), FRONTEND_IZKLJUCI);

    fs.writeFileSync(
        path.join(dist, "package.json"),
        JSON.stringify({
            name: "demaciahub",
            version: "1.0.0",
            private: true,
            scripts: {start: "node backend/server.js"},
            engines: {node: ">=22"},
        }, null, 2) + "\n",
    );

    execSync("npm ci --omit=dev", {
        cwd: path.join(dist, "backend"),
        stdio: "inherit",
    });

    console.log(`Gradnja koncana: ${dist}`);
}

zgradi();
