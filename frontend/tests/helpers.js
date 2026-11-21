const fs = require("fs");
const path = require("path");

// V jsdom naloži pravi HTML (brez izvajanja skript) in nato izbrano skripto.
function naloziStran(htmlDatoteka, skripta) {
    const html = fs.readFileSync(
        path.join(__dirname, "..", htmlDatoteka),
        "utf8",
    );

    document.documentElement.innerHTML = html.replace(
        /<script[\s\S]*?<\/script>/g,
        "",
    );

    jest.isolateModules(() => {
        require(path.join("..", "js", skripta));
    });
}

// Pocaka, da se izvedejo vse cakajoce obljube (fetch, json ...).
async function pocakaj() {
    for (let i = 0; i < 5; i++) {
        await new Promise((resolve) => setTimeout(resolve, 0));
    }
}

function odgovor(ok, telo) {
    return Promise.resolve({ok, json: () => Promise.resolve(telo)});
}

module.exports = {naloziStran, pocakaj, odgovor};
