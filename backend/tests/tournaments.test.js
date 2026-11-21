const request = require("supertest");

jest.mock("../config/db", () => jest.fn().mockResolvedValue());
jest.mock("../models/User", () => require("./mocks/modelMock")());
jest.mock("../models/Team", () => require("./mocks/modelMock")());
jest.mock("../models/Tournament", () => require("./mocks/modelMock")());
jest.mock("../models/Registration", () => require("./mocks/modelMock")());
jest.mock("../models/Match", () => require("./mocks/modelMock")());

const User = require("../models/User");
const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const Registration = require("../models/Registration");
const Match = require("../models/Match");
const {zazeniStrezniku, ustaviStrezniku, prijavljenAgent, ID_UPORABNIKA} = require("./helpers");

const ID_TURNIRJA = "507f1f77bcf86cd799439044";
const ID_TEKME = "507f1f77bcf86cd799439055";
const URA = 60 * 60 * 1000;

function turnirZacetekCez(ms) {
    return {
        _id: ID_TURNIRJA,
        status: "upcoming",
        startDate: new Date(Date.now() + ms),
        organizerId: "507f1f77bcf86cd799439088",
        adminIds: [],
        maxTeams: 8,
        save: jest.fn(),
    };
}

const veljavenTurnir = () => ({
    name: "Pomladni turnir",
    description: "Opis",
    rules: "Pravila",
    maxTeams: 8,
    startDate: new Date(Date.now() + 48 * URA).toISOString(),
});

let server;
let url;

beforeAll(async () => {
    ({server, url} = await zazeniStrezniku(4103));
});

afterAll(() => ustaviStrezniku(server));

beforeEach(() => {
    [User, Team, Tournament, Registration, Match].forEach((m) => m.ponastavi());
});

describe("GET /api/tournaments", () => {
    test("vrne seznam turnirjev", async () => {
        Tournament.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue([{name: "A"}, {name: "B"}]),
        });

        const odgovor = await request(url).get("/api/tournaments");

        expect(odgovor.status).toBe(200);
        expect(odgovor.body).toHaveLength(2);
    });
});

describe("POST /api/tournaments (validacije)", () => {
    test("zahteva prijavo (401)", async () => {
        const odgovor = await request(url).post("/api/tournaments").send(veljavenTurnir());

        expect(odgovor.status).toBe(401);
    });

    test("manjkajoca obvezna polja vrnejo 400", async () => {
        const agent = await prijavljenAgent(url, User);

        const odgovor = await agent
            .post("/api/tournaments")
            .send({...veljavenTurnir(), name: ""});

        expect(odgovor.status).toBe(400);
    });

    test("manj kot 2 ekipi vrne 400", async () => {
        const agent = await prijavljenAgent(url, User);

        const odgovor = await agent
            .post("/api/tournaments")
            .send({...veljavenTurnir(), maxTeams: 1});

        expect(odgovor.status).toBe(400);
    });

    test("datum v preteklosti vrne 400", async () => {
        const agent = await prijavljenAgent(url, User);

        const odgovor = await agent
            .post("/api/tournaments")
            .send({...veljavenTurnir(), startDate: "2020-01-01T10:00:00Z"});

        expect(odgovor.status).toBe(400);
        expect(Tournament.create).not.toHaveBeenCalled();
    });

    test("veljaven turnir se shrani z organizatorjem (201)", async () => {
        const agent = await prijavljenAgent(url, User);
        Tournament.create.mockResolvedValue({_id: ID_TURNIRJA});

        const odgovor = await agent.post("/api/tournaments").send(veljavenTurnir());

        expect(odgovor.status).toBe(201);
        expect(Tournament.create).toHaveBeenCalledWith(
            expect.objectContaining({organizerId: ID_UPORABNIKA, maxTeams: 8}),
        );
    });
});

