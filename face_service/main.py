"""
HRMS Face Recognition Microservice v2

Uses OpenCV's built-in face detection (YuNet) and recognition (SFace) models.
- YuNet: Fast, accurate face detector
- SFace: 99.60% accuracy on LFW benchmark
- Zero compilation required — pure pre-built pip wheels
- Device-agnostic: processes raw images server-side

Models are auto-downloaded on first run.
"""

import os
import urllib.request
import logging
from contextlib import asynccontextmanager

import cv2
import numpy as np
from PIL import Image, ImageOps
import io
import json

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== Model Management =====
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

FACE_DETECT_MODEL = os.path.join(MODELS_DIR, "face_detection_yunet_2023mar.onnx")
FACE_RECOG_MODEL = os.path.join(MODELS_DIR, "face_recognition_sface_2021dec.onnx")

FACE_DETECT_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
FACE_RECOG_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

face_detector = None
face_recognizer = None


def download_model(url: str, path: str):
    """Download a model file if it doesn't exist."""
    if os.path.exists(path):
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    logger.info(f"Downloading model: {os.path.basename(path)} ...")
    urllib.request.urlretrieve(url, path)
    logger.info(f"Downloaded: {path}")


def init_models():
    """Initialize OpenCV face detector and recognizer."""
    global face_detector, face_recognizer

    download_model(FACE_DETECT_URL, FACE_DETECT_MODEL)
    download_model(FACE_RECOG_URL, FACE_RECOG_MODEL)

    face_detector = cv2.FaceDetectorYN.create(
        FACE_DETECT_MODEL, "", (320, 320), 0.6, 0.3, 5000
    )
    face_recognizer = cv2.FaceRecognizerSF.create(FACE_RECOG_MODEL, "")

    logger.info("Face detection and recognition models loaded successfully.")


# ===== App Setup =====
@asynccontextmanager
async def lifespan(app):
    init_models()
    yield

app = FastAPI(
    title="HRMS Face Recognition Service",
    description="High-accuracy face recognition using OpenCV SFace (99.60% LFW)",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===== Image Processing =====

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess image for consistent cross-device results:
    1. Convert to RGB via PIL (handles any format)
    2. Apply auto-contrast to normalize lighting
    3. Resize if too large
    4. Convert to OpenCV BGR format
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Resize if too large (OpenCV doesn't need huge images)
    max_size = 1024
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    # Auto-contrast: normalize lighting differences across devices
    image = ImageOps.autocontrast(image, cutoff=1)

    # Convert PIL RGB -> OpenCV BGR
    img_array = np.array(image)
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    return img_bgr


def detect_and_align(img_bgr: np.ndarray):
    """
    Detect faces and return aligned face(s) with bounding box info.
    Returns list of (aligned_face, bbox) tuples.
    """
    h, w = img_bgr.shape[:2]
    face_detector.setInputSize((w, h))

    _, faces = face_detector.detect(img_bgr)

    if faces is None or len(faces) == 0:
        return []

    results = []
    for face in faces:
        aligned = face_recognizer.alignCrop(img_bgr, face)
        results.append((aligned, face))

    return results


def extract_feature(aligned_face: np.ndarray) -> list:
    """Extract 128-dimensional feature vector from an aligned face."""
    feature = face_recognizer.feature(aligned_face)
    return feature.flatten().tolist()


# ===== API Endpoints =====

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "HRMS Face Recognition Service",
        "model": "OpenCV SFace (99.60% LFW accuracy)",
        "detector": "OpenCV YuNet",
    }


@app.post("/enroll")
async def enroll_face(image: UploadFile = File(...)):
    """
    Extract face descriptor(s) from an enrollment image.
    Returns 128-dim feature vector(s) for each detected face.
    Call 3 times with different angles for best cross-device accuracy.
    """
    try:
        image_bytes = await image.read()
        img_bgr = preprocess_image(image_bytes)
        detected = detect_and_align(img_bgr)

        if not detected:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "no_face_detected",
                    "message": "No face detected. Please ensure your face is clearly visible, well-lit, and centered."
                }
            )

        if len(detected) > 1:
            logger.warning(f"Multiple faces detected ({len(detected)}), using largest face")

        # Use the largest face (by bounding box area)
        detected.sort(key=lambda x: x[1][2] * x[1][3], reverse=True)
        aligned_face, bbox = detected[0]

        descriptor = extract_feature(aligned_face)

        logger.info(f"Enrollment: extracted descriptor ({len(descriptor)}-dim), bbox area={int(bbox[2]*bbox[3])}")

        return {
            "success": True,
            "descriptors": [descriptor],
            "faces_found": len(detected),
            "message": "Face descriptor extracted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enrollment error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "processing_failed", "message": f"Failed to process image: {str(e)}"}
        )


