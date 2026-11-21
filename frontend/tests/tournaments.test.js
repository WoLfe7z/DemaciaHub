const {naloziStran, pocakaj, odgovor} = require("./helpers");

const URA = 60 * 60 * 1000;

function turnir(ime, startCez) {
    return {
        _id: "id-" + ime,
        name: ime,
        description: "Opis " + ime,
        maxTeams: 8,
        startDate: new Date(Date.now() + startCez).toISOString(),
    };
}

beforeEach(() => {
    global.fetch = jest.fn();
});

describe("tournaments.js (seznam turnirjev)", () => {
    test("razvrsti turnirje na tekoce in prihajajoce", async () => {
        fetch.mockReturnValue(
            odgovor(true, [turnir("Danes", -1 * URA), turnir("Kmalu", 48 * URA)]),
        );

        naloziStran("tournaments.html", "tournaments.js");
        await pocakaj();

        const tekoci = document.getElementById("ongoing-tournaments");
        const prihajajoci = document.getElementById("upcoming-tournaments");

        expect(tekoci.textContent).toContain("Danes");
        expect(prihajajoci.textContent).toContain("Kmalu");
        expect(prihajajoci.textContent).not.toContain("Danes");
    });

    test("kartica turnirja povezuje na tournament.html z ID-jem", async () => {
        fetch.mockReturnValue(odgovor(true, [turnir("Kmalu", 48 * URA)]));

        naloziStran("tournaments.html", "tournaments.js");
        await pocakaj();

        const povezava = document.querySelector("#upcoming-tournaments a");
        expect(povezava.getAttribute("href")).toBe("tournament.html?id=id-Kmalu");
    });

    test("brez turnirjev prikaze ustrezni sporocili", async () => {
        fetch.mockReturnValue(odgovor(true, []));

        naloziStran("tournaments.html", "tournaments.js");
        await pocakaj();

        expect(document.getElementById("ongoing-tournaments").textContent).toBe(
            "No ongoing tournaments.",
        );
        expect(document.getElementById("upcoming-tournaments").textContent).toBe(
            "No upcoming tournaments.",
        );
    });

    test("napaka pri nalaganju se prikaze v obeh seznamih", async () => {
        fetch.mockReturnValue(odgovor(false, {sporocilo: "Napaka streznika."}));

        naloziStran("tournaments.html", "tournaments.js");
        await pocakaj();

        expect(document.getElementById("ongoing-tournaments").textContent).toBe(
            "Napaka streznika.",
        );
    });
});
