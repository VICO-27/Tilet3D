### Tilet3D Backend — Authentication Module Documentation (v1.0)

### 📅 Date

July 2026

### 🧠 Project Overview

Tilet3D is a Django + Django REST Framework backend designed to support an AI-powered e-commerce platform with:

*   Email/password authentication
*   Google OAuth authentication
*   JWT-based session management
*   User profile system (for 3D avatar + personalization data)

The current stage focuses only on the **Accounts (Authentication + Profile)** system.

* * *

### 1\. 🏗️ Architecture Overview

### Stack

*   Django (Backend framework)
*   Django REST Framework (API layer)
*   PostgreSQL (Database)
*   SimpleJWT (Authentication tokens)
*   Google OAuth (Third-party login)

* * *

### App Structure

text

    TILET3D/
    ├── .vscode/
    └── backend/
        ├── apps/
        │   ├── accounts/
        │   │   ├── api/
        │   │   │   ├── __init__.py
        │   │   │   ├── google.py
        │   │   │   ├── serializers.py
        │   │   │   ├── urls.py
        │   │   │   └── views.py
        │   │   ├── migrations/
        │   │   ├── __init__.py
        │   │   ├── admin.py
        │   │   ├── apps.py
        │   │   ├── backends.py
        │   │   ├── models.py
        │   │   ├── signals.py
        │   │   └── tests.py
        │   └── common/
        │       ├── __init__.py
        │       └── models.py
        ├── config/
        │   ├── settings/
        │   │   ├── __init__.py
        │   │   ├── base.py
        │   │   ├── development.py
        │   │   └── production.py
        │   ├── __init__.py
        │   ├── asgi.py
        │   ├── urls.py
        │   └── wsgi.py
        ├── docs/
        ├── media/
        ├── requirements/
        │   ├── base.txt
        │   ├── development.txt
        │   └── production.txt
        ├── static/
        ├── tests/
        ├── venv/
        ├── .env
        ├── .env.example
        ├── .gitignore
        ├── manage.py
        ├── pyproject.toml
        └── README.md
    

Use code with caution.

* * *

### 2\. 🔐 Authentication System

### 2.1 Custom User Model

### Design Decision

We replaced Django’s default `User` model with a **custom email-based authentication system**.

### Features

*   UUID primary key
*   Email as login field
*   No username field
*   Supports:
    *   Email/password login
    *   Google OAuth login (passwordless users)

### Key Model Concept

*   Authentication data is separated from profile data

* * *

### 2.2 User Model Responsibilities

### ✔ Authentication identity only

*   email
*   password hash
*   is\_active
*   is\_staff

### ❌ NOT included

*   name
*   avatar
*   body measurements
*   preferences

* * *

### 2.3 User Manager

Custom `UserManager` handles:

### create\_user()

*   Normalizes email
*   Supports:
    *   password users
    *   passwordless users (Google OAuth)
*   Secure password hashing

### create\_superuser()

*   Ensures:
    *   is\_staff = True
    *   is\_superuser = True

* * *

### 3\. 👤 Profile System (Separation of Concerns)

### Design Principle: “Auth ≠ Profile”

We created a separate `Profile` model:

### Profile Fields

*   full\_name
*   nickname
*   gender
*   body\_type
*   skin\_tone

### Relationship

text

    User (1) → (1) Profile
    

Use code with caution.

### Behavior

*   Auto-created when needed
*   Ensures every user has a profile
*   Used for:
    *   3D avatar customization
    *   clothing try-on system
    *   personalization features

* * *

### 4\. 🔑 Email + Password Authentication

### Flow

### Register

*   User submits email + password
*   System creates user via `create_user()`

### Login

*   Uses `authenticate(email, password)`
*   Returns:
    *   access token
    *   refresh token
    *   user identity

* * *

### JWT System (SimpleJWT)

### Configuration

*   Access Token Lifetime: 60 minutes
*   Refresh Token Lifetime: 7 days
*   Authorization header: Bearer token

* * *

### 5\. 🔐 Google OAuth Login (ID Token Flow)

### Approach Used

✔ Backend-verification model (NOT redirect-based OAuth)

* * *

### Flow

