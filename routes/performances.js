const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { getEngineForSport } = require("../lib/ratingEngine");

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/performances/submit
// This route is how Real Runs/Stats get into the system (from CV or manual entry)
router.post("/submit", async (req, res) => {
  try {
    const { athleteId, eventId, metrics } = req.body;
    
    if (!athleteId || !eventId || !metrics) {
      return res.status(400).json({ error: "Missing required fields (athleteId, eventId, metrics)" });
    }

    // 1. Fetch the athlete and their sport to validate
    const athlete = await prisma.athlete.findUnique({
      where: { id: athleteId },
      include: { sport: true }
    });

    if (!athlete) {
      return res.status(404).json({ error: "Athlete not found in database." });
    }

    // 2. Save the raw performance data into the PostgreSQL Database
    const performance = await prisma.performance.create({
      data: {
        athleteId: athlete.id,
        eventId: eventId,
        metrics: metrics // JSONB column holding sport-specific stats (e.g. { runs: 50 } or { goals: 1 })
      }
    });

    // 3. Immediately trigger the mathematical SportEngine to recalculate their Intelligence Scores
    const engine = getEngineForSport(athlete.sport.name.toLowerCase());
    
    // Fetch all historical performances for this athlete to recompute form/consistency
    const allPerformances = await prisma.performance.findMany({
      where: { athleteId: athlete.id },
      orderBy: { createdAt: 'asc' }
    });

    const historicalImpacts = allPerformances.map(p => {
      // Pass the raw JSON metrics to the engine
      return engine.calculatePerformance({ ...p.metrics, role: athlete.role });
    });

    const recentForm = engine.calculateRecentForm(historicalImpacts);
    const consistency = engine.calculateConsistency(historicalImpacts);
    
    // Simplistic talent score bump based on the new performance
    const newImpact = engine.calculatePerformance({ ...metrics, role: athlete.role });
    const updatedTalentScore = (athlete.talentScore || 50) + (newImpact * 2);

    // Update the athlete's record in the live database
    const updatedAthlete = await prisma.athlete.update({
      where: { id: athlete.id },
      data: {
        recentForm: recentForm,
        consistency: consistency,
        talentScore: updatedTalentScore,
        confidence: allPerformances.length > 5 ? "HIGH" : "MEDIUM",
        performanceScore: updatedTalentScore // Simplified mapping
      }
    });

    res.status(201).json({
      success: true,
      message: "Performance recorded and Intelligence Scores updated.",
      updatedScores: {
        recentForm: updatedAthlete.recentForm,
        consistency: updatedAthlete.consistency,
        talentScore: updatedAthlete.talentScore,
        confidence: updatedAthlete.confidence
      }
    });

  } catch (error) {
    console.error("Error submitting performance:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
