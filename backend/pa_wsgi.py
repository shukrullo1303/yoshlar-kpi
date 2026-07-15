"""
PythonAnywhere WSGI fayli.
Dashboard → Web → WSGI configuration file → ushbu fayl yo'lini kiriting:
  /home/YOUR_USERNAME/yoshlar-kpi/backend/pa_wsgi.py
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

BASE = Path(__file__).resolve().parent  # backend/
load_dotenv(BASE / '.env')

sys.path.insert(0, str(BASE))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
