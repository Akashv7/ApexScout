/* ============================================================
   MODERATION AGENT
   Screens self-submitted text (bios, etc.) before publishing.
   Rule-based keyword/pattern screening — the honest baseline;
   a production system would add an ML/LLM classifier on top of
   this, not instead of it (cheap rule checks catch obvious cases
   fast, before spending a model call on borderline ones).
   ============================================================ */

const BLOCKED_PATTERNS = [
  /\b(whatsapp|telegram)\s*[:\-]?\s*\+?\d{6,}/i, // contact-info harvesting spam
  /https?:\/\/\S+/i,                              // raw links in a bio
  /\b(fuck|bitch|asshole|bastard)\b/i,             // basic profanity baseline
];

function screenText(text) {
  if (!text) return { approved: true, flags: [] };
  const flags = [];
  BLOCKED_PATTERNS.forEach((pattern, i) => {
    if (pattern.test(text)) flags.push(`Pattern ${i + 1} matched (contact-info, link, or profanity).`);
  });
  return { approved: flags.length === 0, flags };
}

module.exports = { screenText };
