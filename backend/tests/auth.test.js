const request = require("supertest");

jest.mock("../config/db", () => jest.fn().mockResolvedValue());
jest.mock("../models/User", () => require("./mocks/modelMock")());

const User = require("../models/User");
const {zazeniStrezniku, ustaviStrezniku, prijavljenAgent} = require("./helpers");

let server;
let url;

beforeAll(async () => {
    ({server, url} = await zazeniStrezniku(4101));
});

afterAll(() => ustaviStrezniku(server));

beforeEach(() => {
    User.ponastavi();
});

describe("POST /api/auth/register", () => {
    test("ne ustvari uporabnika, ce polja niso izpolnjena", async () => {
        const odgovor = await request(url)
            .post("/api/auth/register")
            .send({username: "samoime"});

        expect(odgovor.status).not.toBe(201);
        expect(User).not.toHaveBeenCalled();
    });

    test("zavrne vnose, ki niso nizi (400)", async () => {
        const odgovor = await request(url)
            .post("/api/auth/register")
            .send({username: 123, email: "a@b.si", password: "geslo123"});

        expect(odgovor.status).toBe(400);
    });

    test("uspesna registracija vrne 201 in shrani uporabnika", async () => {
        User.findOne.mockResolvedValue(null);

        const odgovor = await request(url)
            .post("/api/auth/register")
            .send({username: "novi", email: "novi@primer.si", password: "geslo123"});

        expect(odgovor.status).toBe(201);
        expect(User).toHaveBeenCalledTimes(1);
    });
});

describe("POST /api/auth/login", () => {
    test("napacni podatki vrnejo 401 s sporocilom", async () => {
        User.findOne.mockResolvedValue(null);

        const odgovor = await request(url)
            .post("/api/auth/login")
            .send({username: "igralec", password: "napacno"});

        expect(odgovor.status).toBe(401);
        expect(odgovor.body.sporocilo).toMatch(/Napačno/);
    });

    test("uspesna prijava vrne 200", async () => {
        User.findOne.mockResolvedValue({_id: "507f1f77bcf86cd799439011"});

        const odgovor = await request(url)
            .post("/api/auth/login")
            .send({username: "igralec", password: "geslo123"});

        expect(odgovor.status).toBe(200);
    });
});

describe("GET /api/auth/me in odjava", () => {
    test("/me brez prijave vrne 401", async () => {
        const odgovor = await request(url).get("/api/auth/me");

        expect(odgovor.status).toBe(401);
    });

    test("/me po prijavi vrne podatke uporabnika", async () => {
        const agent = await prijavljenAgent(url, User);

        User.findById.mockResolvedValue({
            _id: "507f1f77bcf86cd799439011",
            username: "igralec",
            email: "igralec@primer.si",
            teamId: null,
        });

        const odgovor = await agent.get("/api/auth/me");

        expect(odgovor.status).toBe(200);
        expect(odgovor.body.uporabnik.username).toBe("igralec");
    });

    test("odjava brez prijave vrne 401", async () => {
        const odgovor = await request(url).post("/api/auth/logout");

        expect(odgovor.status).toBe(401);
    });

    test("po odjavi /me ponovno vrne 401", async () => {
        const agent = await prijavljenAgent(url, User);

        const odjava = await agent.post("/api/auth/logout");
        const me = await agent.get("/api/auth/me");

        expect(odjava.status).toBe(200);
        expect(me.status).toBe(401);
    });
});
