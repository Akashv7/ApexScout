const express = require("express");
const { load, save } = require("../lib/store");

const router = express.Router();

// GET /api/scout/shortlist/:scoutId
router.get("/shortlist/:scoutId", (req, res) => {
  const db = load();
  const ids = db.shortlists[req.params.scoutId] || [];
  const players = ids.map(id => db.players.find(p => p.id === id)).filter(Boolean);
  res.json(players);
});

// POST /api/scout/shortlist/:scoutId  { playerId }
router.post("/shortlist/:scoutId", (req, res) => {
  const db = load();
  const { scoutId } = req.params;
  const { playerId } = req.body;
  if (!playerId) return res.status(400).json({ error: "playerId is required" });
  if (!db.shortlists[scoutId]) db.shortlists[scoutId] = [];
  if (!db.shortlists[scoutId].includes(playerId)) db.shortlists[scoutId].push(playerId);
  save(db);
  res.json({ shortlist: db.shortlists[scoutId] });
});

// DELETE /api/scout/shortlist/:scoutId/:playerId
router.delete("/shortlist/:scoutId/:playerId", (req, res) => {
  const db = load();
  const { scoutId, playerId } = req.params;
  db.shortlists[scoutId] = (db.shortlists[scoutId] || []).filter(id => id !== playerId);
  save(db);
  res.json({ shortlist: db.shortlists[scoutId] });
});

module.exports = router;
