/* ============================================================
   AI SCOUT AGENT
   Simulates natural-language processing to convert a scout's
   query into structured filters, executes the search across
   the deterministic intelligence models, and generates
   evidence-based recommendations.
   ============================================================ */

const { getEngineForSport } = require("../ratingEngine");
const { GoogleGenAI, Type, Schema } = require("@google/genai");

/**
 * Calls the real Gemini API to perform Named Entity Recognition and intent classification on the query.
 * Falls back to a simulated parser if no API key is provided.
 */
async function parseQueryWithLLM(query) {
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          sport: { type: Type.STRING, description: "The sport mentioned, e.g. football, basketball, cricket, tennis" },
          maxAge: { type: Type.INTEGER, description: "The maximum age if specified, e.g. 21 for 'under-21'" },
          role: { type: Type.STRING, description: "The player role or position mentioned" },
          exposure: { type: Type.STRING, description: "low, medium, or high based on terms like 'emerging' or 'lower-exposure'" },
          priority: { type: Type.STRING, description: "What to prioritize, e.g. 'recentForm' or 'defense'" }
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Extract the scouting criteria from the following query: "${query}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1
        }
      });
      
      return JSON.parse(response.text);
    } catch (error) {
      console.error("LLM Parsing Failed, falling back to mock:", error);
    }
  }

  // Fallback to mock parser
  return mockParseQueryWithLLM(query);
}

function mockParseQueryWithLLM(query) {
  const lowerQuery = query.toLowerCase();
  const filters = {};

  // 1. Detect sport
  if (lowerQuery.includes("football")) filters.sport = "football";
  else if (lowerQuery.includes("basketball")) filters.sport = "basketball";
  else if (lowerQuery.includes("cricket")) filters.sport = "cricket";

  // 2. Extract age requirements
  if (lowerQuery.includes("young") || lowerQuery.includes("under-21")) {
    filters.maxAge = 21;
  }

  // 3. Extract role
  if (lowerQuery.includes("midfielder")) filters.role = "midfielder";
  if (lowerQuery.includes("guard")) filters.role = "point guard"; // simplified mapping
  if (lowerQuery.includes("fast bowler")) filters.role = "fast bowler";

  // 4 & 5. Extract competition/exposure
  if (lowerQuery.includes("lower-exposure") || lowerQuery.includes("emerging")) {
    filters.exposure = "low";
  }

  // 6 & 7. Extract metrics/preferences
  if (lowerQuery.includes("recent form")) {
    filters.priority = "recentForm";
  } else if (lowerQuery.includes("defensive")) {
    filters.priority = "defense";
  }

  return filters;
}

/**
 * Calculates a 0-100 fit score based on the scout's specific requirements
 */
function calculateFitScore(player, filters, engine) {
  let fitScore = player.talentIndex || 50;

  // Age fit
  if (filters.maxAge && player.age && player.age <= filters.maxAge) {
    fitScore += 10;
  } else if (filters.maxAge) {
    fitScore -= 20; // Penalize if over age
  }

  // Role fit
  if (filters.role && player.role && player.role.toLowerCase() === filters.role) {
    fitScore += 15;
  }

  // Priority fit
  if (filters.priority === "recentForm" && player.recentForm > 70) {
    fitScore += 15;
  }
  
  if (filters.priority === "defense" && player.performanceScore > 60) {
    // In reality, we'd query the engine for specific defensive metrics
    fitScore += 10;
  }

  return Math.min(100, Math.max(0, fitScore));
}

/**
 * The main AI Scout entry point
 */
async function searchWithAIScout(db, query, limit = 5) {
  // Step 1-8: Parse natural language into structured filters using Gemini
  const parsedFilters = await parseQueryWithLLM(query);
  
  const results = [];
  
  // Apply hard filters (Sport)
  let candidates = db.players.filter(p => p.talentIndex !== null);
  if (parsedFilters.sport) {
    candidates = candidates.filter(p => p.sport.toLowerCase() === parsedFilters.sport);
  }

  // Evaluate candidates
  candidates.forEach(player => {
    // Step 9: Call appropriate SportEngine
    const engine = getEngineForSport(player.sport);
    
    // Step 11: Calculate Fit Score
    const fitScore = calculateFitScore(player, parsedFilters, engine);
    
    // Step 12: Confidence is already calculated by the Engine in recompute()
    const confidence = player.confidence;

    // Step 13: Generate evidence
    let evidence = `Talent Index is ${player.talentIndex}. `;
    if (parsedFilters.maxAge && player.age <= parsedFilters.maxAge) {
      evidence += `Fits age requirement (${player.age} <= ${parsedFilters.maxAge}). `;
    }
    if (parsedFilters.priority === "recentForm") {
      evidence += `Recent form is ${player.recentForm}. `;
    }

    results.push({
      player,
      fitScore,
      confidence,
      evidence,
      parsedFilters // Include for auditability
    });
  });

  // Sort by highest Fit Score
  return results.sort((a, b) => b.fitScore - a.fitScore).slice(0, limit);
}

module.exports = { searchWithAIScout };
