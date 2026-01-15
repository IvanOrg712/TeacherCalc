"""
Development settings for TeacherCalc

This configuration is for local development only.
"""
from .base import *
from dotenv import load_dotenv
import os

load_dotenv(BASE_DIR / '.env')

# Development overrides
DEBUG = True
SECRET_KEY = os.getenv('SECRET_KEY', 'unsafe-secret-key-for-dev-only')
ALLOWED_HOSTS = ['*']

# Database - Use PostgreSQL if DATABASE_URL is set, otherwise fallback to SQLite
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL)
    }
else:
    # Fallback to SQLite for simple local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# CORS - Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Frontend URL for email verification links
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Email Configuration for Development
# Use custom backend that handles SSL certificate issues on macOS
EMAIL_BACKEND = 'apps.users.email_backend.SSLEmailBackend'

# Add apps/ to PYTHONPATH so we can import apps.core, etc.
import sys
sys.path.insert(0, str(BASE_DIR / 'apps'))
