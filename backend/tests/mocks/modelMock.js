// Pomozna funkcija, ki nadomesti Mongoose model z mockom (brez prave baze).
const STATICNE_METODE = [
    "find",
    "findOne",
    "findById",
    "findOneAndUpdate",
    "countDocuments",
    "create",
    "updateMany",
    "insertMany",
];

function napraviModel() {
    const Model = jest.fn(function (podatki) {
        Object.assign(this, podatki);
        this._id = this._id || "507f1f77bcf86cd799439099";
        this.save = jest.fn().mockResolvedValue(this);
    });

    for (const ime of STATICNE_METODE) {
        Model[ime] = jest.fn();
    }

    Model.ponastavi = () => {
        Model.mockClear();
        for (const ime of STATICNE_METODE) {
            Model[ime].mockReset();
        }
    };

    return Model;
}

module.exports = napraviModel;
