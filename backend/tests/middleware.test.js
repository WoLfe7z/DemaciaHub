const preveriAvtentikacijo = require("../middleware/authMiddleware");

function napraviOdgovor() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
}

describe("authMiddleware", () => {
    test("vrne 401, ce seje ni", () => {
        const res = napraviOdgovor();
        const next = jest.fn();

        preveriAvtentikacijo({}, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("vrne 401, ce seja nima userId", () => {
        const res = napraviOdgovor();
        const next = jest.fn();

        preveriAvtentikacijo({session: {}}, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    test("pokliče next(), ce je uporabnik prijavljen", () => {
        const res = napraviOdgovor();
        const next = jest.fn();

        preveriAvtentikacijo({session: {userId: "abc"}}, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});
