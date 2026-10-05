/* ============================================================
   SEED SCRIPT
   Builds a starter dataset — leagues, teams, players, and enough
   match history that the Talent Index Engine has real data to
   compute against (not hand-typed numbers). Run with `npm run seed`.
   ============================================================ */
const { save } = require("../lib/store");
const { recompute } = require("../lib/ratingEngine");

function id(prefix, n) { return `${prefix}${n}`; }

const leagues = [
  { id: "l1", name: "Coimbatore Corporate League", region: "Tamil Nadu", format: "Ground" },
  { id: "l2", name: "Erode District Ground League", region: "Tamil Nadu", format: "Ground" },
  { id: "l3", name: "Chennai Premier Turf League", region: "Tamil Nadu", format: "Turf" },
  { id: "l4", name: "Salem Weekend Warriors Turf", region: "Tamil Nadu", format: "Turf" },
];

const teams = [];
const teamNamesByLeague = {
  l1: ["Coimbatore Kings", "RS Puram Raiders", "Peelamedu Panthers", "Saibaba Colony Strikers"],
  l2: ["Erode Eagles", "Bhavani Blasters", "Perundurai Panthers", "Gobi Gladiators"],
  l3: ["Anna Nagar Avengers", "T Nagar Titans", "Velachery Vipers", "Adyar Aces"],
  l4: ["Salem Spartans", "Attur Attackers", "Mettur Mavericks", "Omalur Outlaws"],
};
// Baseline league quality priors (in production this would come from
// occasional cross-league/interzone fixtures and historical results —
// here it's seeded directly so the demo data has realistic spread).
const leagueBaseline = { l1: 1500, l2: 1650, l3: 1520, l4: 1300 };
Object.entries(teamNamesByLeague).forEach(([leagueId, names]) => {
  names.forEach((name, i) =>
    teams.push({
      id: `${leagueId}-t${i + 1}`,
      name,
      leagueId,
      rating: leagueBaseline[leagueId],
      initialRating: leagueBaseline[leagueId],
    })
  );
});

const players = [
  { id: "p1", name: "Arun Balasubramanian", age: 19, location: "Erode, Tamil Nadu", sport: "Cricket", format: "Ground", role: "Fast Bowler", teamId: "l2-t1", trust: "agent", bio: "Right-arm fast bowler from Erode. Consistently troubles top-order batters with a heavy new-ball spell." },
  { id: "p2", name: "Vignesh Rathinam", age: 21, location: "Coimbatore, Tamil Nadu", sport: "Cricket", format: "Ground", role: "Top-order Batter", teamId: "l1-t1", trust: "scouted", bio: "Opening batter known for controlled aggression against the new ball." },
  { id: "p3", name: "Naveen Kumaresan", age: 17, location: "Chennai, Tamil Nadu", sport: "Cricket", format: "Turf", role: "Batting All-rounder", teamId: "l3-t1", trust: "community", bio: "Explosive top-order batter and part-time off-spinner in Chennai's box/turf circuit." },
  { id: "p4", name: "Divya Shanmugam", age: 18, location: "Salem, Tamil Nadu", sport: "Cricket", format: "Turf", role: "Left-arm Spinner", teamId: "l4-t1", trust: "unverified", bio: "Slow left-arm orthodox bowler dominating a weaker weekend turf league." },
  { id: "p5", name: "Karthik Elangovan", age: 22, location: "Erode, Tamil Nadu", sport: "Cricket", format: "Ground", role: "Wicketkeeper-Batter", teamId: "l2-t2", trust: "community", bio: "Reliable keeper-batter with a strong record chasing totals." },
  { id: "p6", name: "Ramya Vetrivel", age: 20, location: "Coimbatore, Tamil Nadu", sport: "Cricket", format: "Turf", role: "Fast-medium Bowler", teamId: "l3-t2", trust: "agent", bio: "Genuine pace for the turf format, uncommon in the region." },
];

// --- Generate a plausible match history ---
// Erode league (l2) is deliberately made "strong" (its top teams keep winning
// interleague-style tough matches), Salem turf (l4) deliberately "weak", so
// the Talent Index visibly rewards Divya's dominance-in-a-weak-league
// differently from Arun's performance-in-a-strong-league.
let matchId = 1;
const matches = [];

