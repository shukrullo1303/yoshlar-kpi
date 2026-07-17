import os
from pathlib import Path
from dotenv import load_dotenv
from config.settings.base import *

# .env faylidan muhit o'zgaruvchilarini yuklash
load_dotenv(Path(__file__).resolve().parent.parent.parent / '.env')

# BASE_DIR fix: base.py sets it to backend/config/, we need backend/
BASE_DIR = BASE_DIR.parent

# ── Security ──────────────────────────────────────────────────────────────────
SECRET_KEY = os.environ['SECRET_KEY']
DEBUG = False
ALLOWED_HOSTS = [h.strip() for h in os.environ.get('ALLOWED_HOSTS', 'asaka-kpi.uz,www.asaka-kpi.uz').split(',') if h.strip()]

# ── Frontend dist ─────────────────────────────────────────────────────────────
FRONTEND_DIST = BASE_DIR.parent / 'frontend' / 'dist'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [FRONTEND_DIST],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    }
]

# ── Database ──────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'asakakpi_db'),
        'USER': os.environ.get('DB_USER', 'asakakpi_db'),
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    }
}

# ── Media & Static ────────────────────────────────────────────────────────────
MEDIA_URL  = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STATIC_URL  = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# ── CORS / CSRF ───────────────────────────────────────────────────────────────
_origins = [o.strip() for o in os.environ.get('ALLOWED_ORIGINS', '').split(',') if o.strip()]
CORS_ALLOWED_ORIGINS  = _origins
CSRF_TRUSTED_ORIGINS  = _origins
CORS_ALLOW_CREDENTIALS = True

# ── Security headers ──────────────────────────────────────────────────────────
X_FRAME_OPTIONS             = 'SAMEORIGIN'  # PDF iframe uchun kerak
SECURE_CONTENT_TYPE_NOSNIFF = True

# Nginx HTTPS proxy orqali ishlaganda X-Forwarded-Proto headerini ishon
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# HTTPS tayyor bo'lgandan keyin True ga o'zgartiring
_use_https = os.environ.get('USE_HTTPS', 'false').lower() == 'true'
SESSION_COOKIE_SECURE = _use_https
CSRF_COOKIE_SECURE    = _use_https

# Logging: production xatolarini ko'rish uchun
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'WARNING',
    },
}
