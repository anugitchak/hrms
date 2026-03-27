# HRMS Face Recognition Microservice

A Python Flask microservice that handles all face recognition processing server-side using **OpenCV SFace** (99.60% LFW accuracy).

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

Models auto-download on first run, but for cPanel/shared hosting you should upload the `models/` folder with the app so startup does not depend on external downloads.

## Running

```bash
python main.py
```

For local development the backend can use:

- `FACE_SERVICE_URL=http://127.0.0.1:8001`

For cPanel production with Passenger:

- Mount the Python app at `/face-api`
- Use `passenger_wsgi.py` as the startup file
- Set backend `FACE_SERVICE_URL=https://api.mmhrms.in/face-api`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/enroll` | Extract 128-dim face descriptor from image |
| POST | `/recognize` | Match a face against stored descriptors |
