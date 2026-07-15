#!/bin/bash
# PythonAnywhere bash konsolida ishga tushiring
# Birinchi deploy: bash deploy.sh
# Yangilash:       bash deploy.sh update

set -e

REPO="https://github.com/shukrullo1303/yoshlar-kpi.git"
DIR="$HOME/yoshlar-kpi"

# ── 1. Reponi clone yoki pull ─────────────────────────────────────────────────
if [ -d "$DIR/.git" ]; then
    echo "📥 Yangilanmoqda..."
    cd "$DIR" && git pull
else
    echo "📥 Clone qilinmoqda..."
    git clone "$REPO" "$DIR"
    cd "$DIR"
fi

# ── 2. Backend ────────────────────────────────────────────────────────────────
cd "$DIR/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate

pip install -r requirements.txt -q

# .env fayl yaratish (birinchi marta)
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo ""
    echo "⚠️  MUHIM: .env faylini tahrirlang!"
    echo "    nano $DIR/backend/.env"
    echo "    SECRET_KEY ni o'zgartiring"
    echo ""
fi

python manage.py migrate
python manage.py loaddata src/core/fixtures/initial_data.json
python manage.py collectstatic --noinput

# ── 3. Frontend ───────────────────────────────────────────────────────────────
cd "$DIR/frontend"
npm install --silent
npm run build

echo ""
echo "✅ Deploy tayyor!"
echo ""
echo "Keyingi qadamlar:"
echo "  1. PythonAnywhere → Web → Reload tugmasini bosing"
echo "  2. Birinchi marta: python manage.py seed_data && python manage.py createsuperuser"
