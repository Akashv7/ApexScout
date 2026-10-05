require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const playersRouter = require("./routes/players");
const leaguesRouter = require("./routes/leagues");
const matchesRouter = require("./routes/matches");
const scoutRouter = require("./routes/scout");
const agentsRouter = require("./routes/agents");
const videoRouter = require("./routes/video");
const performancesRouter = require("./routes/performances");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/players", playersRouter);
app.use("/api/leagues", leaguesRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/scout", scoutRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/video", videoRouter);
app.use("/api/performances", performancesRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () => {
  console.log(`Unseen XI server running at http://localhost:${PORT}`);
  console.log(`If data/db.json is missing, run: npm run seed`);
});