function addMatch(leagueId, teamAId, teamBId, winnerTeamId, date, performances) {
  matches.push({ id: `m${matchId++}`, leagueId, teamAId, teamBId, winnerTeamId, date, performances });
}

// Erode Ground League — 10 rounds, Erode Eagles (p1's team) strong and consistently winning
for (let round = 1; round <= 10; round++) {
  const opponent = teams.filter(t => t.leagueId === "l2" && t.id !== "l2-t1")[round % 3];
  const date = `2026-0${1 + (round % 6)}-1${round}`;
  const win = round % 4 !== 0; // Eagles win most rounds
  addMatch("l2", "l2-t1", opponent.id, win ? "l2-t1" : opponent.id, date, [
    { playerId: "p1", type: "bowling", wickets: win ? 3 + (round % 3) : 1, economy: win ? 3.5 : 5.2 },
  ]);
  // Karthik (keeper-bat, l2-t2) plays in a parallel fixture
  const opp2 = teams.filter(t => t.leagueId === "l2" && t.id !== "l2-t2")[round % 3];
  addMatch("l2", "l2-t2", opp2.id, round % 3 === 0 ? opp2.id : "l2-t2", `2026-0${1 + (round % 6)}-2${round}`, [
    { playerId: "p5", type: "batting", runs: 30 + (round % 5) * 6, ballsFaced: 40 },
  ]);
}

// Coimbatore Corporate League — Vignesh's team, moderately strong, 8 rounds
for (let round = 1; round <= 8; round++) {
  const opponent = teams.filter(t => t.leagueId === "l1" && t.id !== "l1-t1")[round % 3];
  addMatch("l1", "l1-t1", opponent.id, round % 5 === 0 ? opponent.id : "l1-t1", `2026-0${1 + (round % 6)}-0${round}`, [
    { playerId: "p2", type: "batting", runs: 45 + (round % 6) * 9, ballsFaced: 42 },
  ]);
}

// Chennai Premier Turf — Naveen (batting all-rounder) and Ramya (pace), 9 rounds, mid-strength
for (let round = 1; round <= 9; round++) {
  const opponent = teams.filter(t => t.leagueId === "l3" && t.id !== "l3-t1")[round % 3];
  addMatch("l3", "l3-t1", opponent.id, round % 3 === 0 ? opponent.id : "l3-t1", `2026-0${1 + (round % 6)}-3${round}`, [
    { playerId: "p3", type: "batting", runs: 28 + (round % 4) * 11, ballsFaced: 22 },
  ]);
  const opp2 = teams.filter(t => t.leagueId === "l3" && t.id !== "l3-t2")[round % 3];
  addMatch("l3", "l3-t2", opp2.id, round % 4 === 0 ? opp2.id : "l3-t2", `2026-0${1 + (round % 6)}-4${round}`, [
    { playerId: "p6", type: "bowling", wickets: 1 + (round % 4), economy: 5.4 },
  ]);
}

// Salem Weekend Turf — deliberately weak league; Divya dominates it (5-for economy under 3)
for (let round = 1; round <= 10; round++) {
  const opponent = teams.filter(t => t.leagueId === "l4" && t.id !== "l4-t1")[round % 3];
  addMatch("l4", "l4-t1", opponent.id, "l4-t1", `2026-0${1 + (round % 6)}-5${round}`, [
    { playerId: "p4", type: "bowling", wickets: 3 + (round % 3), economy: 2.5 + (round % 3) * 0.3 },
  ]);
  // The weak league's other teams keep losing to each other too, keeping ratings low overall
  const opp2 = teams.filter(t => t.leagueId === "l4" && t.id !== "l4-t2" && t.id !== "l4-t1")[0];
  const opp3 = teams.filter(t => t.leagueId === "l4" && t.id !== "l4-t2" && t.id !== opp2.id)[0];
  addMatch("l4", opp2.id, opp3.id, round % 2 === 0 ? opp2.id : opp3.id, `2026-0${1 + (round % 6)}-6${round}`, []);
}

const db = { leagues, teams, players, matches, shortlists: {} };
recompute(db);
save(db);

console.log("Seeded database with", players.length, "players,", matches.length, "matches.");
console.log("Computed Talent Index values:");
db.players.forEach(p => console.log(` - ${p.name}: ${p.talentIndex} (${p.matchesCounted || 0} matches counted)`));
console.log("League strengths:");
db.leagues.forEach(l => console.log(` - ${l.name}: ${l.strength}`));
