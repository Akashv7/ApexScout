/* ============================================================
   SHARED FRONTEND LOGIC — talks to the real API (server.js)
   ============================================================ */
const API = "/api";

async function apiGet(pathSuffix) {
  const res = await fetch(API + pathSuffix);
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}
async function apiPost(pathSuffix, body) {
  const res = await fetch(API + pathSuffix, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}
async function apiDelete(pathSuffix) {
  const res = await fetch(API + pathSuffix, { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).error || "Request failed");
  return res.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.getAttribute("data-page");
  document.querySelectorAll(".navlinks a").forEach(a => {
    if (a.getAttribute("data-nav") === page) a.classList.add("active");
  });
});

function trustLabel(trust) {
  return {
    unverified: "Unverified",
    community: "Community-Verified",
    agent: "Agent-Verified",
    scouted: "Featured / Scouted",
  }[trust] || "Unverified";
}

/* ---------- Talent Index Dial (SVG gauge) ---------- */
function renderDial(containerId, value, size = 160) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (value === null || value === undefined) {
    el.innerHTML = `<div style="font-family:var(--mono);font-size:12px;color:rgba(244,242,232,0.5);padding:20px 0;">Not enough match data yet</div>`;
    return;
  }
  const clamped = Math.max(0, Math.min(100, value));
  const angle = (clamped / 100) * 180;
  const rad = (Math.PI / 180) * (180 - angle);
  const cx = size / 2, cy = size / 2, r = size / 2 - 14;
  const needleX = cx + r * Math.cos(rad);
  const needleY = cy - r * Math.sin(rad);

  el.innerHTML = `
    <svg viewBox="0 0 ${size} ${size / 1.7}" width="${size}" height="${size / 1.7}">
      <path d="M 14 ${cy} A ${r} ${r} 0 0 1 ${size - 14} ${cy}"
            fill="none" stroke="rgba(244,242,232,0.14)" stroke-width="10" stroke-linecap="round"/>
      <path d="M 14 ${cy} A ${r} ${r} 0 0 1 ${size - 14} ${cy}"
            fill="none" stroke="#F2B705" stroke-width="10" stroke-linecap="round"
            stroke-dasharray="${(clamped / 100) * (Math.PI * r)} 999"/>
      <circle cx="${cx}" cy="${cy}" r="4" fill="#F4F2E8"/>
      <line x1="${cx}" y1="${cy}" x2="${needleX}" y2="${needleY}" stroke="#F4F2E8" stroke-width="2.5"/>
    </svg>
  `;
}

function playerCardHTML(p) {
  const formatTagClass = p.format === "Ground" ? "tag-ground" : "tag-turf";
  const indexDisplay = p.talentIndex === null || p.talentIndex === undefined ? "—" : p.talentIndex.toFixed(0);
  return `
    <a class="player-card" href="player.html?id=${p.id}">
      <div class="pc-top">
        <div>
          <div class="pc-name">${p.name}</div>
          <div class="pc-meta">${p.role} · ${p.location || "—"}</div>
        </div>
        <div class="pc-index">
          <div class="num">${indexDisplay}</div>
          <div class="lbl">Talent Index</div>
        </div>
      </div>
      <div class="pc-tags">
        <span class="tag ${formatTagClass}">${p.sport} · ${p.format}</span>
        <span class="tag tag-verified">${trustLabel(p.trust)}</span>
      </div>
      <div class="pc-stat-line">${p.league ? p.league.name + " · League Strength " + p.league.strength : "No league on file"}</div>
      <div class="pc-cta">View full profile &rarr;</div>
    </a>
  `;
}

function boardRowHTML(p, rank) {
  const indexDisplay = p.talentIndex === null || p.talentIndex === undefined ? "—" : p.talentIndex.toFixed(0);
  return `
    <tr>
      <td class="rank-num">${rank}</td>
      <td>
        <div class="player-name">${p.name}</div>
        <div class="player-loc">${p.role} · ${p.location || "—"}</div>
      </td>
      <td>${p.league ? p.league.name : "—"}</td>
      <td>${p.league ? p.league.strength : "—"}</td>
      <td class="index-cell">${indexDisplay}</td>
      <td><a class="btn btn-ghost btn-sm" href="player.html?id=${p.id}">Profile</a></td>
    </tr>
  `;
}

/* ---------- Polish helpers: skeletons, empty states, bar chart ---------- */
function skeletonCards(n = 3) {
  return Array.from({ length: n }).map(() => `<div class="skel skel-card"></div>`).join("");
}
function skeletonRows(n = 5) {
  return Array.from({ length: n }).map(() => `<div class="skel skel-row"></div>`).join("");
}
function skeletonTableRows(n = 5, cols = 6) {
  return Array.from({ length: n }).map(() =>
    `<tr>${Array.from({ length: cols }).map(() => `<td><div class="skel skel-line"></div></td>`).join("")}</tr>`
  ).join("");
}
function emptyStateHTML(glyph, title, sub) {
  return `
    <div class="empty-state">
      <div class="glyph">${glyph}</div>
      <div class="title">${title}</div>
      <div class="sub">${sub}</div>
    </div>
  `;
}

const BAR_COLORS = ["#F2B705", "#3E7A4C", "#B5502A", "#8C3D20", "#C4930A", "#2C5936"];
function renderBarChart(containerId, items, opts = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!items.length) {
    el.innerHTML = emptyStateHTML("!", "No data yet", "Nothing to chart until matches are recorded.");
    return;
  }
  const max = opts.max || 100;
  el.innerHTML = `
    <div class="barchart">
      ${items.map((it, i) => `
        <div class="barchart-row">
          <div class="barchart-label" title="${it.label}">${it.label}</div>
          <div class="barchart-track">
            <div class="barchart-fill" style="width:${Math.max(3, (it.value / max) * 100)}%; background:${BAR_COLORS[i % BAR_COLORS.length]};"></div>
          </div>
          <div class="barchart-val">${it.value}</div>
        </div>
      `).join("")}
    </div>
  `;
}
