c# HRMS cPanel Deployment Guide

This project has 3 deployable parts:

1. `frontend-react` -> `https://mmhrms.in`
2. `backend` -> `https://api.mmhrms.in`
3. `face_service` -> Python app mounted at `https://api.mmhrms.in/face-api`

## 1. Frontend deploy (`mmhrms.in`)

Build locally from `HRMS_Project/frontend-react`:

```powershell
npm run build
```

Upload the contents inside `frontend-react/build/` to your cPanel `public_html/` for `mmhrms.in`.

Important:

- This repo now includes `frontend-react/.env.production` with:
  - `REACT_APP_API_URL=https://api.mmhrms.in/api`
  - `REACT_APP_STORAGE_URL=https://api.mmhrms.in/storage`
- If you rebuild again, keep those values unchanged unless your domains change.

## 2. Backend deploy (`api.mmhrms.in`)

Recommended cPanel structure:

- Keep the full Laravel app outside public web root, for example:
  - `/home/USERNAME/hrms_backend`
- Point the `api.mmhrms.in` document root to:
  - `/home/USERNAME/hrms_backend/public`

If your cPanel does not let you point the subdomain to `public/`, stop and fix that first. Laravel should not expose the project root directly.

Backend setup steps:

1. Upload the full `backend/` folder.
2. Copy `backend/.env.production.example` to `.env`.
3. Fill database and mail credentials.
4. Run:

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
```

Production values that matter most:

- `APP_URL=https://api.mmhrms.in`
- `FRONTEND_URL=https://mmhrms.in`
- `FACE_SERVICE_URL=https://api.mmhrms.in/face-api`
- `SANCTUM_STATEFUL_DOMAINS=mmhrms.in,www.mmhrms.in,api.mmhrms.in`
- `SESSION_DOMAIN=.mmhrms.in`

## 3. Face service deploy (`api.mmhrms.in/face-api`)

Use cPanel Python App / Passenger for the `face_service` folder.

Suggested app setup:

- Application root: your uploaded `face_service/` directory
- Application URL: `/face-api`
- Startup file: `passenger_wsgi.py`
- Entry point: `application`
- Python version: 3.10+ preferred

Install dependencies:

```bash
pip install -r requirements.txt
```

Important for cPanel:

- Upload the `face_service/models/` folder too.
- Do not rely on first-run auto-download in production if your hosting blocks outbound downloads.
- After changing code, restart the Python app from cPanel.

Health check URL:

- `https://api.mmhrms.in/face-api/health`

## 4. Final smoke test

After all 3 parts are live, test these in order:

1. Open `https://api.mmhrms.in/api/test`
   Expected: `{"message":"API working!"}`
2. Open `https://api.mmhrms.in/face-api/health`
   Expected: JSON with `status: healthy`
3. Open `https://mmhrms.in`
4. Login with email/password
5. Test face enrollment
6. Test face login
7. Test employee quick check-in
8. Test profile photo upload and confirm the file opens from `https://api.mmhrms.in/storage/...`

## 5. Common cPanel mistakes

- Frontend built with localhost URLs
- Laravel subdomain pointing to project root instead of `public/`
- `.env` still using local database values
- `storage:link` not created
- Python app not restarted after upload
- Face service mounted on one URL, but `FACE_SERVICE_URL` pointing somewhere else
- ONNX model files missing from `face_service/models/`
