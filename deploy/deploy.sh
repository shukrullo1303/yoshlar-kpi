#!/bin/bash
# Asaka KPI — VPS deployment script
# Server: 95.46.96.12  |  Path: /var/www/asaka-kpi
# Run: bash deploy/deploy.sh

set -e

APP_DIR="/var/www/asaka-kpi"
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"
VENV="$APP_DIR/venv"

echo "=== [1/7] Kod yangilanmoqda ==="
cd "$APP_DIR"
git pull origin main

echo "=== [2/7] Python paketlar o'rnatilmoqda ==="
"$VENV/bin/pip" install -r "$BACKEND/requirements.txt" --quiet

echo "=== [3/7] Migratsiyalar bajarilmoqda ==="
cd "$BACKEND"
DJANGO_SETTINGS_MODULE=config.settings.production "$VENV/bin/python" manage.py migrate --noinput

echo "=== [4/7] Static fayllar yig'ilmoqda ==="
DJANGO_SETTINGS_MODULE=config.settings.production "$VENV/bin/python" manage.py collectstatic --noinput --clear

echo "=== [5/7] Frontend build ==="
cd "$FRONTEND"
npm install --silent
npm run build

echo "=== [6/7] Gunicorn qayta ishga tushirilmoqda ==="
sudo systemctl reload asaka-kpi || sudo systemctl restart asaka-kpi

echo "=== [7/7] Nginx tekshirilmoqda ==="
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✓ Deploy muvaffaqiyatli yakunlandi!"
sudo systemctl status asaka-kpi --no-pager -l