describe("POST /api/tournaments/:id/register", () => {
    async function pripravi(clani, jeKapetan = true) {
        const agent = await prijavljenAgent(url, User);
        Tournament.findById.mockResolvedValue(turnirZacetekCez(48 * URA));
        User.findById.mockResolvedValue({_id: ID_UPORABNIKA, teamId: "tim1"});
        Team.findById.mockResolvedValue({
            _id: "tim1",
            captainId: jeKapetan ? ID_UPORABNIKA : "507f1f77bcf86cd799439033",
        });
        User.countDocuments.mockResolvedValue(clani);
        Registration.findOne.mockResolvedValue(null);
        Registration.countDocuments.mockResolvedValue(0);
        Registration.create.mockResolvedValue({status: "pending"});
        return agent;
    }

    test("kapetan s 5 clani uspesno prijavi ekipo (201)", async () => {
        const agent = await pripravi(5);

        const odgovor = await agent.post(`/api/tournaments/${ID_TURNIRJA}/register`);

        expect(odgovor.status).toBe(201);
    });

    test("ekipa s 4 clani ne more biti prijavljena (400)", async () => {
        const agent = await pripravi(4);

        const odgovor = await agent.post(`/api/tournaments/${ID_TURNIRJA}/register`);

        expect(odgovor.status).toBe(400);
        expect(Registration.create).not.toHaveBeenCalled();
    });

    test("ekipe ne more prijaviti navaden clan (403)", async () => {
        const agent = await pripravi(5, false);

        const odgovor = await agent.post(`/api/tournaments/${ID_TURNIRJA}/register`);

        expect(odgovor.status).toBe(403);
    });

    test("ze prijavljena ekipa vrne 409", async () => {
        const agent = await pripravi(5);
        Registration.findOne.mockResolvedValue({_id: "r1"});

        const odgovor = await agent.post(`/api/tournaments/${ID_TURNIRJA}/register`);

        expect(odgovor.status).toBe(409);
    });

    test("prijave so zaprte 2 uri pred zacetkom (400)", async () => {
        const agent = await pripravi(5);
        Tournament.findById.mockResolvedValue(turnirZacetekCez(1 * URA));

        const odgovor = await agent.post(`/api/tournaments/${ID_TURNIRJA}/register`);

        expect(odgovor.status).toBe(400);
    });

    test("neveljaven ID turnirja vrne 400", async () => {
        const agent = await prijavljenAgent(url, User);

        const odgovor = await agent.post("/api/tournaments/ni-id/register");

        expect(odgovor.status).toBe(400);
    });
});

describe("PATCH /api/tournaments/:id/lock-in", () => {
    async function pripravi(startCez) {
        const agent = await prijavljenAgent(url, User);
        Tournament.findById.mockResolvedValue(turnirZacetekCez(startCez));
        User.findById.mockResolvedValue({_id: ID_UPORABNIKA, teamId: "tim1"});
        Team.findById.mockResolvedValue({_id: "tim1", captainId: ID_UPORABNIKA});
        User.countDocuments.mockResolvedValue(5);
        Registration.findOneAndUpdate.mockResolvedValue({status: "confirmed"});
        return agent;
    }

    test("izven 2-urnega okna lock-in ni dovoljen (400)", async () => {
        const agent = await pripravi(24 * URA);

        const odgovor = await agent.patch(`/api/tournaments/${ID_TURNIRJA}/lock-in`);

        expect(odgovor.status).toBe(400);
        expect(Registration.findOneAndUpdate).not.toHaveBeenCalled();
    });

    test("v zadnjih 2 urah kapetan potrdi pripravljenost (200)", async () => {
        const agent = await pripravi(1 * URA);

        const odgovor = await agent.patch(`/api/tournaments/${ID_TURNIRJA}/lock-in`);

        expect(odgovor.status).toBe(200);
        expect(Registration.findOneAndUpdate).toHaveBeenCalledWith(
            expect.objectContaining({status: "pending"}),
            expect.objectContaining({status: "confirmed"}),
            expect.anything(),
        );
    });
});

describe("PATCH /api/tournaments/:id/matches/:matchId/result", () => {
    const TIM_A = "507f1f77bcf86cd7994390a1";
    const TIM_B = "507f1f77bcf86cd7994390b2";

    async function pripravi(uporabnikJeAdmin = true) {
        const agent = await prijavljenAgent(url, User);
        const turnir = turnirZacetekCez(-1 * URA);
        turnir.adminIds = uporabnikJeAdmin ? [ID_UPORABNIKA] : [];
        Tournament.findById.mockResolvedValue(turnir);

        const naslednji = {team1Id: null, team2Id: null, save: jest.fn()};
        const dvoboj = {
            team1Id: TIM_A,
            team2Id: TIM_B,
            status: "pending",
            nextMatchId: "507f1f77bcf86cd7994390c3",
            nextMatchSlot: 2,
            save: jest.fn(),
        };
        Match.findOne.mockResolvedValueOnce(dvoboj).mockResolvedValueOnce(naslednji);

        return {agent, dvoboj, naslednji};
    }

    const pot = `/api/tournaments/${ID_TURNIRJA}/matches/${ID_TEKME}/result`;

    test("rezultata ne more vnesti uporabnik brez pravic (403)", async () => {
        const {agent} = await pripravi(false);

        const odgovor = await agent.patch(pot).send({winnerId: TIM_A});

        expect(odgovor.status).toBe(403);
    });

    test("zmagovalec mora biti ena od ekip v dvoboju (400)", async () => {
        const {agent} = await pripravi();

        const odgovor = await agent
            .patch(pot)
            .send({winnerId: "507f1f77bcf86cd7994390ff"});

        expect(odgovor.status).toBe(400);
    });

    test("zmagovalec napreduje v naslednji dvoboj in dvoboj se zakljuci", async () => {
        const {agent, dvoboj, naslednji} = await pripravi();

        const odgovor = await agent.patch(pot).send({winnerId: TIM_A});

        expect(odgovor.status).toBe(200);
        expect(dvoboj.status).toBe("completed");
        expect(dvoboj.winnerId).toBe(TIM_A);
        expect(naslednji.team2Id).toBe(TIM_A);
    });
});
