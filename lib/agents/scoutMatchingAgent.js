/* ============================================================
   SCOUT-MATCHING AGENT
   Takes a scout's search criteria and returns a ranked list with
   a plain-language reason for each recommendation — not just a
   filtered table, but "why this player, specifically."
   ============================================================ */

function matchForScout(db, criteria = {}) {
  const { format, role, minIndex = 0, prioritize = "index" } = criteria;

  let list = db.players.filter(p => p.talentIndex !== null && p.talentIndex !== undefined);
  if (format && format !== "all") list = list.filter(p => p.format === format);
  if (role && role !== "all") list = list.filter(p => p.role === role);
  list = list.filter(p => p.talentIndex >= Number(minIndex));

  const enriched = list.map(p => {
    const team = db.teams.find(t => t.id === p.teamId);
    const league = team ? db.leagues.find(l => l.id === team.leagueId) : null;
    const leagueStrength = league ? league.strength : 50;
    const undervaluedGap = p.talentIndex - leagueStrength;

    let reason;
    if (p.trust === "scouted") reason = "Already flagged by another scout — high-confidence pick.";
    else if (undervaluedGap > 25) reason = `Talent Index well above what their league's strength (${leagueStrength}) would predict — likely undervalued.`;
    else if (p.trust === "agent") reason = "Stats have passed automated verification against match history.";
    else reason = "Matches your criteria and ranks well on the Talent Index.";

    return { ...p, league, undervaluedGap, matchReason: reason };
  });

  const sortKey = prioritize === "undervalued" ? "undervaluedGap" : "talentIndex";
  enriched.sort((a, b) => b[sortKey] - a[sortKey]);

  return enriched;
}

module.exports = { matchForScout };