@app.post("/recognize")
async def recognize_face(
    image: UploadFile = File(...),
    stored_descriptors: str = Form(...)
):
    """
    Match a face against stored descriptors using cosine similarity.
    
    stored_descriptors format: [{"user_id": 1, "descriptors": [[...128...], ...]}, ...]
    Returns best match with confidence score.
    """
    try:
        try:
            users_data = json.loads(stored_descriptors)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail={"error": "invalid_json", "message": "Invalid stored_descriptors JSON"})

        image_bytes = await image.read()
        img_bgr = preprocess_image(image_bytes)
        detected = detect_and_align(img_bgr)

        if not detected:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "no_face_detected",
                    "message": "No face detected. Please ensure good lighting and face the camera directly."
                }
            )

        # Use the largest face
        detected.sort(key=lambda x: x[1][2] * x[1][3], reverse=True)
        aligned_face, _ = detected[0]
        query_feature = np.array(extract_feature(aligned_face), dtype=np.float64)

        # Compare against all stored descriptors
        best_match_user_id = None
        best_score = -1.0
        second_best_score = -1.0

        for user_data in users_data:
            user_id = user_data["user_id"]
            user_descriptors = user_data.get("descriptors", [])

            for stored_desc in user_descriptors:
                if not stored_desc or len(stored_desc) < 64:
                    continue

                stored_arr = np.array(stored_desc, dtype=np.float64)

                # Cosine similarity (OpenCV SFace uses cosine similarity, not Euclidean)
                score = float(np.dot(query_feature, stored_arr) / (
                    np.linalg.norm(query_feature) * np.linalg.norm(stored_arr) + 1e-8
                ))

                if score > best_score:
                    second_best_score = best_score
                    best_score = score
                    best_match_user_id = user_id
                elif score > second_best_score:
                    second_best_score = score

        # Thresholds for SFace cosine similarity
        COSINE_THRESHOLD = 0.363  # OpenCV's recommended threshold for SFace
        MIN_MARGIN = 0.05  # Minimum gap between best and second-best

        logger.info(
            f"Recognition: best_score={best_score:.4f}, "
            f"second_best={second_best_score:.4f}, "
            f"user_id={best_match_user_id}"
        )

        if best_match_user_id is None or best_score < COSINE_THRESHOLD:
            return {
                "matched": False,
                "user_id": None,
                "confidence": 0,
                "score": round(best_score, 4),
                "reason": "no_match",
                "message": "Face not recognized. Score below threshold."
            }

        # Check ambiguity
        if second_best_score > -1.0:
            margin = best_score - second_best_score
            if margin < MIN_MARGIN:
                logger.warning(f"Low confidence margin: {margin:.4f}")
                return {
                    "matched": False,
                    "user_id": None,
                    "confidence": 0,
                    "score": round(best_score, 4),
                    "reason": "ambiguous_match",
                    "message": "Recognition confidence too low. Please try again."
                }

        # Confidence: 0-100 scale based on how far above threshold
        confidence = int(min(100, max(0, (best_score - COSINE_THRESHOLD) / (1.0 - COSINE_THRESHOLD) * 100)))

        return {
            "matched": True,
            "user_id": best_match_user_id,
            "confidence": confidence,
            "score": round(best_score, 4),
            "reason": "success",
            "message": "Face recognized successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Recognition error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={"error": "processing_failed", "message": f"Face recognition failed: {str(e)}"}
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
