web: cd backend && python manage.py migrate && python manage.py loaddata src/core/fixtures/initial_data.json && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2
