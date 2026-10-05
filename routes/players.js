const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/players
router.get("/", async (req, res) => {
  try {
    const { sport } = req.query;
    let athletes;
    
    if (sport) {
      athletes = await prisma.athlete.findMany({
        where: { sport: { name: { equals: sport, mode: 'insensitive' } } },
        include: { 
          team: { include: { competition: true } }
        },
        orderBy: { talentScore: 'desc' }
      });
    } else {
      athletes = await prisma.athlete.findMany({
        include: { 
          team: { include: { competition: true } },
          sport: true
        },
        orderBy: { talentScore: 'desc' }
      });
    }

    // Map Prisma Athlete model to the format expected by the frontend
    const formattedAthletes = athletes.map(a => ({
      id: a.id,
      name: a.name,
      role: a.role,
      sport: a.sport ? a.sport.name : sport,
      talentIndex: a.talentScore,
      recentForm: a.recentForm,
      consistency: a.consistency,
      confidence: a.confidence,
      league: a.team && a.team.competition ? { name: a.team.competition.name, strength: a.team.competition.strength } : null
    }));

    res.json(formattedAthletes);
  } catch (err) {
    console.error("Error fetching players from DB:", err);
    res.status(500).json({ error: "Failed to fetch athletes." });
  }
});

// GET /api/players/:id
router.get("/:id", async (req, res) => {
  try {
    const athlete = await prisma.athlete.findUnique({
      where: { id: req.params.id },
      include: { sport: true, team: { include: { competition: true } }, performances: true }
    });
    
    if (!athlete) return res.status(404).json({ error: "Athlete not found" });
    res.json(athlete);
  } catch (err) {
    console.error("Error fetching player:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
