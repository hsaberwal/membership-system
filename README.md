# Membership Management System

A comprehensive web-based membership management system with role-based access control, member approval workflows, and event management capabilities.

## Features

- **User Authentication & Role-Based Access Control**
  - Multiple user roles: Admin, Approver, Data Entry, Editor, Printer
  - JWT-based authentication
  - Role-specific permissions and UI

- **Member Management**
  - Add new members with photo capture/upload
  - Automatic member number generation by membership type
  - Member approval workflow
  - Complete member directory with search and filters

- **External Integrations**
  - **Loqate API**: Postcode-based address lookup
  - **SmartSearch API**: AML (Anti-Money Laundering) checks

- **Membership Cards**
  - Visual card template designer
  - Print membership cards with barcodes
  - Different designs for each membership type

- **Event Management**
  - Create and manage events
  - Member check-in system
  - Real-time attendance tracking

- **Audit Trail**
  - Complete audit logging of all actions
  - Track user activities and changes

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: MinIO (S3-compatible)
- **Containerization**: Docker & Docker Compose
- **Proxy**: Nginx with SSL support

## Prerequisites

- Docker and Docker Compose
- Git
- SSL certificate (self-signed or valid)
- API keys for Loqate and SmartSearch (optional)

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd membership-system

2. Copy environment example:

cp .env.example .env

3. Update .env with your configuration
4. Start the system:

docker-compose up -d

5. Access the application:

HTTPS: https://your-domain:8843
HTTP: http://your-domain:8090 (redirects to HTTPS)

Default admin credentials:

Username: admin
Password: admin123

Configuration
Environment Variables
Create a .env file in the project root:

# API Keys
LOQATE_API_KEY=your_loqate_api_key
SMARTSEARCH_API_KEY=your_smartsearch_api_key

# Database (if changing defaults)
DB_PASSWORD=your_secure_password


SSL Configuration
Place your SSL certificates in nginx/ssl/:

nginx-selfsigned.crt
nginx-selfsigned.key

Development
For local development without Docker:

# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

Architecture

├── backend/          # Node.js Express API
├── frontend/         # React TypeScript SPA
├── database/         # PostgreSQL migrations and seeds
├── docker/           # Docker configuration files
├── nginx/            # Nginx configuration and SSL
└── docker-compose.yml

License
[Your License]
Support
For issues and questions, please create an issue in the repository.

## Create INSTALL.md

```bash
vi ~/membership-system/INSTALL.md
markdown# Installation Guide

## Prerequisites

### System Requirements
- Ubuntu 20.04+ / Debian 10+ / CentOS 8+ / macOS / Windows with WSL2
- 4GB RAM minimum (8GB recommended)
- 10GB free disk space
- Ports available: 8090, 8843, 5432, 6379, 9000, 9001

### Software Requirements
- Docker 20.10+
- Docker Compose 1.29+
- Git
- OpenSSL (for generating self-signed certificates)

## Step-by-Step Installation

### 1. Install Docker and Docker Compose

#### Ubuntu/Debian:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose

# Logout and login again for group changes
macOS:
Download and install Docker Desktop from https://www.docker.com/products/docker-desktop/
Windows:
Install Docker Desktop with WSL2 backend from https://www.docker.com/products/docker-desktop/
2. Clone the Repository
bashgit clone <repository-url>
cd membership-system
3. Generate SSL Certificates
bash# Create SSL directory
mkdir -p nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/nginx-selfsigned.key \
  -out nginx/ssl/nginx-selfsigned.crt \
  -subj "/C=GB/ST=London/L=London/O=Membership/CN=localhost"
4. Configure Environment
bash# Copy example environment file
cp .env.example .env

# Edit configuration
nano .env
Required configurations:
env# External API Keys (optional but recommended)
LOQATE_API_KEY=your_loqate_api_key_here
SMARTSEARCH_API_KEY=your_smartsearch_api_key_here

# JWT Secret (change this!)
JWT_SECRET=your_super_secret_jwt_key_here

# Database Password (change this!)
DB_PASSWORD=your_secure_database_password
5. Start the Application
bash# Start all services
docker-compose up -d

# Check if all services are running
docker-compose ps

# View logs if needed
docker-compose logs -f
6. Initialize Database
bash# Run database migrations
docker exec membership_backend sh -c "cd /app && npm run migrate"

# Seed initial data
docker exec membership_backend sh -c "cd /app && npm run seed"
7. Create Test Users (Optional)
bash# Get admin token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Create test users
curl -X POST http://localhost:3000/api/users/create-test-users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN"
8. Access the Application
Open your browser and navigate to:

HTTPS: https://localhost:8843 (accept the self-signed certificate warning)
HTTP: http://localhost:8090 (will redirect to HTTPS)

Login with default admin credentials:

Username: admin
Password: admin123

Post-Installation
1. Change Default Passwords

Login as admin
Go to Users menu
Reset the admin password
Create new admin users as needed

2. Configure External APIs
Loqate (Address Lookup)

Register at https://www.loqate.com/
Get your API key
Add to .env file
Restart backend: docker-compose restart backend

SmartSearch (AML Checks)

Register at https://www.smartsearch.com/
Get your API key
Add to .env file
Restart backend: docker-compose restart backend

3. Production Deployment
For production deployment:

Use proper SSL certificates
Change all default passwords
Set secure JWT secret
Configure firewall rules
Set up regular backups
Monitor logs and performance

Troubleshooting
Services not starting
bash# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild services
docker-compose down
docker-compose up -d --build
Database connection issues
bash# Check if PostgreSQL is running
docker exec membership_postgres pg_isready

# Reset database
docker-compose down -v
docker-compose up -d
# Then re-run migrations and seeds
Port conflicts
bash# Check what's using a port
sudo lsof -i :8843

# Change ports in docker-compose.yml if needed
Maintenance
Backup Database
bash# Backup
docker exec membership_postgres pg_dump -U membership_user membership > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i membership_postgres psql -U membership_user membership < backup_20240101.sql
Update Application
bashgit pull
docker-compose down
docker-compose up -d --build
docker exec membership_backend sh -c "cd /app && npm run migrate"
View Logs
bash# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
Security Considerations

Change all default passwords immediately
Use strong JWT secrets
Enable firewall rules for production
Regular security updates
Monitor audit logs
Regular backups
Use proper SSL certificates for production

Support
For issues:

Check logs: docker-compose logs
Check service status: docker-compose ps
Refer to troubleshooting section
Create an issue in the repository


These files provide comprehensive documentation for users to understand and install your membership system. The README is GitHub-friendly with clear sections and the INSTALL guide provides detailed step-by-step instructions.RetryClaude can make mistakes. Please double-check responses.

