/* ============================================================
   PERSISTENT STORE
   A small JSON-file-backed store. No native DB drivers required
   (keeps setup to `npm install && npm start`), but data genuinely
   persists across server restarts — read data/db.json directly
   if you want to inspect state.
   ============================================================ */
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

function load() {
  if (!fs.existsSync(DB_PATH)) {
    throw new Error("db.json missing — run `npm run seed` first.");
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function save(db) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { load, save, DB_PATH };
