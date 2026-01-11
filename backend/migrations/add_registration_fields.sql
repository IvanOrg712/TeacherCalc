-- =============================================
-- USER REGISTRATION SYSTEM - DATABASE MIGRATION
-- =============================================
-- Run these SQL commands to add the required columns to the teachers table

-- Add profile fields
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Add email verification fields
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP WITH TIME ZONE;

-- Add last_login field (if not already added)
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'teachers'
ORDER BY ordinal_position;
