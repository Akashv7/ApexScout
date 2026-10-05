const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

async function runTest() {
  console.log("=== STARTING VIDEO INTELLIGENCE DEMO ===");
  
  // 1. Create a dummy video file
  const dummyVideoPath = path.join(__dirname, 'demo.mp4');
  fs.writeFileSync(dummyVideoPath, 'dummy video content');
  
  try {
    // 2. Upload to Node.js Orchestrator
    console.log("-> Uploading demo.mp4 to /api/video/analyze...");
    
    const formData = new FormData();
    formData.append('video', fs.createReadStream(dummyVideoPath));
    formData.append('sport', 'football');

    // Using dynamic import for fetch since node version might require it, or just use native fetch if Node 18+
    const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)).catch(() => global.fetch(...args));

    const response = await fetch('http://localhost:3000/api/video/analyze', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log("<- Orchestrator Response:", result);
    
    if (!result.success) throw new Error("Upload failed.");
    
    // 3. Poll for Completion
    console.log(`\n-> Polling status for ${result.taskId}...`);
    let isComplete = false;
    
    while (!isComplete) {
      await new Promise(r => setTimeout(r, 2000)); // wait 2 seconds
      
      const pollRes = await fetch(`http://localhost:3000/api/video/status/${result.taskId}`);
      const pollData = await pollRes.json();
      
      console.log(`<- Polling result: ${pollData.status}`);
      
      if (pollData.status === "COMPLETED") {
        isComplete = true;
        console.log("\n=== DEMO SUCCESS ===");
        console.log("Extracted Metrics from CV Engine:");
        console.log(JSON.stringify(pollData.metrics, null, 2));
      }
    }
    
  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    // Cleanup
    if (fs.existsSync(dummyVideoPath)) fs.unlinkSync(dummyVideoPath);
  }
}

runTest();
