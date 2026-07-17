# Server birinchi marta sozlash (Ubuntu 22.04 / 24.04)

## Serverga kirish
```bash
ssh root@95.46.96.12
```

## 1. Paketlar
```bash
apt update && apt upgrade -y
apt install -y python3 python3-venv python3-pip nginx mysql-server pkg-config \
               libmysqlclient-dev nodejs npm git
```

## 2. Loyiha papkasi
```bash
mkdir -p /var/www/asaka-kpi
cd /var/www/asaka-kpi
git clone <repo-url> .
# yoki: git clone git@github.com:USERNAME/yoshlar-kpi.git .
```

## 3. Python virtual muhit
```bash
python3 -m venv venv
venv/bin/pip install --upgrade pip
venv/bin/pip install -r backend/requirements.txt
```

## 4. .env fayl yaratish
```bash
cp backend/.env.example backend/.env
nano backend/.env   # parollarni kiriting
```

`.env` ichida to'ldirish kerak bo'lgan qatorlar:
```
SECRET_KEY=<50+ belgili tasodifiy kalit>
ALLOWED_HOSTS=95.46.96.12,asaka-kpi.uz,www.asaka-kpi.uz
ALLOWED_ORIGINS=https://asaka-kpi.uz,https://www.asaka-kpi.uz
DB_PASSWORD=<mysql paroli>
```

SECRET_KEY generatsiya qilish:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

## 5. MySQL bazasi
```bash
mysql -u root -p
```
```sql
CREATE DATABASE asakakpi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'asakakpi_user'@'localhost' IDENTIFIED BY 'db-parolingiz';
GRANT ALL PRIVILEGES ON asakakpi_db.* TO 'asakakpi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 6. Django tayyorlash
```bash
cd /var/www/asaka-kpi/backend
DJANGO_SETTINGS_MODULE=config.settings.production ../venv/bin/python manage.py migrate
DJANGO_SETTINGS_MODULE=config.settings.production ../venv/bin/python manage.py createsuperuser
DJANGO_SETTINGS_MODULE=config.settings.production ../venv/bin/python manage.py collectstatic --noinput
DJANGO_SETTINGS_MODULE=config.settings.production ../venv/bin/python manage.py seed_data
```

## 7. Frontend build
```bash
cd /var/www/asaka-kpi/frontend
npm install
npm run build
```

## 8. Ruxsatlar va log papkasi
```bash
mkdir -p /var/log/gunicorn
chown -R www-data:www-data /var/log/gunicorn
chown -R www-data:www-data /var/www/asaka-kpi
mkdir -p /var/www/asaka-kpi/backend/logs
chown www-data:www-data /var/www/asaka-kpi/backend/logs
```

## 9. Gunicorn service
```bash
cp /var/www/asaka-kpi/deploy/systemd/asaka-kpi.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable asaka-kpi
systemctl start asaka-kpi
systemctl status asaka-kpi
```

## 10. Nginx
```bash
cp /var/www/asaka-kpi/deploy/nginx/asaka-kpi.conf /etc/nginx/sites-available/asaka-kpi
ln -s /etc/nginx/sites-available/asaka-kpi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 11. SSL (ixtiyoriy, domen tayyor bo'lganda)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d asaka-kpi.uz -d www.asaka-kpi.uz
# Keyin nginx/asaka-kpi.conf dagi HTTPS blokini yoqing
```

## Keyingi deploylar
```bash
cd /var/www/asaka-kpi
bash deploy/deploy.sh
```

## Foydali buyruqlar
```bash
systemctl status asaka-kpi          # holat
journalctl -u asaka-kpi -f          # live loglar
tail -f /var/log/gunicorn/asaka-kpi-error.log
systemctl restart asaka-kpi         # qayta ishga tushirish
nginx -t && systemctl reload nginx  # nginx reload
```
