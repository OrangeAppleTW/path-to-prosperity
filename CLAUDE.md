# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

財富之路 (Path to Prosperity) is a financial-literacy board game played in a classroom setting. A teacher runs a "game master" console (`teacher.html`) and students join from their own devices (`student.html`). All game state — dice rolls, player assets, round progression, savings/insurance — is synchronized in real time entirely through Firebase Realtime Database. There is no application backend/server beyond Firebase.

## Commands

```bash
npm install          # install dependencies
npm start             # webpack-dev-server on :9000, opens browser (development mode)
npm run build          # production build into dist/ (webpack --mode production)
npm run deploy          # publish dist/ to the gh-pages branch (gh-pages package)
```

- There is no test suite: `npm test` is a stub (`exit 1`). Do not assume Jest/Mocha/etc. are configured.
- There is no linter configured (no ESLint/Prettier config in the repo).
- `npm run convert-webp` is defined in package.json but `scripts/convert-webp.js` was removed; that script is currently dead — don't rely on it existing.
- Husky is wired via the `prepare` script, but the `.husky/pre-commit` and `.husky/pre-push` hooks are effectively no-ops today (pre-commit only sets PATH; pre-push is empty).

### Local preview

Because pages use client-side routing/params, don't open `dist/*.html` via `file://`. Use `npm start` for development, or serve `dist/` with a static server (e.g. `npx http-server .`) after `npm run build`.

## Architecture

### Webpack multi-page entries

`webpack.config.js` defines six entry chunks — `index`, `studentLobby`, `teacherLobby`, `student`, `teacher`, `common` (plus a `styles` chunk from `src/scss/custom.scss`) — each mapped 1:1 to a page in `src/pages/*.html` via `HtmlWebpackPlugin`. Every page includes the `common` chunk. When adding a new page, add both an entry in `webpack.config.js` and an `HtmlWebpackPlugin` block.

`src/js/common.js` initializes the Firebase app (Realtime Database + Auth) and exports `{ app, auth, db }`; every other JS entry imports `db`/`auth` from it. It also pulls in Bootstrap, Bootstrap Icons, and the shared stylesheet, so it must stay in every page's chunk list.

### Two client roles, one Firebase Realtime Database tree

All game state lives under `rooms/{roomId}` in RTDB: `rooms/{roomId}/gameState` (current round, current player, current event) and `rooms/{roomId}/players/{playerId}` (per-player assets, dice status, savings, connection state). Static game content (stock/house catalogs, per-round price/dividend/rent deltas, event text) is **not** stored in the DB — it's bundled from `src/data/rounds.json` (`gameRounds`, `stockRounds`, `houseRounds`, `stocksData`, `housesData`) and imported directly by `teacher.js`/`student.js`. `src/data/oa-path-to-prosperity-default-rtdb-export.json` is a sample export of the live DB shape (useful as schema reference only — it is not loaded by the app).

Auth is anonymous Firebase sign-in (`signInAnonymously`) for both roles; a room's real access control is a room code (roomId + password) typed into the lobby, not the Firebase UID.

### Lobby → session flow

- `teacher-lobby.js` / `student-lobby.js`: sign in anonymously, validate a room code against `rooms/{roomId}`, then redirect to `teacher.html?room=...` or `student.html?room=...&player=...`. Teacher room codes generate two-letter player passwords via `generateUniqueCodes`.
- `teacher.js`: the game-master console. It composes most of the other `src/js/*.js` modules and drives all writes to `gameState`:
  - `AssetsManager` / `AdminAssetsManager` — render and administer a player's held stocks/houses/insurance.
  - `CardDrawer` — draws stock/house/risk/game event cards.
  - `InsuranceHandler`, `SavingsHandler`, `SettlementHandler`, `SettingsHandler` — game mechanics for buying insurance, savings deposits, end-of-game settlement, and misc settings.
  - `GameRoundSelector` / `StockRoundSelector` / `HouseRoundSelector` / `PlayerSelector` — advance round counters and current-player pointer in `gameState`.
  - `RentCounter` / `DividendCounter` / `InterestCounter` — compute and pay out per-round rent/dividend/interest to all players.
  - `RoomDisplay` — renders the room/player status card.
  - `DragHandler` — makes player avatar images draggable on the board.
  - `DiceHandler` (defined inline in `teacher.js`) + `DiceModule` — synchronize a dice roll animation between teacher and the rolling student through a `rollStatus` state machine on the player node: `idle → connecting → rolled → animationPlayed → completed`. The teacher listens for `rolled` to generate the die value server-side (teacher-authoritative), writes it back, then both sides play the animation.
- `student.js`: the player view. Subscribes to both the room node and its own player node, renders the player's held-properties table, and triggers dice rolls by flipping its own `rollStatus`. It also owns disconnect/reconnect handling: `beforeunload`/`pagehide`/`visibilitychange` listeners and Firebase's `onDisconnect` zero out `joinedAt`, and a reconnect overlay (`#reconnect-overlay`) lets the student manually or automatically re-mark themselves as joined.

### Asset loading / deployment path quirk

`Preloader` and the `baseURL` logic in `teacher.js`/`student.js` branch on hostname: on `localhost`/`127.0.0.1` (or ngrok) assets are loaded from `window.location.origin`, otherwise from `${origin}/path-to-prosperity` — because the site is deployed to GitHub Pages under that subpath (custom domain `fq.orangeapple.co` via the `CNAME` file). Keep this in mind when touching image/sound preloading — a wrong base URL will only break loading in production.

### Deployment

`.github/workflows/deploy.yml` builds and force-pushes `dist/` to the `gh-pages` branch on every push to `main` (no test/lint gate in CI). Manual deploy is `npm run build && npm run deploy`.
