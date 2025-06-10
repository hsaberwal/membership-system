-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_user
      WHERE  usename = 'membership_user') THEN
      CREATE USER membership_user WITH PASSWORD 'membership123';
   END IF;
END
$do$;

-- Create database if not exists
SELECT 'CREATE DATABASE membership'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'membership')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE membership TO membership_user;

-- Connect to membership database and set permissions
\c membership

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO membership_user;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
