# cPanel Face Recognition & CORS Fix Guide

## Problem
- Face recognition returns 503 errors on cPanel
- Employee portal shows CORS errors
- Backend API URL: `https://api.mmhrms.in`
- Frontend URL: `https://mmhrms.in` or `https://www.mmhrms.in`

## Root Causes

### 1. CORS Missing api Subdomain
Backend CORS configuration was missing `api.mmhrms.in` subdomain, causing cross-origin errors when frontend calls backend API.

**Fixed in:** `backend/config/cors.php`
```php
$allowedOrigins = array_values(array_filter(array_unique([
    env('FRONTEND_URL', 'http://localhost:3000'),
    'https://mmhrms.in',
    'https://www.mmhrms.in',
    'https://api.mmhrms.in',  // ← ADDED
    'http://mmhrms.in',
    'http://www.mmhrms.in',
    'http://api.mmhrms.in',   // ← ADDED
    'http://localhost:3000',
    'http://127.0.0.1:8000',
])));
```

### 2. Face Service CORS Hardcoded to Localhost
Python face recognition microservice had CORS origins hardcoded to localhost only.

**Fixed in:** `face_service/main.py`
```python
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://mmhrms.in",
    "https://www.mmhrms.in",
    "https://api.mmhrms.in",  // ← ADDED
    "http://mmhrms.in",
    "http://www.mmhrms.in",
    "http://api.mmhrms.in",   // ← ADDED
    "https://your-cpanel-domain.com",  // ← Replace with your actual domain
]
```

### 3. 503 Face Service Unavailable
Common causes on cPanel:
1. Face service not running or crashed
2. Wrong `FACE_SERVICE_URL` in `.env`
3. Firewall blocking port 8001
4. Passenger/WSGI not configured properly

## Deployment Steps

### Step 1: Update Backend .env
In your cPanel backend `.env` file:

```env
APP_URL=https://api.mmhrms.in
FRONTEND_URL=https://mmhrms.in

# Optional: Wildcard pattern for subdomains
CORS_ALLOWED_ORIGINS_PATTERN=https://.*\.mmhrms\.in

# Face service URL - MUST point to where face service is hosted
FACE_SERVICE_URL=https://face.mmhrms.in
# OR if on same server with port access:
# FACE_SERVICE_URL=http://127.0.0.1:8001
```

### Step 2: Update Face Service .env (if exists)
```env
FLASK_ENV=production
ALLOWED_ORIGINS=https://mmhrms.in,https://www.mmhrms.in,https://api.mmhrms.in
```

### Step 3: Configure Face Service on cPanel

#### Option A: As a Separate Flask App (Recommended)
1. Create subdomain: `face.mmhrms.in`
2. Point document root to `/face_service/public`
3. Create `.htaccess` in `face_service/public/`:
```apache
RewriteEngine On
RewriteRule ^$ index.php [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ passenger_wsgi.py/$1 [QSA,L]
```

4. Update `passenger_wsgi.py`:
```python
import sys
import os

# Add project root to path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from main import app as application

if __name__ == "__main__":
    application.run()
```

#### Option B: As a Background Process (Advanced)
1. SSH into your cPanel server
2. Run with Gunicorn:
```bash
cd /path/to/face_service
pip install gunicorn
gunicorn -w 4 -t 120 --bind 127.0.0.1:8001 main:app --daemon
```

3. Add to crontab to restart on reboot:
```bash
@reboot cd /path/to/face_service && gunicorn -w 4 -t 120 --bind 127.0.0.1:8001 main:app --daemon
```

### Step 4: Verify Face Service is Running

#### Test Health Endpoint
```bash
curl https://face.mmhrms.in/health
# Should return: {"status":"healthy","models_loaded":true}
```

#### Check Logs
```bash
# For passenger
tail -f /home/username/logs/face.mmhrms.in-error.log

# For gunicorn
tail -f /path/to/face_service/gunicorn-error.log
```

### Step 5: Test CORS Configuration

#### Backend API CORS Test
```bash
curl -X OPTIONS https://api.mmhrms.in/api/login \
  -H "Origin: https://mmhrms.in" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

Expected headers:
```
Access-Control-Allow-Origin: https://mmhrms.in
Access-Control-Allow-Credentials: true
```

#### Face Service CORS Test
```bash
curl -X POST https://face.mmhrms.in/enroll \
  -H "Origin: https://mmhrms.in" \
  -H "Access-Control-Request-Method: POST" \
  -i
```

Expected headers:
```
Access-Control-Allow-Origin: https://mmhrms.in
Access-Control-Allow-Credentials: true
```

### Step 6: Clear Caches
```bash
cd backend
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

## Troubleshooting

### Face Service Returns 503

1. **Check if service is running:**
```bash
ps aux | grep gunicorn
# or check passenger
passenger-status
```

2. **Check logs:**
```bash
tail -100 /path/to/face_service/passenger_wsgi.log
# or
tail -100 /home/username/logs/face.mmhrms.in-error.log
```

3. **Common errors:**
   - `ModuleNotFoundError`: Python dependencies missing → `pip install -r requirements.txt`
   - `Address already in use`: Port 8001 blocked → use different port or check firewall
   - `Permission denied`: File permissions → `chmod 755` on directories

### CORS Errors Persist

1. **Verify exact domain match:**
   - Browser console shows: `Origin https://www.mmhrms.in`
   - Your CORS config must include exactly `https://www.mmhrms.in`
   - Wildcards don't work in CORS - must list each subdomain

2. **Check for redirect issues:**
   - HTTP → HTTPS redirects can cause CORS preflight to fail
   - Add both HTTP and HTTPS versions to allowed origins

3. **Browser cache:**
   - CORS headers can be cached by browser
   - Test in incognito mode or clear cache

### Employee Portal Still Shows CORS Errors

Check which endpoint is failing in browser console:

1. **Backend API calls failing:**
   - Fix backend CORS (already done)
   - Ensure `.env` has correct `FRONTEND_URL`

2. **Face recognition calls failing:**
   - Fix face service CORS (already done)
   - Ensure `FACE_SERVICE_URL` points to correct domain

3. **Third-party calls failing:**
   - Check if any external APIs are called
   - Add those domains to CORS if needed

## Production Checklist

- [ ] Backend `.env` updated with production URLs
- [ ] Face service `.env` updated (if exists)
- [ ] Face service deployed and accessible
- [ ] CORS test passes for both backend and face service
- [ ] All caches cleared
- [ ] Logs monitored for errors
- [ ] Face recognition tested in browser
- [ ] Employee portal tested for CORS errors

## Monitoring

Add health check monitoring:

```bash
# Add to crontab - runs every 5 minutes
*/5 * * * * curl -f https://face.mmhrms.in/health || echo "Face service down at $(date)" | mail -s "Face Service Alert" admin@mmhrms.in
```

## Rollback

If issues persist, temporarily disable face recognition:

1. In `backend/app/Http/Controllers/AuthController.php`:
```php
// Comment out face login routes temporarily
// Route::post('/auth/login-face', [AuthController::class, 'loginFace']);
```

2. Users can still login with email/password while face service is fixed.
