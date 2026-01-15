#!/bin/bash
# Deployment script for AWS EC2
# Run this script on your EC2 instance after initial setup

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /home/ubuntu/TeacherCalc

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Backend deployment
echo "🐍 Deploying backend..."
cd backend

# Activate virtual environment
source venv/bin/activate

# Install/update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create logs directory if it doesn't exist
mkdir -p ../logs

# Restart Gunicorn
echo "🔄 Restarting backend service..."
sudo systemctl restart gunicorn

# Frontend deployment
echo "⚛️  Deploying frontend..."
cd ../frontend

# Install dependencies
npm install

# Build frontend
npm run build

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

# Check service status
echo "✅ Checking service status..."
sudo systemctl status gunicorn --no-pager | head -n 5
sudo systemctl status nginx --no-pager | head -n 5

echo "🎉 Deployment complete!"
echo "📊 View logs with:"
echo "  Backend: sudo tail -f /var/log/gunicorn/error.log"
echo "  Nginx: sudo tail -f /var/log/nginx/error.log"
