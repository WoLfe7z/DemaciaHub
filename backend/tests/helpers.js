const express = require("express");
const request = require("supertest");

const ID_UPORABNIKA = "507f1f77bcf86cd799439011";

// Zazene pravi server.js (baza je v testih mockana) in vrne http streznik ter URL.
async function zazeniStrezniku(port) {
    process.env.PORT = String(port);

    const listen = jest.spyOn(express.application, "listen");

    require("../server");

    for (let i = 0; i < 100 && listen.mock.results.length === 0; i++) {
        await new Promise((resolve) => setTimeout(resolve, 10));
    }

    if (listen.mock.results.length === 0) {
        throw new Error("Streznik se ni zagnal.");
    }

    const server = listen.mock.results[0].value;

    if (!server.listening) {
        await new Promise((resolve) => server.once("listening", resolve));
    }

    return {server, url: `http://127.0.0.1:${port}`};
}

function ustaviStrezniku(server) {
    return new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
    });
}

// Vrne supertest agenta s sejo prijavljenega uporabnika.
async function prijavljenAgent(url, User, uporabnik = {}) {
    User.findOne.mockResolvedValueOnce({
        _id: ID_UPORABNIKA,
        username: "igralec",
        ...uporabnik,
    });

    const agent = request.agent(url);
    const odgovor = await agent
        .post("/api/auth/login")
        .send({username: "igralec", password: "geslo123"});

    if (odgovor.status !== 200) {
        throw new Error("Prijava v testu ni uspela: " + odgovor.status);
    }

    return agent;
}

module.exports = {zazeniStrezniku, ustaviStrezniku, prijavljenAgent, ID_UPORABNIKA};
