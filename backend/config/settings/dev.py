from .base import *
from dotenv import load_dotenv
import os
import dj_database_url

load_dotenv(BASE_DIR / '.env')

DEBUG = True
SECRET_KEY = os.getenv('SECRET_KEY', 'unsafe-secret-key-for-dev')
ALLOWED_HOSTS = ['*']

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL')
    )
}

# Email Configuration for Development
# Use custom backend that handles SSL certificate issues on macOS
EMAIL_BACKEND = 'apps.users.email_backend.SSLEmailBackend'

# Add apps/ to PYTHONPATH so we can import apps.core, etc.
import sys
sys.path.insert(0, str(BASE_DIR / 'apps'))

