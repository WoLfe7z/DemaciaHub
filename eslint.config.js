const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    {
        ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**"],
    },

    js.configs.recommended,

    {
        rules: {
            // neuporabljene spremenljivke so opozorilo (obstojeca koda jih vsebuje);
            // vse ostale napake (npr. no-undef) so napake in dvignejo job lint
            "no-unused-vars": ["warn", {caughtErrors: "none"}],
        },
    },

    // Backend (Node.js, CommonJS) in pomozne skripte
    {
        files: ["backend/**/*.js", "scripts/**/*.js", "eslint.config.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {...globals.node},
        },
    },

    // Frontend (brskalnik, navadne skripte)
    {
        files: ["frontend/js/**/*.js"],
        languageOptions: {
            sourceType: "script",
            globals: {...globals.browser},
        },
        rules: {
            // funkcije na vrhnji ravni se kličejo iz HTML-ja ali drugih skript
            "no-unused-vars": ["warn", {vars: "local", caughtErrors: "none"}],
        },
    },

    // Testi (Jest)
    {
        files: ["backend/tests/**/*.js", "frontend/tests/**/*.js"],
        languageOptions: {
            sourceType: "commonjs",
            globals: {...globals.node, ...globals.jest, ...globals.browser},
        },
    },
];
