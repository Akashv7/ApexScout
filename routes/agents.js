const express = require("express");
const { load, save } = require("../lib/store");
const { runVerification, runVerificationAndApply } = require("../lib/agents/verificationAgent");
const { findHiddenGems } = require("../lib/agents/discoveryAgent");
const { matchForScout } = require("../lib/agents/scoutMatchingAgent");

const router = express.Router();

// GET /api/agents/discovery — Discovery Agent's current hidden-gem picks
router.get("/discovery", (req, res) => {
  const db = load();
  res.json(findHiddenGems(db));
});

// GET /api/agents/verify/:playerId — run Verification Agent, read-only preview
router.get("/verify/:playerId", (req, res) => {
  const db = load();
  const player = db.players.find(p => p.id === req.params.playerId);
  if (!player) return res.status(404).json({ error: "Player not found" });
  res.json(runVerification(player, db));
});

// POST /api/agents/verify/:playerId — run Verification Agent AND apply trust-tier upgrade if it passes
router.post("/verify/:playerId", (req, res) => {
  const db = load();
  const player = db.players.find(p => p.id === req.params.playerId);
  if (!player) return res.status(404).json({ error: "Player not found" });
  const result = runVerificationAndApply(player, db);
  save(db);
  res.json({ ...result, newTrustTier: player.trust });
});

// GET /api/agents/scout-match?format=&role=&minIndex=&prioritize=
router.get("/scout-match", (req, res) => {
  const db = load();
  const { format, role, minIndex, prioritize } = req.query;
  res.json(matchForScout(db, { format, role, minIndex, prioritize }));
});

// GET /api/agents/status — simple live dashboard data
router.get("/status", (req, res) => {
  const db = load();
  const verifiedCounts = db.players.reduce((acc, p) => {
    acc[p.trust] = (acc[p.trust] || 0) + 1;
    return acc;
  }, {});
  res.json({
    totalPlayers: db.players.length,
    totalMatches: db.matches.length,
    trustBreakdown: verifiedCounts,
    hiddenGemsAvailable: findHiddenGems(db).length,
  });
});

module.exports = router;
