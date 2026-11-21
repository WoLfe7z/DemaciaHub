const {naloziStran, pocakaj, odgovor} = require("./helpers");

beforeEach(() => {
    global.fetch = jest.fn();
    naloziStran("index.html", "auth.js");
});

describe("auth.js (prijava in registracija)", () => {
    test("klik na zavihek Register prikaze registracijski obrazec", () => {
        document.getElementById("register-tab").click();

        expect(
            document.getElementById("register-form").classList.contains("hidden"),
        ).toBe(false);
        expect(
            document.getElementById("login-form").classList.contains("hidden"),
        ).toBe(true);
        expect(document.getElementById("form-title").textContent).toBe(
            "Join DemaciaHub",
        );
    });

    test("napacna prijava prikaze sporocilo o napaki", async () => {
        fetch.mockReturnValue(odgovor(false, {sporocilo: "Napačno geslo."}));

        document.getElementById("login-username").value = "igralec";
        document.getElementById("login-password").value = "slabo";
        document
            .getElementById("login-form")
            .dispatchEvent(new Event("submit", {cancelable: true}));
        await pocakaj();

        const sporocilo = document.getElementById("form-message");
        expect(sporocilo.textContent).toBe("Napačno geslo.");
        expect(sporocilo.className).toContain("error");
    });

    test("registracija poslje podatke na /api/auth/register", async () => {
        fetch.mockReturnValue(odgovor(true, {sporocilo: "Ustvarjen."}));

        document.getElementById("register-tab").click();
        document.getElementById("register-username").value = "  novi ";
        document.getElementById("register-email").value = "novi@primer.si";
        document.getElementById("register-password").value = "geslo123";
        document
            .getElementById("register-form")
            .dispatchEvent(new Event("submit", {cancelable: true}));
        await pocakaj();

        const [url, nastavitve] = fetch.mock.calls[0];
        expect(url).toBe("/api/auth/register");
        expect(JSON.parse(nastavitve.body)).toEqual({
            username: "novi",
            email: "novi@primer.si",
            password: "geslo123",
        });
    });

    test("uspesna registracija preklopi na prijavo z izpolnjenim imenom", async () => {
        fetch.mockReturnValue(odgovor(true, {sporocilo: "Ustvarjen."}));

        document.getElementById("register-tab").click();
        document.getElementById("register-username").value = "novi";
        document.getElementById("register-email").value = "novi@primer.si";
        document.getElementById("register-password").value = "geslo123";
        document
            .getElementById("register-form")
            .dispatchEvent(new Event("submit", {cancelable: true}));
        await pocakaj();

        expect(document.getElementById("login-username").value).toBe("novi");
        expect(
            document.getElementById("login-form").classList.contains("hidden"),
        ).toBe(false);
        expect(document.getElementById("form-message").className).toContain(
            "success",
        );
    });
});
