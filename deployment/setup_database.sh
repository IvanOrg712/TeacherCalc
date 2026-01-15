#!/bin/bash
# Database setup script for PostgreSQL
# Run this once on your EC2 instance as the ubuntu user

echo "🗄️  Setting up PostgreSQL database..."

# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE teachercalc;

-- Create user with password
CREATE USER teachercalc_user WITH PASSWORD 'hugne2-hEfner-rynnys';

-- Configure user
ALTER ROLE teachercalc_user SET client_encoding TO 'utf8';
ALTER ROLE teachercalc_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE teachercalc_user SET timezone TO 'UTC';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE teachercalc TO teachercalc_user;

-- For PostgreSQL 15+, grant schema privileges
\c teachercalc
GRANT ALL ON SCHEMA public TO teachercalc_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO teachercalc_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO teachercalc_user;

-- Exit
\q
EOF

echo "✅ Database setup complete!"
echo "Database: teachercalc"
echo "User: teachercalc_user"
echo ""
echo "Test connection with:"
echo "psql -U teachercalc_user -d teachercalc -h localhost"
