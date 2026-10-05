const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Read existing JSON data
  const dbPath = path.join(__dirname, "..", "data", "db.json");
  if (!fs.existsSync(dbPath)) {
    throw new Error("db.json not found. Cannot seed database.");
  }
  
  const data = JSON.parse(fs.readFileSync(dbPath, "utf-8"));

  // 2. Clear existing database (optional, good for fresh seeds)
  console.log("Clearing existing data...");
  await prisma.performance.deleteMany();
  await prisma.athlete.deleteMany();
  await prisma.team.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.sport.deleteMany();

  // 3. Create Sports
  console.log("Creating sports...");
  const cricket = await prisma.sport.create({ data: { name: "Cricket" } });
  const football = await prisma.sport.create({ data: { name: "Football" } });
  const basketball = await prisma.sport.create({ data: { name: "Basketball" } });

  // Map to help associate sports with the legacy data
  const sportMap = {
    cricket: cricket.id,
    football: football.id,
    basketball: basketball.id
  };

  // 4. Migrate Leagues -> Competitions
  console.log("Migrating leagues to competitions...");
  const leagueIdMap = {}; // Maps legacy ID to new Prisma UUID
  
  for (const legacyLeague of (data.leagues || [])) {
    // Default to cricket if sport isn't specified on the legacy league
    const sportName = legacyLeague.sport ? legacyLeague.sport.toLowerCase() : "cricket";
    
    const comp = await prisma.competition.create({
      data: {
        name: legacyLeague.name,
        strength: legacyLeague.strength || 50.0,
        sportId: sportMap[sportName] || cricket.id
      }
    });
    leagueIdMap[legacyLeague.id] = comp.id;
  }

  // 5. Migrate Teams
  console.log("Migrating teams...");
  const teamIdMap = {};
  
  for (const legacyTeam of (data.teams || [])) {
    const compId = leagueIdMap[legacyTeam.leagueId];
    if (!compId) continue;

    const team = await prisma.team.create({
      data: {
        name: legacyTeam.name,
        currentRating: legacyTeam.rating || 1500.0,
        competitionId: compId
      }
    });
    teamIdMap[legacyTeam.id] = team.id;
  }

  // 6. Migrate Players -> Athletes
  console.log("Migrating players to athletes...");
  
  for (const legacyPlayer of (data.players || [])) {
    const teamId = teamIdMap[legacyPlayer.teamId];
    const sportName = legacyPlayer.sport ? legacyPlayer.sport.toLowerCase() : "cricket";

    await prisma.athlete.create({
      data: {
        name: legacyPlayer.name,
        role: legacyPlayer.role || "Unknown",
        sportId: sportMap[sportName] || cricket.id,
        teamId: teamId || null,
        talentScore: legacyPlayer.talentIndex || null,
        performanceScore: legacyPlayer.performanceScore || null,
        recentForm: legacyPlayer.recentForm || null,
        consistency: legacyPlayer.consistency || null,
        confidence: legacyPlayer.confidence || "LOW",
        trustLevel: legacyPlayer.trust || "UNVERIFIED"
      }
    });
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
