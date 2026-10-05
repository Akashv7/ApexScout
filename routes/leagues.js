const express = require("express");
const { nanoid } = require("nanoid");
const { load, save } = require("../lib/store");
const { recompute } = require("../lib/ratingEngine");

const router = express.Router();

// GET /api/leagues
router.get("/", (req, res) => {
  const db = load();
  res.json(db.leagues);
});

// GET /api/leagues/:id/teams
router.get("/:id/teams", (req, res) => {
  const db = load();
  res.json(db.teams.filter(t => t.leagueId === req.params.id));
});

module.exports = router;
