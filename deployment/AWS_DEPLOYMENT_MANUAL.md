# AWS EC2 Deployment Manual - TeacherCalc

Complete step-by-step guide to deploy TeacherCalc on AWS EC2.

---

## Prerequisites

- AWS Account with EC2 access
- SSH key pair created in AWS
- Your EC2 Instance **Public IP** (you'll get this after launching)

---

## 1. Launch EC2 Instance

1. Go to **AWS Console → EC2 → Launch Instance**
2. Configure:
   - **Name**: `TeacherCalc-Server`
   - **AMI**: Ubuntu Server 24.04 LTS
   - **Instance Type**: `t2.micro` (free tier) or `t2.small` for better performance
   - **Key pair**: Select your SSH key
   - **Security Group**: Create new with these rules:

| Type | Port | Source |
|------|------|--------|
| SSH | 22 | Your IP or 0.0.0.0/0 |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |
| Custom TCP | 8000 | 0.0.0.0/0 (for initial testing) |

3. **Launch instance** and note the **Public IP address**

---

## 2. Connect to EC2

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP
```

---

## 3. Install System Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib nginx git nodejs npm
```

---

## 4. Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/TeacherCalc.git
cd TeacherCalc
```

---

## 5. Setup Database

```bash
# Run the database setup script
chmod +x deployment/setup_database.sh
sudo bash deployment/setup_database.sh
```

Or manually:
```bash
sudo -u postgres psql -c "CREATE DATABASE teachercalc;"
sudo -u postgres psql -c "CREATE USER teachercalc_user WITH PASSWORD 'YOUR_DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE teachercalc TO teachercalc_user;"
sudo -u postgres psql -d teachercalc -c "GRANT ALL ON SCHEMA public TO teachercalc_user;"
```

---

## 6. Backend Setup

```bash
cd /home/ubuntu/TeacherCalc/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn psycopg2-binary python-decouple

# Copy environment file (edit with your values!)
cp .env.production.template .env

# Edit the .env file with your actual values
nano .env

# Run migrations
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py migrate

# Collect static files
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py collectstatic --noinput

# Create superuser (optional)
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py createsuperuser
```

---

## 7. Frontend Setup

```bash
cd /home/ubuntu/TeacherCalc/frontend

# Install dependencies
npm install

# Create production .env
echo "VITE_API_URL=http://YOUR_EC2_IP/api" > .env.production

# Build for production
npm run build
```

---

## 8. Configure Nginx

```bash
# Edit nginx config with your EC2 IP
sudo nano /etc/nginx/sites-available/teachercalc

# Copy the content from deployment/nginx.conf
# Replace YOUR_EC2_IP_HERE with your actual EC2 IP

# Enable the site
sudo ln -sf /etc/nginx/sites-available/teachercalc /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## 9. Setup Gunicorn Service

```bash
# Create log directory
sudo mkdir -p /var/log/gunicorn
sudo chown ubuntu:www-data /var/log/gunicorn

# Copy service file
sudo cp deployment/gunicorn.service /etc/systemd/system/

# Start and enable
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn

# Check status
sudo systemctl status gunicorn
```

---

## 10. Test Deployment

1. Open browser: `http://YOUR_EC2_IP`
2. You should see the TeacherCalc frontend
3. Test login/registration

---

## Troubleshooting

### Check Logs
```bash
# Nginx errors
sudo tail -f /var/log/nginx/error.log

# Gunicorn errors
sudo tail -f /var/log/gunicorn/error.log

# Django directly
cd /home/ubuntu/TeacherCalc/backend
source venv/bin/activate
DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py runserver 0.0.0.0:8000
```

### Restart Services
```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test PostgreSQL connection
psql -U teachercalc_user -d teachercalc -h localhost
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Restart Gunicorn | `sudo systemctl restart gunicorn` |
| Restart Nginx | `sudo systemctl restart nginx` |
| View Gunicorn logs | `sudo tail -f /var/log/gunicorn/error.log` |
| Activate venv | `cd /home/ubuntu/TeacherCalc/backend && source venv/bin/activate` |
| Run migrations | `DJANGO_SETTINGS_MODULE=config.settings.prod python manage.py migrate` |
| Rebuild frontend | `cd /home/ubuntu/TeacherCalc/frontend && npm run build` |
