const mongoose = require("mongoose");

jest.mock("../config/db", () => jest.fn().mockResolvedValue());
jest.mock("../models/User", () => require("./mocks/modelMock")());
jest.mock("../models/Tournament", () => require("./mocks/modelMock")());
jest.mock("../models/Registration", () => require("./mocks/modelMock")());

const User = require("../models/User");
const Tournament = require("../models/Tournament");
const Registration = require("../models/Registration");
const Match = require("../models/Match"); // pravi model, brez povezave z bazo
const {zazeniStrezniku, ustaviStrezniku, prijavljenAgent} = require("./helpers");

const ID_TURNIRJA = "507f1f77bcf86cd799439044";
const URA = 60 * 60 * 1000;

let server;
let url;

// Veriga find().sort().populate()..., ki jo je mogoce "await"-ati.
function veriga(rezultat) {
    const o = {};
    o.sort = () => o;
    o.populate = () => o;
    o.then = (resolve, reject) => Promise.resolve(rezultat).then(resolve, reject);
    return o;
}

function potrjenePrijave(n) {
    return Array.from({length: n}, () => ({teamId: new mongoose.Types.ObjectId()}));
}

// Pokliče GET /bracket in vrne dvoboje, ki jih je controller shranil.
async function generirajBracket(steviloEkip) {
    const agent = await prijavljenAgent(url, User);
    Registration.find.mockResolvedValue(potrjenePrijave(steviloEkip));

    const odgovor = await agent.get(`/api/tournaments/${ID_TURNIRJA}/bracket`);

    return {odgovor, dvoboji: Match.insertMany.mock.calls[0]?.[0]};
}

const vKrogu = (dvoboji, krog) => dvoboji.filter((d) => d.round === krog);

beforeAll(async () => {
    ({server, url} = await zazeniStrezniku(4104));
});

afterAll(() => ustaviStrezniku(server));

beforeEach(() => {
    [User, Tournament, Registration].forEach((m) => m.ponastavi());

    Tournament.findById.mockResolvedValue({
        _id: ID_TURNIRJA,
        startDate: new Date(Date.now() - URA),
    });

    jest.spyOn(Match, "find").mockImplementation(() => veriga([]));
    jest.spyOn(Match, "insertMany").mockResolvedValue([]);
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("GET /api/tournaments/:id/bracket (generiranje bracketa)", () => {
    test("8 ekip ustvari 3 kroge in 7 dvobojev", async () => {
        const {dvoboji} = await generirajBracket(8);

        expect(dvoboji).toHaveLength(7);
        expect(vKrogu(dvoboji, 1)).toHaveLength(4);
        expect(vKrogu(dvoboji, 2)).toHaveLength(2);
        expect(vKrogu(dvoboji, 3)).toHaveLength(1);
    });

    test("4 ekipe ustvarijo 2 kroga brez prostih prehodov", async () => {
        const {dvoboji} = await generirajBracket(4);

        expect(dvoboji).toHaveLength(3);
        expect(dvoboji.every((d) => d.status === "pending")).toBe(true);
    });

    test("5 ekip: 3 prosti prehodi so ze zakljuceni z zmagovalcem", async () => {
        const {dvoboji} = await generirajBracket(5);
        const zakljuceni = vKrogu(dvoboji, 1).filter((d) => d.status === "completed");

        expect(dvoboji).toHaveLength(7);
        expect(zakljuceni).toHaveLength(3);
        expect(zakljuceni.every((d) => d.winnerId && !d.team2Id)).toBe(true);
    });

    test("2 ekipi ustvarita en sam dvoboj brez naslednjega", async () => {
        const {dvoboji} = await generirajBracket(2);

        expect(dvoboji).toHaveLength(1);
        expect(dvoboji[0].nextMatchId).toBeNull();
    });

    test("zmagovalec dvoboja je povezan z ustreznim mestom naslednjega", async () => {
        const {dvoboji} = await generirajBracket(8);
        const drugiKrog = vKrogu(dvoboji, 2);

        vKrogu(dvoboji, 1).forEach((dvoboj, i) => {
            const naslednji = drugiKrog[Math.floor(i / 2)];

            expect(String(dvoboj.nextMatchId)).toBe(String(naslednji._id));
            expect(dvoboj.nextMatchSlot).toBe((i % 2) + 1);
        });
    });

    test("vsaka ekipa nastopa v prvem krogu natanko enkrat", async () => {
        const agent = await prijavljenAgent(url, User);
        const prijave = potrjenePrijave(8);
        Registration.find.mockResolvedValue(prijave);

        await agent.get(`/api/tournaments/${ID_TURNIRJA}/bracket`);

        const vPrvemKrogu = vKrogu(Match.insertMany.mock.calls[0][0], 1)
            .flatMap((d) => [d.team1Id, d.team2Id])
            .filter(Boolean)
            .map(String)
            .sort();

        expect(vPrvemKrogu).toEqual(prijave.map((p) => String(p.teamId)).sort());
    });

    test("z eno potrjeno ekipo bracketa ni mogoce ustvariti (400)", async () => {
        const {odgovor, dvoboji} = await generirajBracket(1);

        expect(odgovor.status).toBe(400);
        expect(dvoboji).toBeUndefined();
    });

    test("pred zacetkom turnirja bracket se ni ustvarjen", async () => {
        Tournament.findById.mockResolvedValue({
            _id: ID_TURNIRJA,
            startDate: new Date(Date.now() + 24 * URA),
        });

        const {odgovor, dvoboji} = await generirajBracket(8);

        expect(odgovor.body).toEqual([]);
        expect(dvoboji).toBeUndefined();
    });

    test("ze obstojec bracket se ne generira ponovno", async () => {
        Match.find.mockImplementation(() => veriga([{round: 1, matchNumber: 1}]));

        const {odgovor, dvoboji} = await generirajBracket(8);

        expect(odgovor.body).toHaveLength(1);
        expect(dvoboji).toBeUndefined();
    });
});
