# DemaciaHub

[![CI/CD](https://github.com/WoLfe7z/DemaciaHub/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/WoLfe7z/DemaciaHub/actions/workflows/ci-cd.yml)

**Nameščena aplikacija:** https://DOPOLNI-IME-APLIKACIJE.azurewebsites.net

DemaciaHub je spletna aplikacija za organizacijo in upravljanje turnirjev v igri League of Legends. Namenjena je igralcem, ekipam in organizatorjem turnirjev.

Aplikacija omogoča registracijo uporabnikov, ustvarjanje ekip, povabila soigralcem, prijavljanje na turnirje, potrjevanje pripravljenosti ekip (lock-in), samodejno generiranje turnirskega drevesa (bracketa) ter beleženje rezultatov tekem.

Cilj projekta je poenostaviti organizacijo turnirjev in omogočiti upravljanje ekip, tekem in rezultatov.

## Uporabljene tehnologije

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js, Socket.io, Mongoose
- **Podatkovna baza:** MongoDB
- **Upravljanje uporabniških sej:** express-session
- **Razvojno orodje:** Nodemon

## Dokumentacija

Projektna dokumentacija je dostopna v mapi [docs](./docs/).

Vključuje zasnovo rešitve, opis funkcionalnosti, podatkovni model, uporabniške zgodbe in wireframe zaslone..

## CI/CD (GitHub Actions)

Cevovod je definiran v [`.github/workflows/ci-cd.yml`](./.github/workflows/ci-cd.yml) in se sproži ob vsakem pull requestu v `main` ter ob vsakem pushu na `main`.

| Faza | Kaj naredi |
| ---- | ---------- |
| **lint** | ESLint preveri slog in kakovost kode frontenda in backenda (`eslint.config.js`). Ob napaki job pade. |
| **build** | `npm run build` zgradi paket aplikacije (backend s produkcijskimi odvisnostmi + frontend), preveri, da se odvisnosti naložijo, in shrani `app.zip` kot artefakt `app-package`. Odvisnosti se predpomnijo (`actions/setup-node` z `cache: npm`). |
| **test** | Jest zažene teste backenda (`backend/tests`, Supertest z mockanimi modeli) in frontenda (`frontend/tests`, jsdom). Poročilo o pokritosti se shrani kot artefakt `coverage-report`. Če test pade, pade cevovod. |
| **deploy** | Samo ob pushu na `main` in samo če so `lint`, `build` in `test` uspešni. Prenese artefakt iz joba `build` (brez ponovne gradnje) in ga namesti na Azure App Service v okolju `production`. |

Pravilo za zaščito veje `main` zahteva uspešne preveritve `lint`, `build` in `test`, zato pull requesta s padajočim cevovodom ni mogoče združiti.

### Nastavitev namestitve

- **GitHub → Settings → Environments → `production`:**
  - secret `AZURE_WEBAPP_PUBLISH_PROFILE` (vsebina Publish profile iz Azure portala),
  - variable `AZURE_WEBAPP_NAME` (ime App Service aplikacije).
- **Azure App Service (Application settings):** `MONGODB_URI` (MongoDB Atlas), `SESSION_SECRET`, `SCM_DO_BUILD_DURING_DEPLOYMENT=false`. Startup command: `npm start`.

### Lokalno zaganjanje preveritev

```bash
npm ci && npm run lint                       # lint (v korenu)
cd backend && npm ci && npm test             # testi backenda
cd ../frontend && npm ci && npm test        # testi frontenda
cd .. && npm run build                       # gradnja v mapo dist/
```

## Zagon aplikacije

### 1. Predpogoji
- Node.js in npm
- MongoDB Community Server
- MongoDB Compass (za pregledovanje podatkov)

### 2. Kloniranje repozitorija
```bash
git clone https://github.com/klemenpuhek/DemaciaHub.git
cd DemaciaHub/backend
```

### 3. Namestitev odvisnosti
```bash
npm install
```

### 4. Konfiguracija okolja

Zaženite lokalni MongoDB strežnik in v mapi `backend` ustvarite datoteko `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/demaciahub
SESSION_SECRET=poljuben-dolg-nakljucen-niz-znakov
```

MongoDB bo podatkovno bazo `demaciahub` ustvaril ob prvem zapisovanju podatkov.

### 5. Zagon aplikacije
```bash
npm run dev
```

Aplikacijo odprite na naslovu:

**http://localhost:3000**

Frontend in backend se izvajata na istem strežniku.