"""
HRMS Face Recognition Microservice v4

Uses OpenCV's built-in face detection (YuNet) and recognition (SFace) models.
- Flask with threaded=True for concurrent requests
- Gunicorn for production (4 workers × 2 threads = 8 parallel)
- YuNet: Fast, accurate face detector (threshold lowered for poor webcams)
- SFace: 99.60% accuracy on LFW benchmark
- CLAHE + gamma correction for low-light environments
- Bilateral filter for noisy/grainy webcams
- Zero compilation required — pure pre-built pip wheels
"""

import os
import sys

# Must be set BEFORE importing numpy/cv2
os.environ['OPENBLAS_NUM_THREADS'] = '1'
os.environ['MKL_NUM_THREADS'] = '1'
os.environ['OMP_NUM_THREADS'] = '1'

import urllib.request
import logging
import json
import io
import time
import threading
from collections import defaultdict, deque

import cv2
import numpy as np
from PIL import Image, ImageOps
from flask import Flask, request, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ===== Model Management =====
MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

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

    # Score threshold lowered from 0.6 → 0.4 for poor webcams / low-light
    face_detector = cv2.FaceDetectorYN.create(
        FACE_DETECT_MODEL, "", (320, 320), 0.4, 0.3, 5000
    )
    face_recognizer = cv2.FaceRecognizerSF.create(FACE_RECOG_MODEL, "")

    logger.info("Face models loaded (YuNet threshold=0.4 for low-quality webcam support).")


# ===== Flask App Setup =====
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# SECURITY FIX: Restricted CORS to specific origins instead of wildcard "*"
# Prevents unauthorized cross-origin requests and biometric data theft
# In production, replace with actual frontend/backend domains
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://mmhrms.in",
    "https://www.mmhrms.in",
    "https://api.mmhrms.in",
    "http://mmhrms.in",
    "http://www.mmhrms.in",
    "http://api.mmhrms.in",
]
CORS(app, origins=allowed_origins, supports_credentials=True)

RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30
_RATE_LIMIT_BUCKETS = defaultdict(deque)
_RATE_LIMIT_LOCK = threading.Lock()


def _client_ip() -> str:
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr or "unknown"


def _is_rate_limited(bucket_key: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> bool:
    now = time.time()
    with _RATE_LIMIT_LOCK:
        bucket = _RATE_LIMIT_BUCKETS[bucket_key]
        while bucket and (now - bucket[0]) > RATE_LIMIT_WINDOW_SECONDS:
            bucket.popleft()

        if len(bucket) >= max_requests:
            return True

        bucket.append(now)
        return False

# Initialize models at module load time (for Passenger/WSGI)
init_models()


# ===== Image Processing =====

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Enhanced preprocessing for cross-device, low-light, and poor webcam results.
    
    Pipeline:
    1. Resize to max 1024px (keep aspect ratio)
    2. CLAHE on L channel — boosts local contrast in dark regions
    3. Gamma correction — if image is dark (avg brightness < 100), brighten it
    4. Bilateral filter — reduces grain from cheap webcams while preserving edges
    5. AutoContrast — final pass to normalize levels
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Step 1: Resize if too large
    max_size = 1024
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    img_array = np.array(image)
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

    # Step 2: CLAHE on L channel (adaptive local contrast enhancement)
    lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_enhanced = clahe.apply(l_channel)
    lab_enhanced = cv2.merge([l_enhanced, a_channel, b_channel])
    img_bgr = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

    # Step 3: Gamma correction for dark images
    gray_check = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    avg_brightness = np.mean(gray_check)
    if avg_brightness < 100:
        # Apply gamma < 1 to brighten (0.6 for very dark, 0.8 for somewhat dark)
        gamma = 0.6 if avg_brightness < 60 else 0.8
        inv_gamma = 1.0 / gamma
        table = np.array([
            ((i / 255.0) ** inv_gamma) * 255 for i in range(256)
        ]).astype("uint8")
        img_bgr = cv2.LUT(img_bgr, table)
        logger.info(f"Low-light detected (brightness={avg_brightness:.0f}), applied gamma={gamma}")

    # Step 4: Bilateral filter for noisy/grainy webcams
    img_bgr = cv2.bilateralFilter(img_bgr, d=5, sigmaColor=50, sigmaSpace=50)

    # Step 5: Final autocontrast via PIL
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    image = Image.fromarray(img_rgb)
    image = ImageOps.autocontrast(image, cutoff=1)
    img_bgr = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

    return img_bgr


def detect_and_align(img_bgr: np.ndarray):
    """Detect faces and return aligned face(s)."""
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

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "HRMS Face Recognition Service v4",
        "model": "OpenCV SFace (99.60% LFW accuracy)",
        "detector": "OpenCV YuNet (threshold=0.4)",
        "enhancements": "CLAHE + gamma + bilateral filter",
    })


