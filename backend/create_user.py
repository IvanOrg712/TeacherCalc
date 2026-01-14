"""
Simple script to create a teacher user with proper password hashing.
Run this with: source venv/bin/activate && python create_user.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Create or update user
email = 'ivanvivasgar@gmail.com'
password = 'password123'

try:
    user = User.objects.get(email=email)
    user.set_password(password)
    user.save()
    print(f'✅ Password updated for user: {email}')
except User.DoesNotExist:
    user = User.objects.create_user(
        email=email,
        password=password
    )
    print(f'✅ User created: {email}')
