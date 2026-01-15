#!/bin/bash
# ===========================================
# TeacherCalc Quick Deploy Script
# ===========================================
# Run this on your EC2 instance AFTER:
# 1. Cloning the repository
# 2. Setting up PostgreSQL
# 3. Configuring .env files
# ===========================================

set -e

echo "🚀 TeacherCalc Deployment Script"
echo "=================================="

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Run this script from the TeacherCalc root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found"
    echo "   Copy deployment/.env.backend.production to backend/.env and fill in values"
    exit 1
fi

echo ""
echo "📦 Step 1: Backend Setup"
echo "------------------------"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install gunicorn psycopg2-binary python-decouple

echo "Running migrations..."
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py migrate

echo "Collecting static files..."
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py collectstatic --noinput

cd ..

echo ""
echo "🎨 Step 2: Frontend Setup"
echo "-------------------------"
cd frontend

echo "Installing npm dependencies..."
npm install

echo "Building frontend..."
npm run build

cd ..

echo ""
echo "🔧 Step 3: Services Setup"
echo "-------------------------"

# Create gunicorn log directory
sudo mkdir -p /var/log/gunicorn
sudo chown $USER:www-data /var/log/gunicorn

# Copy and enable gunicorn service
echo "Setting up Gunicorn service..."
sudo cp deployment/gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable gunicorn
sudo systemctl restart gunicorn

# Copy and enable nginx config
echo "Setting up Nginx..."
sudo cp deployment/nginx.conf /etc/nginx/sites-available/teachercalc
sudo ln -sf /etc/nginx/sites-available/teachercalc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo ""
echo "✅ Deployment Complete!"
echo "========================"
echo ""
echo "Your app should now be running at: http://YOUR_EC2_IP"
echo ""
echo "Useful commands:"
echo "  View Gunicorn logs:  sudo tail -f /var/log/gunicorn/error.log"
echo "  Restart Gunicorn:    sudo systemctl restart gunicorn"
echo "  Restart Nginx:       sudo systemctl restart nginx"
echo ""
