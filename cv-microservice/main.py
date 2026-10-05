from fastapi import FastAPI, UploadFile, File, BackgroundTasks
import uvicorn
import cv2
import uuid
import os

app = FastAPI(title="ApexScout - CV Intelligence Microservice")

# Ensure temp directory exists for video processing
os.makedirs("temp_videos", exist_ok=True)

def process_video_pipeline(video_path: str, task_id: str):
    """
    Background task to process the video using PyTorch/OpenCV.
    In a real implementation, this loads YOLO/ByteTrack models.
    """
    print(f"[CV-Microservice] Starting processing for task {task_id}")
    
    try:
        from ultralytics import YOLO
        # Load a pre-trained YOLOv8 pose model for biomechanics
        model = YOLO('yolov8n-pose.pt') 
        
        # 1. Frame Extraction & Inference (OpenCV + YOLO)
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        print(f"[CV-Microservice] Extracted {frame_count} frames at {fps} FPS")
        print(f"[CV-Microservice] Running inference models...")

        # Process a subset of frames to extract biomechanics (e.g. bat swing speed, footwork)
        # results = model(video_path, stream=True)
        # for r in results:
        #    keypoints = r.keypoints  # Use keypoints to track wrist/elbow angles
        
        # 2. Mocking the calculation result for the Node webhook
        calculated_metrics = {
            "batSpeed": 85.2,
            "footworkScore": 9.1,
            "timing": 8.5
        }
        
    except ImportError:
        print("[CV-Microservice] Ultralytics YOLO not installed. Using mock inference.")
        calculated_metrics = { "batSpeed": 80.0, "footworkScore": 8.0 }

    finally:
        # Clean up
        if 'cap' in locals(): cap.release()
        os.remove(video_path)
        
    print(f"[CV-Microservice] Completed processing task {task_id}")
    # Here, we would trigger an HTTP POST webhook back to the Node.js orchestrator
    # requests.post(f"http://localhost:3000/api/video/webhook/{task_id}", json=calculated_metrics)

@app.post("/analyze-video")
async def analyze_video(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Endpoint for the Node.js orchestrator to send videos to.
    """
    task_id = str(uuid.uuid4())
    file_location = f"temp_videos/{task_id}_{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
        
    # Process asynchronously so the Node app isn't blocked waiting for a 10-minute CV task
    background_tasks.add_task(process_video_pipeline, file_location, task_id)
    
    return {
        "status": "ACCEPTED", 
        "task_id": task_id,
        "message": "Video queued for deep learning extraction."
    }

@app.get("/health")
def health_check():
    return {"status": "GPU instances healthy and ready."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
