/* ============================================================
   RAG AGENT (Retrieval-Augmented Generation)
   Provides domain knowledge (methodologies, metric definitions,
   scouting guidelines) separate from athlete performance data.
   ============================================================ */

/**
 * Mock knowledge base simulating a vector database (e.g., Pinecone/Milvus)
 * In production, documents are chunked, embedded, and retrieved via cosine similarity.
 */
const KNOWLEDGE_BASE = [
  {
    id: "doc_1",
    topic: "football_metrics",
    content: "Expected Goals (xG) measures the quality of a chance by calculating the likelihood that it will be scored from a particular position on the pitch during a particular phase of play."
  },
  {
    id: "doc_2",
    topic: "basketball_metrics",
    content: "True Shooting Percentage (TS%) is a measure of shooting efficiency that takes into account field goals, 3-point field goals, and free throws."
  },
  {
    id: "doc_3",
    topic: "scouting_guidelines",
    content: "When evaluating young emerging talent, heavily weight recent form and trajectory over lifetime performance score, as players under 21 develop rapidly."
  },
  {
    id: "doc_4",
    topic: "confidence_score",
    content: "Confidence is rated HIGH if the player has over 15 matches of verified data. MEDIUM for 5-14 matches. LOW for under 5 matches."
  }
];

/**
 * Simulates vector search to retrieve relevant documents based on the query.
 */
function retrieveDocuments(query, limit = 2) {
  const lowerQuery = query.toLowerCase();
  const results = [];

  // Simple keyword matching simulating semantic search
  KNOWLEDGE_BASE.forEach(doc => {
    if (
      lowerQuery.includes(doc.topic.split("_")[0]) || 
      lowerQuery.includes("metric") && doc.topic.includes("metrics") ||
      lowerQuery.includes("scout") && doc.topic.includes("scout")
    ) {
      results.push(doc);
    }
  });

  return results.slice(0, limit);
}

/**
 * Executes a RAG query to answer methodology or terminology questions.
 * Strictly forbidden from querying the SQL database or answering stat questions.
 */
async function queryMethodology(query) {
  // 1. Retrieve context
  const contextDocs = retrieveDocuments(query);
  
  if (contextDocs.length === 0) {
    return {
      answer: "I do not have internal documentation covering that methodology or metric.",
      sources: []
    };
  }

  const contextText = contextDocs.map(d => d.content).join("\n\n");

  // 2. Generate Answer via LLM (Mocked here)
  // PROMPT: "Using strictly the following context, answer the query: {query}. Context: {contextText}. Do not invent athlete statistics."
  
  const simulatedLLMAnswer = `Based on the internal guidelines: ${contextDocs[0].content}`;

  return {
    answer: simulatedLLMAnswer,
    sources: contextDocs.map(d => d.id)
  };
}

module.exports = { queryMethodology, retrieveDocuments };
