const express = require("express");
const { nanoid } = require("nanoid");
const { load, save } = require("../lib/store");
const { recompute } = require("../lib/ratingEngine");

const router = express.Router();

// GET /api/matches?leagueId=  — recent matches, for the admin/demo view
router.get("/", (req, res) => {
  const db = load();
  let list = [...db.matches].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (req.query.leagueId) list = list.filter(m => m.leagueId === req.query.leagueId);
  res.json(list.slice(0, 30));
});

// POST /api/matches
// Records a new match result + player performances, then recomputes the
// ENTIRE rating graph — this is the live version of what the seed script
// does, so you can see Talent Index values shift in response to a real
// new result (open two browser tabs: record a match in Admin, refresh a
// player profile, watch their index change).
router.post("/", (req, res) => {
  const db = load();
  const { leagueId, teamAId, teamBId, winnerTeamId, date, performances } = req.body;

  if (!leagueId || !teamAId || !teamBId || !date) {
    return res.status(400).json({ error: "leagueId, teamAId, teamBId, and date are required" });
  }
  const teamA = db.teams.find(t => t.id === teamAId);
  const teamB = db.teams.find(t => t.id === teamBId);
  if (!teamA || !teamB) return res.status(400).json({ error: "Unknown team id(s)" });

  const match = {
    id: `m_${nanoid(8)}`,
    leagueId, teamAId, teamBId,
    winnerTeamId: winnerTeamId || null, // null = draw/tie
    date,
    performances: Array.isArray(performances) ? performances : [],
  };
  db.matches.push(match);
  recompute(db);
  save(db);

  res.status(201).json({ match, message: "Ratings and Talent Index recomputed." });
});

module.exports = router;
