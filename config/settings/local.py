from config.settings.base import *

import os

BASE_DIR = BASE_DIR.parent

EXTERNAL_APPS = [
    'rest_framework', 
    'drf_yasg',
    "debug_toolbar",
]

LOCAL_APPS = ["src.core"]

INSTALLED_APPS += EXTERNAL_APPS + LOCAL_APPS

SECRET_KEY = "secret-key-for-local-development"

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "APP_DIRS": True,
        # ...
    }
]