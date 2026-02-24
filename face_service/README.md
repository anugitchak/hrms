# HRMS Face Recognition Microservice

A Python FastAPI microservice that handles all face recognition processing server-side using **OpenCV SFace** (99.60% LFW accuracy).

## Why a Python Microservice?

The previous system ran `face-api.js` *in the browser*, meaning face descriptor extraction varied with camera quality, lighting, and device type. This service processes raw images on the **server**, producing consistent descriptors regardless of source device.

## Prerequisites

- Python 3.10+ (tested on 3.13)
- No CMake, no Visual C++ Build Tools, no compilation needed

## Installation

```bash
cd face_service
pip install -r requirements.txt
```

Models auto-download on first run (~5MB total from OpenCV Zoo).

## Running

```bash
python main.py
# or
uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/enroll` | Extract 128-dim face descriptor from image |
| POST | `/recognize` | Match a face against stored descriptors |