text

    Frontend Google Login
    ↓
    Google returns ID Token
    ↓
    Send token to Django backend
    ↓
    Backend verifies token using GOOGLE_CLIENT_ID
    ↓
    Create or retrieve user
    ↓
    Create profile if new user
    ↓
    Return JWT tokens
    

Use code with caution.

* * *

### Backend Logic

### Verification

*   Uses `google.oauth2.id_token`
*   Validates token against:
    *   GOOGLE\_CLIENT\_ID

### User Creation Logic

*   If user exists → reuse
*   If not:
    *   create user
    *   set unusable password
    *   create profile

* * *

### Output

json

    {
      "access": "jwt_access_token",
      "refresh": "jwt_refresh_token",
      "email": "user@gmail.com",
      "created": true
    }
    

Use code with caution.

* * *

### 6\. 🧾 API Endpoints

### Auth Routes

*   **Register**: `POST /api/auth/register/`
*   **Login**: `POST /api/auth/login/`
*   **Google Login**: `POST /api/auth/google/`
*   **Logout**: `POST /api/auth/logout/`

### Profile Routes

*   **Get / Update Profile**: `GET /api/accounts/profile/` | `PATCH /api/accounts/profile/`

* * *

### 7\. 🧩 Technical Implementations

### 7.1 JWT Authentication

*   Stateless authentication
*   Token-based security
*   No session storage required

### 7.2 Permissions System

Endpoint

Permission

register

AllowAny

login

AllowAny

google login

AllowAny

profile

IsAuthenticated

### 7.3 Profile Auto-Creation

python

    Profile.objects.get_or_create(user=request.user)
    

Use code with caution.

**Ensures:**

*   No missing profile errors
*   Seamless frontend experience

* * *

### 8\. ⚠️ Issues Encountered & Solutions

### 8.1 PostgreSQL Permission Error

*   **Problem**: `permission denied for schema public`
*   **Cause**: DB user lacked schema permissions.
*   **Fix**: Granted schema privileges to DB user and ensured ownership alignment.

### 8.2 Missing Imports Errors

*   **Problem**: `APIView not defined`, `status not defined`, `RefreshToken missing`
*   **Cause**: Incomplete imports in `views.py`.
*   **Fix**: Added required DRF imports.

### 8.3 Google Client ID Missing

*   **Problem**: `ImproperlyConfigured: GOOGLE_CLIENT_ID not found`
*   **Fix**: Added environment variable and integrated Google Cloud OAuth setup.

### 8.4 Duplicate ENV Variables

*   **Problem**: Multiple `GOOGLE_CLIENT_ID` entries.
*   **Fix**: Only one valid value retained.

* * *

### 9\. 🔐 Security Decisions

### Implemented:

*   Password hashing (Django default)
*   JWT authentication
*   Token verification for Google login
*   `IsAuthenticated` protection on profile

### Planned Improvements:

*   JWT refresh rotation
*   Token blacklisting (logout security)
*   Rate limiting login endpoints
*   Account email verification (optional)

* * *

### 10\. 📊 Current System Status

### Completed Modules:

*   Custom User Model (UUID + Email auth)
*   Profile system
*   Register API
*   Login API
*   Logout API
*   JWT authentication system
*   Google OAuth login
*   Protected profile API

* * *

### 11\. 🚧 Known Limitations (MVP stage)

*   No email verification system yet
*   No password reset flow
*   No social account linking
*   No advanced profile validation rules
*   No audit logging system

* * *

### 12\. 🚀 What’s Next (Roadmap)

### Phase 2: Products App (NEXT TASK)

We will build:

### Product System

*   Product model
*   Categories
*   Images
*   Sizes / variations

### 3D Try-On Integration

*   Body measurements
*   Avatar mapping
*   Clothing simulation data structure

### Phase 3 (Later)

*   Payment system
*   Cart & Orders
*   Recommendation system (AI-based)

* * *

### 🧠 Final Summary

You have successfully built a production-grade authentication foundation with:

*   Clean separation of Auth vs Profile
*   JWT-based stateless authentication
*   Google OAuth integration (secure ID token verification)
*   Scalable user architecture (UUID + email-based identity)

This is a strong backend foundation suitable for a real SaaS or startup-level system.

📌 **End of Documentation**

*Next session: Products App Design (Core e-commerce engine + 3D try-on foundation)*