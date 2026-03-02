"""
HRMS Face Recognition Microservice v3

Uses OpenCV's built-in face detection (YuNet) and recognition (SFace) models.
- Flask (WSGI) for cPanel Passenger compatibility
- YuNet: Fast, accurate face detector
- SFace: 99.60% accuracy on LFW benchmark
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

    face_detector = cv2.FaceDetectorYN.create(
        FACE_DETECT_MODEL, "", (320, 320), 0.6, 0.3, 5000
    )
    face_recognizer = cv2.FaceRecognizerSF.create(FACE_RECOG_MODEL, "")

    logger.info("Face models loaded successfully.")


# ===== Flask App Setup =====
app = Flask(__name__)
CORS(app, origins=["*"])

# Initialize models at module load time (for Passenger/WSGI)
init_models()


# ===== Image Processing =====

def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Preprocess image for consistent cross-device results."""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    max_size = 1024
    if max(image.size) > max_size:
        ratio = max_size / max(image.size)
        new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
        image = image.resize(new_size, Image.LANCZOS)

    image = ImageOps.autocontrast(image, cutoff=1)
    img_array = np.array(image)
    img_bgr = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

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
        "service": "HRMS Face Recognition Service",
        "model": "OpenCV SFace (99.60% LFW accuracy)",
        "detector": "OpenCV YuNet",
    })


@app.route("/enroll", methods=["POST"])
def enroll_face():
    """Extract face descriptor(s) from an enrollment image."""
    try:
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

        COSINE_THRESHOLD = 0.363
        MIN_MARGIN = 0.05

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
    app.run(host="127.0.0.1", port=8001, debug=False)
