const {naloziStran, pocakaj, odgovor} = require("./helpers");

function izpolniObrazec() {
    document.getElementById("name").value = "  Pomladni turnir ";
    document.getElementById("description").value = "Opis";
    document.getElementById("rules").value = "Pravila";
    document.getElementById("maxTeams").value = "8";
    document.getElementById("startDate").value = "2030-05-01T18:00";
}

function oddaj() {
    document
        .getElementById("tournament-form")
        .dispatchEvent(new Event("submit", {cancelable: true}));
}

beforeEach(() => {
    global.fetch = jest.fn();
    naloziStran("create-tournament.html", "create-tournament.js");
});

describe("create-tournament.js", () => {
    test("poslje podatke turnirja z numericnim maxTeams (POST /api/tournaments)", async () => {
        fetch.mockReturnValue(odgovor(true, {}));

        izpolniObrazec();
        oddaj();
        await pocakaj();

        const [url, nastavitve] = fetch.mock.calls[0];
        const telo = JSON.parse(nastavitve.body);

        expect(url).toBe("/api/tournaments");
        expect(nastavitve.method).toBe("POST");
        expect(telo.name).toBe("Pomladni turnir");
        expect(telo.maxTeams).toBe(8);
    });

    test("po uspehu prikaze sporocilo in pocisti obrazec", async () => {
        fetch.mockReturnValue(odgovor(true, {}));

        izpolniObrazec();
        oddaj();
        await pocakaj();

        const sporocilo = document.getElementById("tournament-message");
        expect(sporocilo.textContent).toBe("Tournament created successfully!");
        expect(sporocilo.className).toContain("success");
        expect(document.getElementById("name").value).toBe("");
    });

    test("napaka streznika se prikaze uporabniku", async () => {
        fetch.mockReturnValue(
            odgovor(false, {sporocilo: "Datum začetka mora biti v prihodnosti."}),
        );

        izpolniObrazec();
        oddaj();
        await pocakaj();

        const sporocilo = document.getElementById("tournament-message");
        expect(sporocilo.textContent).toBe(
            "Datum začetka mora biti v prihodnosti.",
        );
        expect(sporocilo.className).toContain("error");
    });
});