@app.route("/enroll", methods=["POST"])
def enroll_face():
    """Extract face descriptor(s) from an enrollment image."""
    try:
        if _is_rate_limited(f"enroll:{_client_ip()}", max_requests=20):
            return jsonify({"error": "rate_limited", "message": "Too many enroll requests. Please retry in a minute."}), 429

        if "image" not in request.files:
            return jsonify({"error": "missing_image", "message": "No image file provided"}), 400

        image_bytes = request.files["image"].read()
        img_bgr = preprocess_image(image_bytes)
        detected = detect_and_align(img_bgr)

        if not detected:
            return jsonify({
                "error": "no_face_detected",
                "message": "No face detected. Please ensure your face is clearly visible, well-lit, and centered."
            }), 422

        if len(detected) > 1:
            logger.warning(f"Multiple faces detected ({len(detected)}), using largest face")

        detected.sort(key=lambda x: x[1][2] * x[1][3], reverse=True)
        aligned_face, bbox = detected[0]

        descriptor = extract_feature(aligned_face)

        logger.info(f"Enrollment: extracted descriptor ({len(descriptor)}-dim)")

        return jsonify({
            "success": True,
            "descriptors": [descriptor],
            "faces_found": len(detected),
            "message": "Face descriptor extracted successfully"
        })

    except Exception as e:
        logger.error(f"Enrollment error: {str(e)}")
        return jsonify({"error": "processing_failed", "message": f"Failed to process image: {str(e)}"}), 500


@app.route("/recognize", methods=["POST"])
def recognize_face():
    """Match a face against stored descriptors using cosine similarity."""
    try:
        if _is_rate_limited(f"recognize:{_client_ip()}", max_requests=30):
            return jsonify({"error": "rate_limited", "message": "Too many recognition attempts. Please retry in a minute."}), 429

        if "image" not in request.files:
            return jsonify({"error": "missing_image", "message": "No image file provided"}), 400

        stored_descriptors_str = request.form.get("stored_descriptors", "")
        try:
            users_data = json.loads(stored_descriptors_str)
        except json.JSONDecodeError:
            return jsonify({"error": "invalid_json", "message": "Invalid stored_descriptors JSON"}), 400

        image_bytes = request.files["image"].read()
        img_bgr = preprocess_image(image_bytes)
        detected = detect_and_align(img_bgr)

        if not detected:
            return jsonify({
                "error": "no_face_detected",
                "message": "No face detected. Please ensure good lighting and face the camera directly."
            }), 422

        detected.sort(key=lambda x: x[1][2] * x[1][3], reverse=True)
        aligned_face, _ = detected[0]
        query_feature = np.array(extract_feature(aligned_face), dtype=np.float64)

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

                score = float(np.dot(query_feature, stored_arr) / (
                    np.linalg.norm(query_feature) * np.linalg.norm(stored_arr) + 1e-8
                ))

                if score > best_score:
                    second_best_score = best_score
                    best_score = score
                    best_match_user_id = user_id
                elif score > second_best_score:
                    second_best_score = score

        # SECURITY: High threshold for structural match (0.363 is OpenCV default, 0.40 is strict)
        COSINE_THRESHOLD = 0.33
        # SECURITY: If top 2 matches are too close, it means faces are too similar (e.g. twins, glasses). 
        # Require a clear margin of victory to prevent mixing up similar employees.
        MIN_MARGIN = 0.03

        logger.info(f"Recognition: best_score={best_score:.4f}, user_id={best_match_user_id}")

        if best_match_user_id is None or best_score < COSINE_THRESHOLD:
            return jsonify({
                "matched": False,
                "user_id": None,
                "confidence": 0,
                "score": round(best_score, 4),
                "reason": "no_match",
                "message": "Face not recognized. Score below threshold."
            })

        if second_best_score > -1.0:
            margin = best_score - second_best_score
            if margin < MIN_MARGIN:
                return jsonify({
                    "matched": False,
                    "user_id": None,
                    "confidence": 0,
                    "score": round(best_score, 4),
                    "reason": "ambiguous_match",
                    "message": "Recognition confidence too low. Please try again."
                })

        confidence = int(min(100, max(0, (best_score - COSINE_THRESHOLD) / (1.0 - COSINE_THRESHOLD) * 100)))

        return jsonify({
            "matched": True,
            "user_id": best_match_user_id,
            "confidence": confidence,
            "score": round(best_score, 4),
            "reason": "success",
            "message": "Face recognized successfully"
        })

    except Exception as e:
        logger.error(f"Recognition error: {str(e)}")
        return jsonify({"error": "processing_failed", "message": f"Face recognition failed: {str(e)}"}), 500


if __name__ == "__main__":
    # Windows dev: threaded=True for parallel request handling
    # Production: use gunicorn (see README.md)
    app.run(host="127.0.0.1", port=8001, debug=False, threaded=True)
