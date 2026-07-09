# Authentication System Documentation

## Overview

The authentication system is responsible for managing user identity, registration, login, authorization, and secure access to protected resources.

Tilet3D uses a custom authentication architecture built on top of Django authentication with Django REST Framework (DRF) and JSON Web Tokens (JWT).

The system was designed to support:

- Email-based authentication
- Custom user model
- JWT access and refresh tokens
- Token rotation and blacklist
- Future Google OAuth integration
- Secure API authorization
- Role-based permission expansion

---

# Authentication Architecture

The authentication flow follows this architecture:

Client
|
|
| Email + Password
|
v
Accounts API
|
|
| Validate User
|
v
Custom Authentication Backend
|
|
| Generate JWT Tokens
|
v
Client receives:
- Access Token
- Refresh Token

|
|
v

Protected APIs
(Product, Cart, Orders, Payments)


---

# User Model Design

Tilet3D does not use Django's default User model.

A custom user model was created to provide flexibility for future features.

Location:

apps/accounts/models.py

The user model extends:

AbstractBaseUser


and provides:

- UUID primary key
- Email authentication
- Password authentication
- Account status management
- Permission support

---

# User Identity

The main identity field is:


email


Example:

```json
{
    "email": "customer@example.com",
    "password": "secure_password"
}

The system does not use usernames.

Why Email Authentication?

Traditional Django authentication uses usernames.

For an e-commerce platform, email authentication provides:

Better user experience
Easier password recovery
Industry-standard behavior
Better integration with payment providers

Future systems such as:

Google Login
Email verification
Marketing communication

can naturally use email as the primary identity.

Authentication Backend

Location:

apps/accounts/backends.py

A custom authentication backend was implemented:

EmailBackend

Responsibilities:

Find users by email
Verify passwords
Return authenticated users

Flow:

User enters email/password

        |
        v

EmailBackend.authenticate()

        |
        v

Search User table

        |
        v

Check password hash

        |
        v

Return User object
JWT Authentication

Tilet3D uses:

djangorestframework-simplejwt

for token authentication.

Configuration:

config/settings/base.py
Token Types

The system uses two tokens:

Access Token

Purpose:

Authenticate API requests

Lifetime:

15 minutes

Example:

Authorization: Bearer <access_token>
Refresh Token

Purpose:

Generate new access tokens

Lifetime:

7 days
Token Security Configuration

Current configuration:

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME":
        timedelta(minutes=15),

    "REFRESH_TOKEN_LIFETIME":
        timedelta(days=7),

    "ROTATE_REFRESH_TOKENS": True,

    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES":
        ("Bearer",),

}

Security benefits:

Short-lived access tokens
Refresh token rotation
Old refresh token invalidation
Authentication API

Base URL:

/api/auth/
Register User

Endpoint:

POST /api/auth/register/

Purpose:

Create a new customer account.

Request
{
    "email": "user@example.com",
    "password": "password123"
}
Response

Example:

{
    "message": "User created successfully"
}
Login

Endpoint:

POST /api/auth/login/

Purpose:

Authenticate a user and generate JWT tokens.

Request
{
    "email": "user@example.com",
    "password": "password123"
}
Response

Example:

{
    "access":
    "eyJhbGciOiJIUzI1Ni...",

    "refresh":
    "eyJhbGciOiJIUzI1Ni..."
}
Using JWT Tokens

After login, protected requests must include:

Header:

Authorization: Bearer ACCESS_TOKEN

Example:

GET /api/cart/

Headers:

Authorization:
Bearer eyJhbGciOiJIUzI1...
Profile Endpoint

Endpoint:

GET /api/auth/profile/

Purpose:

Retrieve authenticated user information.

Example Response:

{
    "id": "uuid",
    "email": "user@example.com"
}
Logout System

Endpoint:

POST /api/auth/logout/

Purpose:

Invalidate refresh tokens.

The logout process uses:

token blacklist

provided by:

rest_framework_simplejwt.token_blacklist

Flow:

User logout

      |
      v

Refresh token submitted

      |
      v

Token added to blacklist

      |
      v

Future refresh attempts fail
Google OAuth Preparation

The project contains preparation for Google authentication.

Location:

apps/accounts/api/google.py

Environment variables:

GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET

Current status:

Implemented structure.

Future work:

Complete Google OAuth flow
Create/login users automatically
Connect Google identity with existing accounts
Permissions System

Default API permission:

IsAuthenticated

Meaning:

Most endpoints require login.

Example protected resources:

Cart
Orders
Payments
Likes
Comments

Public resources:

Product listing
Product details
Authentication Flow Example

Complete customer journey:

1. User registers

        |
        v

2. User logs in

        |
        v

3. Server generates JWT tokens

        |
        v

4. Client stores tokens

        |
        v

5. Client sends access token

        |
        v

6. User can access protected APIs
Security Considerations

Implemented:

Password hashing
JWT authentication
Token expiration
Refresh rotation
Token blacklist
Custom authentication backend

Future improvements:

Email verification
Password reset
Two-factor authentication
Account activity tracking
Login history
Device management
Current Status

Authentication system status:

✅ Custom user model
✅ Email authentication
✅ JWT authentication
✅ Access/refresh tokens
✅ Logout blacklist
✅ Protected APIs
✅ Google OAuth preparation

Future Expansion

The authentication system is designed to support:

Customer accounts
Seller accounts
Admin accounts
AI avatar profiles
Personalized recommendations
User preference tracking

