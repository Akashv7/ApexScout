const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
// If we had a real request library like axios installed, we'd use it here.
// We'll use the native fetch (Node 18+) or mock it.

const router = express.Router();

// Set up temporary storage for uploaded videos
const upload = multer({ dest: path.join(__dirname, "..", "data", "uploads") });

// POST /api/video/analyze
router.post("/analyze", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided." });
    }

    const { sport } = req.body;
    if (!sport) {
      return res.status(400).json({ error: "Sport parameter is required." });
    }

    // In a real scenario, we would forward this file to the Python CV microservice.
    // For demonstration, we'll simulate the successful handoff.
    
    // const formData = new FormData();
    // formData.append("file", fs.createReadStream(req.file.path));
    // const cvResponse = await fetch(`${process.env.CV_SERVICE_URL}/analyze-video`, {
    //   method: "POST",
    //   body: formData
    // });
    // const cvData = await cvResponse.json();
    
    // Simulated Response from Python Microservice
    const cvData = {
      status: "ACCEPTED",
      task_id: `task-${Date.now()}`,
      message: "Video queued for deep learning extraction."
    };

    // Clean up local temp file since it was (hypothetically) sent to the CV service
    fs.unlinkSync(req.file.path);

    res.status(202).json({
      success: true,
      sport: sport,
      taskId: cvData.task_id,
      status: cvData.status,
      message: cvData.message,
      trackingUrl: `/api/video/status/${cvData.task_id}`
    });

  } catch (error) {
    console.error("Video upload error:", error);
    res.status(500).json({ error: "Internal server error processing video." });
  }
});

// GET /api/video/status/:taskId
router.get("/status/:taskId", (req, res) => {
  // Mock polling endpoint. In reality, this would query the CV service or a Redis queue.
  const { taskId } = req.params;
  
  // Simulate it being done if requested
  res.json({
    taskId,
    status: "COMPLETED",
    progress: 100,
    metrics: {
      player_1: { passes: 14, sprints: 3 },
      player_2: { passes: 8, sprints: 5 }
    }
  });
});

module.exports = router;
