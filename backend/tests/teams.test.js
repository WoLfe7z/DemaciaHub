const request = require("supertest");

jest.mock("../config/db", () => jest.fn().mockResolvedValue());
jest.mock("../models/User", () => require("./mocks/modelMock")());
jest.mock("../models/Team", () => require("./mocks/modelMock")());
jest.mock("../models/TeamInvite", () => require("./mocks/modelMock")());

const User = require("../models/User");
const Team = require("../models/Team");
const {zazeniStrezniku, ustaviStrezniku, prijavljenAgent, ID_UPORABNIKA} = require("./helpers");

let server;
let url;

beforeAll(async () => {
    ({server, url} = await zazeniStrezniku(4102));
});

afterAll(() => ustaviStrezniku(server));

beforeEach(() => {
    User.ponastavi();
    Team.ponastavi();
});

describe("ekipe", () => {
    test("ustvarjanje ekipe zahteva prijavo (401)", async () => {
        const odgovor = await request(url).post("/api/teams").send({name: "Demacia"});

        expect(odgovor.status).toBe(401);
    });

    test("prazno ime ekipe vrne 400", async () => {
        const agent = await prijavljenAgent(url, User);

        const odgovor = await agent.post("/api/teams").send({name: "   "});

        expect(odgovor.status).toBe(400);
    });

    test("uporabnik, ki je ze v ekipi, ne more ustvariti nove (409)", async () => {
        const agent = await prijavljenAgent(url, User);
        User.findById.mockResolvedValue({_id: ID_UPORABNIKA, teamId: "tim1", save: jest.fn()});

        const odgovor = await agent.post("/api/teams").send({name: "Nova"});

        expect(odgovor.status).toBe(409);
        expect(Team).not.toHaveBeenCalled();
    });

    test("uspesno ustvarjanje ekipe naredi uporabnika kapetana", async () => {
        const agent = await prijavljenAgent(url, User);
        const uporabnik = {_id: ID_UPORABNIKA, teamId: null, save: jest.fn()};
        User.findById.mockResolvedValue(uporabnik);

        const odgovor = await agent.post("/api/teams").send({name: "  Demacia  "});

        expect(odgovor.status).toBe(201);
        expect(Team).toHaveBeenCalledWith({name: "Demacia", captainId: ID_UPORABNIKA});
        expect(uporabnik.teamId).toBeTruthy();
    });

    test("povabilo lahko poslje samo kapetan (403)", async () => {
        const agent = await prijavljenAgent(url, User);
        Team.findById.mockResolvedValue({
            _id: "507f1f77bcf86cd799439022",
            captainId: "507f1f77bcf86cd799439033",
        });

        const odgovor = await agent
            .post("/api/teams/507f1f77bcf86cd799439022/invites")
            .send({username: "prijatelj"});

        expect(odgovor.status).toBe(403);
    });

    test("kapetan ne more zapustiti ekipe (403)", async () => {
        const agent = await prijavljenAgent(url, User);
        User.findById.mockResolvedValue({_id: ID_UPORABNIKA, teamId: "tim1"});
        Team.findById.mockResolvedValue({captainId: ID_UPORABNIKA});

        const odgovor = await agent.patch("/api/teams/leave");

        expect(odgovor.status).toBe(403);
    });
});
