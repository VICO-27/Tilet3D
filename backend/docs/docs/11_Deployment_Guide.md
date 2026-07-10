# 11. Deployment Guide

> **Project:** Tilet3D Backend  
> **Purpose:** Document how to prepare, configure, and deploy the Django backend for production environments.

---

# Overview

The Tilet3D backend is designed using a production-ready architecture:

- Django application server
- Django REST Framework API
- PostgreSQL database
- Gunicorn application server
- Nginx reverse proxy
- Environment-based configuration
- Static and media file management

The deployment architecture separates:


Development Environment
|
|
Production Environment


allowing safe testing before releasing new versions.

---

# Production Architecture

             Users
               |
               |
          Nginx Server
               |
               |
          Gunicorn
               |
               |
         Django Backend
               |
    ---------------------
    |                   |

PostgreSQL Media Storage
Database Files


---

# Required Production Components

## Backend


Python 3.12+
Django
Django REST Framework
Gunicorn


---

## Database

Production database:


PostgreSQL


Recommended:


PostgreSQL 16+


---

## Web Server

Recommended:


Nginx


Responsibilities:

- Reverse proxy
- SSL termination
- Static files
- Media files
- Request handling

---

# Environment Configuration

The project uses environment variables.

Example:


.env


contains:

```env
DEBUG=False

SECRET_KEY=production-secret-key


DB_NAME=tilet3d
DB_USER=tilet3d_user
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432


CHAPA_SECRET_KEY=production_key


GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
Environment Separation

The backend uses:

config/settings/
│
├── base.py
├── development.py
└── production.py
Development

Used locally.

Example:

python manage.py runserver

Settings:

DEBUG=True
Production

Used on servers.

Example:

gunicorn config.wsgi:application

Settings:

DEBUG=False
Installation Process
1. Clone Repository
git clone <repository-url>

cd backend
2. Create Virtual Environment
python -m venv venv

Activate:

Linux:

source venv/bin/activate

Windows:

venv\Scripts\activate
3. Install Dependencies
pip install -r requirements/base.txt

Production:

pip install -r requirements/production.txt
4. Configure Environment

Create:

.env

Copy:

.env.example

and update values.

5. Database Setup

Create PostgreSQL database:

CREATE DATABASE tilet3d;

Create user:

CREATE USER tilet3d_user 
WITH PASSWORD 'password';

Grant permissions:

GRANT ALL PRIVILEGES 
ON DATABASE tilet3d 
TO tilet3d_user;
6. Run Database Migration
python manage.py migrate
7. Create Admin User
python manage.py createsuperuser

Example:

Email:
Password:
8. Collect Static Files

Production requires static collection.

Run:

python manage.py collectstatic

Generated:

staticfiles/
Gunicorn Deployment

Install:

pip install gunicorn

Test:

gunicorn config.wsgi:application

Expected:

Listening at: http://127.0.0.1:8000
Systemd Service

Create:

/etc/systemd/system/tilet3d.service

Example:

[Unit]
Description=Tilet3D Django Backend

After=network.target


[Service]

User=ubuntu

WorkingDirectory=/home/ubuntu/tilet3d/backend

ExecStart=/home/ubuntu/tilet3d/backend/venv/bin/gunicorn \
config.wsgi:application

Restart=always


[Install]

WantedBy=multi-user.target

Enable:

sudo systemctl enable tilet3d

Start:

sudo systemctl start tilet3d

Check:

sudo systemctl status tilet3d
Nginx Configuration

Example:

server {

    listen 80;

    server_name api.tilet3d.com;


    location / {

        proxy_pass http://127.0.0.1:8000;

        proxy_set_header Host $host;

        proxy_set_header X-Real-IP $remote_addr;

    }


    location /static/ {

        alias /home/ubuntu/tilet3d/backend/static/;

    }


    location /media/ {

        alias /home/ubuntu/tilet3d/backend/media/;

    }

}

Restart:

sudo systemctl restart nginx
HTTPS Configuration

Use:

Let's Encrypt

Install:

sudo apt install certbot python3-certbot-nginx

Generate certificate:

sudo certbot --nginx

Result:

https://api.tilet3d.com
Media Files

Current development:

media/

contains uploaded files.

Production recommendation:

Use cloud storage:

AWS S3
Cloudflare R2
Google Cloud Storage

Architecture:

Django
   |
   |
Storage Service
   |
   |
Cloud Storage
Database Backup Strategy

Production databases must be backed up.

Example:

pg_dump tilet3d > backup.sql

Restore:

psql tilet3d < backup.sql

Recommended:

Daily automated backups
Security Checklist

Before production release:

Django
 DEBUG=False
 Strong SECRET_KEY
 Allowed hosts configured
 Secure cookies enabled
 HTTPS enabled
Database
 Strong database password
 Limited database permissions
 Automated backups
API
 JWT expiration configured
 Rate limiting added
 CORS configured
 Webhook verification enabled
Payments
 Production Chapa key
 Webhook signature verification
 Transaction logging
Deployment Checklist

Before going live:

Code Updated
      |
      ↓
Tests Passed
      |
      ↓
Environment Configured
      |
      ↓
Database Migrated
      |
      ↓
Static Files Collected
      |
      ↓
Gunicorn Running
      |
      ↓
Nginx Configured
      |
      ↓
HTTPS Enabled
      |
      ↓
Production Ready
Current Deployment Status

Current stage:

Development Environment

Completed:

✅ Django backend
✅ PostgreSQL integration
✅ Authentication
✅ Product system
✅ Cart system
✅ Order system
✅ Payment integration
✅ Chapa sandbox testing

Not yet completed:

⬜ Cloud deployment
⬜ Production database
⬜ CI/CD pipeline
⬜ Monitoring system
⬜ Error tracking
⬜ Cloud media storage

Future Production Improvements

Planned:

Docker containerization
GitHub Actions CI/CD
Automated testing pipeline
Redis caching
Celery background jobs
Monitoring with Sentry
Load balancing
Database replication

End of Deployment Guide.