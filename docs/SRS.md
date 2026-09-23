# Tilet3D — Software Requirements Specification (SRS)

**Version:** 1.0.0  
**Date:** 2026-08-04  
**Author:** Generated from codebase inspection  
**Status:** Living document — mark `[NEEDS CONFIRMATION FROM OWNER]` items as resolved when confirmed  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview & Architecture](#2-system-overview--architecture)
3. [Functional Requirements](#3-functional-requirements)
4. [Data Model](#4-data-model)
5. [API Specification](#5-api-specification)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Known Issues, Tech Debt & Open Risks](#8-known-issues-tech-debt--open-risks)
9. [Setup & Local Development Guide](#9-setup--local-development-guide)
10. [Glossary / Codebase Conventions](#10-glossary--codebase-conventions)
11. [Appendix](#11-appendix)

---

## 1. Introduction

### 1.1 Purpose

This document is the canonical Software Requirements Specification (SRS) for the **Tilet3D** platform. It is written for:

- New backend or frontend engineers joining the project cold
- Future AI coding agents that need to modify or extend the codebase
- The project owner reviewing the current state of the system

It is derived **entirely from the actual codebase** as of 2026-08-04. Anything not confirmed in the code is flagged `[NEEDS CONFIRMATION FROM OWNER]`.

### 1.2 Product Overview

Tilet3D is a luxury Ethiopian cultural clothing e-commerce platform. Its differentiating feature is a **real-time 3D Avatar Fitting Room**: users configure a digital avatar with their body measurements and skin tone, view it rendered live in WebGL, and — at checkout — the platform captures a frozen measurement snapshot that is passed to tailors for custom-fit production. The backend is a Django REST Framework API; the frontend is a React + Three.js SPA. Payments are processed via Chapa (an Ethiopian payment gateway).

### 1.3 Scope

**In scope (implemented):**
- Email/password and Google OAuth authentication with OTP email verification
- User profile and address book management
- 3D Avatar Studio: gender, body type, skin tone, and biometric measurements
- Product catalogue: categories, variants, media, likes, comments, shares
- Cart management (add, update, remove)
- Checkout: order creation, shipping fee calculation, avatar snapshot capture, Chapa payment initiation
- Payment webhook processing with server-side Chapa verification
- Order lifecycle state machine (Pending → Confirmed → Processing → Shipped → Delivered / Cancelled)
- Periodic Celery task to expire unpaid orders and release reserved stock
- Order history and detail pages
- Account page: profile, addresses, security (change password, active sessions, delete account)
- Partial i18n (English, Amharic, French, Oromo translation files exist — coverage incomplete)
- Django Admin for all models

**Explicitly out of scope (not implemented):**
- Product search / full-text search endpoint
- Bookmark/save endpoint (called in `useEngagementStore` but no backend endpoint exists — see §8)
- Review/rating system
- Refund processing flows
- Push notifications
- Multi-vendor / seller accounts
- Showroom locations map (listed in i18n footer but no implementation exists)
- Gift cards (listed in i18n footer but not implemented)
- Staging / production deployment configuration (production.py is empty)

### 1.4 Definitions, Acronyms & Abbreviations

| Term | Meaning |
|------|---------|
| **GLB** | GL Binary — binary GLTF 3D model format used for avatar meshes |
| **Draco** | Google's 3D mesh compression library; used to decode the avatar GLBs |
| **R3F** | React Three Fiber — React renderer for Three.js |
| **OTP** | One-Time Password — 6-digit numeric code sent via email |
| **JWT** | JSON Web Token — access/refresh token pair used for API auth |
| **ETB** | Ethiopian Birr — the currency used in all financial fields |
| **SKU** | Stock Keeping Unit — unique identifier for a product variant |
| **Avatar Snapshot** | A frozen JSON dict of biometric measurements captured at checkout time |
| **Couture Match** | UI label for the "measurements confirmed" state in the Avatar Studio HUD |
| **TLT** | Order number prefix — e.g. `TLT-20260706-000001` |
| **DRF** | Django REST Framework |
| **SPA** | Single Page Application |
| **Chapa** | Ethiopian fintech payment gateway (https://chapa.co) |
| **Brevo** | Transactional email provider used for OTP delivery (formerly Sendinblue) |
| **BaseModel** | Abstract Django model in `common/models.py` — provides UUID PK + timestamps |

---

## 2. System Overview & Architecture

### 2.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│                                                              │
│  React 19 SPA (Vite)                                         │
│  ├── React Router v7 (client-side routing)                   │
│  ├── Zustand stores (auth, cart, avatar, engagement, toast)  │
│  ├── Axios (apiClient) → JWT Bearer headers → Django API     │
│  ├── React Three Fiber + Three.js (WebGL avatar rendering)   │
│  └── i18next (partial i18n: en, am, fr, om)                  │
└──────────────┬───────────────────────────────────────────────┘
               │ HTTP/REST  (port 8000 in dev)
               ▼
┌──────────────────────────────────────────────────────────────┐
│                     DJANGO BACKEND                           │
│                                                              │
│  Django 5.2 + DRF 3.15                                       │
│  ├── apps/accounts  (auth, profile, OTP, addresses)          │
│  ├── apps/avatars   (3D avatar profiles + measurements)       │
│  ├── apps/products  (catalogue, variants, media, social)      │
│  ├── apps/cart      (shopping cart)                          │
│  ├── apps/orders    (checkout, lifecycle, numbering)          │
│  └── apps/payments  (Chapa gateway, webhook processing)       │
│                                                              │
│  Celery 5.6 worker + Celery Beat (order expiration task)     │
└──────┬──────────────────┬────────────────────────────────────┘
       │                  │
       ▼                  ▼
┌─────────────┐   ┌──────────────┐
│ PostgreSQL   │   │ Redis        │
│ (primary DB) │   │ (Celery      │
│              │   │  broker +    │
│              │   │  result      │
│              │   │  backend)    │
└─────────────┘   └──────────────┘
                         │
               ┌─────────▼──────────┐
               │  External Services │
               │  ├── Chapa API     │
               │  ├── Google OAuth  │
               │  └── Brevo SMTP    │
               └────────────────────┘
```

### 2.2 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19.2.6 |
| Frontend build tool | Vite | 8.0.12 |
| Frontend language | TypeScript | ~6.0.2 |
| 3D rendering | Three.js | 0.184.0 |
| 3D React bindings | @react-three/fiber | 9.6.1 |
| 3D helpers | @react-three/drei | 10.7.7 |
| 3D post-processing | @react-three/postprocessing | 3.0.4 |
| Animation (UI) | Framer Motion | 12.40.0 |
| Animation (hero) | GSAP | 3.15.0 |
| State management | Zustand | 5.0.14 |
| HTTP client | Axios | 1.18.1 |
| Routing | React Router DOM | 7.17.0 |
| Styling | Tailwind CSS | 3.4.17 |
| Icons | Lucide React | 1.17.0 |
| i18n | i18next + react-i18next | 26.3.6 / 17.0.11 |
| Toasts | react-hot-toast | 2.6.0 |
| Backend framework | Django | 5.2 |
| REST API | Django REST Framework | 3.15.2 |
| Auth tokens | djangorestframework-simplejwt | 5.4.0 |
| API schema | drf-spectacular | 0.29.0 |
| Database | PostgreSQL | (version not pinned) |
| DB driver | psycopg / psycopg2-binary | 3.3.4 / 2.9.9 |
| Task queue | Celery | 5.6.3 |
| Message broker | Redis | (via redis 8.0.1 client) |
| Email | Django SMTP → Brevo relay | — |
| Payment | Chapa | v1 API |
| Google OAuth | google-auth | 2.55.1 |
| CORS | django-cors-headers | 4.4.0 |
| Media storage | Local filesystem (dev) / django-storages + boto3 available | — |
| Static files | whitenoise | 6.8.0 |

### 2.3 Repository Structure

```
Tilet3D/
├── backend/
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py          # All shared settings, JWT config, CORS, Celery
│   │   │   ├── development.py   # CORS allowed origins for localhost:5173
│   │   │   └── production.py    # EMPTY — production config not written yet
│   │   ├── urls.py              # Root URL conf — mounts all app routers
│   │   ├── celery.py            # Celery app definition
│   │   └── asgi.py / wsgi.py
│   ├── apps/
│   │   ├── accounts/            # Auth, User, Profile, OTP, Address, SecurityAuditLog
│   │   ├── avatars/             # AvatarProfile (3D measurements)
│   │   ├── products/            # Category, Product, ProductVariant, ProductMedia, social
│   │   ├── cart/                # Cart, CartItem
│   │   ├── orders/              # Order, OrderItem + services (checkout, lifecycle, numbering, expiration)
│   │   └── payments/            # Payment, Chapa gateway, PaymentService
│   ├── common/
│   │   ├── models.py            # BaseModel (UUID PK + timestamps)
│   │   └── utils.py             # generate_unique_slug()
│   ├── requirements/
│   │   ├── base.txt             # All dependencies (pinned)
│   │   ├── development.txt      # Dev-only deps
│   │   └── production.txt       # EMPTY
│   └── media/                   # Uploaded files (gitignored in production)
│
├── frontend/
│   ├── public/
│   │   ├── models/
│   │   │   ├── maleAvatar.glb   # 3D male avatar mesh (~3.5 MB, Draco-compressed)
│   │   │   └── femaleAvatar.glb # 3D female avatar mesh (~10 MB, Draco-compressed)
│   │   └── locales/             # i18n JSON files: en/, am/, fr/, om/
│   ├── src/
│   │   ├── main.tsx             # Entry: BrowserRouter + auth init + GLB preloading
│   │   ├── App.tsx              # Root — renders AppRoutes
│   │   ├── i18n.ts              # i18next config (HttpBackend + LanguageDetector)
│   │   ├── app/
│   │   │   ├── routes/
│   │   │   │   └── AppRoutes.tsx  # All route definitions (lazy-loaded pages)
│   │   │   └── store/
│   │   │       ├── useAuthStore.ts       # Auth state + all auth actions
│   │   │       ├── useCartStore.ts       # Cart state + CRUD actions
│   │   │       ├── useEngagementStore.ts # Like, bookmark, comment, share
│   │   │       ├── useToastStore.ts      # Global toast notifications
│   │   │       └── useViewerStore.ts     # (empty file — placeholder)
│   │   ├── features/
│   │   │   ├── account/         # Auth forms, profile, addresses, security pages
│   │   │   ├── avatar/          # Avatar Studio: AvatarViewer, AvatarModel, AvatarForm, store
│   │   │   ├── cart/            # Cart sidebar/drawer
│   │   │   ├── home/            # Landing page: Hero, HeroModel, collections, footer
│   │   │   ├── orders/          # Order history and detail pages
│   │   │   └── products/        # Product list, category, product detail pages
│   │   ├── shared/
│   │   │   ├── api/
│   │   │   │   └── apiClient.ts # Axios instance: base URL, JWT attach, refresh interceptor
│   │   │   └── components/
│   │   │       └── layout/      # Navbar, Footer, StoreNav, PageLayout
│   │   └── styles/
│   │       └── globals.css      # Tailwind base/components/utilities
│   ├── vite.config.ts           # Path aliases: @, @app, @features, @shared
│   └── tailwind.config.js
```

### 2.4 Environment Configuration

**Backend — `backend/.env` (never commit real values):**

| Variable | Purpose | Default in code |
|----------|---------|-----------------|
| `SECRET_KEY` | Django secret key | insecure default |
| `DEBUG` | Enable debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `["*"]` |
| `DB_NAME` | PostgreSQL database name | `tilet3d` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `postgres` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 client ID | empty |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret | empty |
| `CHAPA_SECRET_KEY` | Chapa payment API secret key | empty |
| `CHAPA_CALLBACK_URL` | Chapa webhook callback URL (server-to-server) | `http://localhost:8000/api/payments/webhook/` |
| `CHAPA_RETURN_URL` | Chapa redirect URL after user pays | `http://localhost:3000/checkout/success` |
| `EMAIL_BACKEND` | Django email backend class | SMTP |
| `EMAIL_HOST` | SMTP relay host | `smtp-relay.brevo.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USE_TLS` | Enable TLS | `True` |
| `EMAIL_HOST_USER` | SMTP username | empty |
| `EMAIL_HOST_PASSWORD` | SMTP password / API key | empty |
| `DEFAULT_FROM_EMAIL` | Sender address | `noreply@tilet3d.com` |
| `OTP_EXPIRY_MINUTES` | OTP validity window | `10` |
| `CELERY_BROKER_URL` | Redis broker URL | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND` | Redis result backend URL | `redis://localhost:6379/0` |

**Frontend — `frontend/.env`:**

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID (public — safe to expose) |

**Note:** The Axios `apiClient` base URL is **hardcoded** to `http://127.0.0.1:8000/api` in `src/shared/api/apiClient.ts` and also in `useEngagementStore.ts`. This must be changed for any non-localhost deployment. `[NEEDS CONFIRMATION FROM OWNER]` — should this be moved to `VITE_API_URL`?
---

## 3. Functional Requirements

### 3.1 Authentication & Accounts

**Status:** Complete

#### 3.1.1 Email/Password Registration

- **Flow:** User submits `{email, password, password2}` → backend creates `User` + `Profile` (via `post_save` signal) → OTP sent via email → JWT tokens returned immediately so user can navigate.
- **Components:** `RegisterView` → `RegisterSerializer` → `generate_otp()` + `send_otp_email()`
- **Rules:**
  - Passwords validated with Django's 4 built-in validators (similarity, min length 8, common, numeric).
  - Email must be unique (enforced at DB level via `unique=True`).
  - Tokens returned at registration so the user is "logged in" immediately even before email verification.
  - `is_verified` flag starts `False`; elevated to `True` only on OTP verification.

#### 3.1.2 Email Verification (OTP)

- **Flow:** User receives 6-digit code → submits `{email, code, purpose: "email_verify"}` → OTP validated → `user.is_verified = True` → **new JWT tokens returned** (this was a bug fix — previously no tokens were returned, causing every post-verification API call to 401).
- **OTP rules:**
  - 6-digit zero-padded random integer (`random.randint(0, 999999)`).
  - Expiry: `OTP_EXPIRY_MINUTES` (default 10) from creation time.
  - Previous unused OTPs for same user+purpose are invalidated on new OTP generation.
  - OTP is marked `is_used=True` after successful verification.

#### 3.1.3 Login

- **Flow:** `{email, password}` → custom `EmailBackend` authenticates → JWT tokens returned.
- **Rules:** Inactive accounts (`is_active=False`) are rejected. This includes soft-deleted accounts.

#### 3.1.4 Google OAuth Login

- **Flow:** Frontend obtains Google ID token via Google Identity → POSTs token to `/api/auth/google/` → backend verifies with `google.oauth2.id_token.verify_oauth2_token()` → user created or fetched by email → JWT tokens returned.
- **New user:** created with unusable password; `Profile` auto-created by signal.
- **Config:** Requires `GOOGLE_CLIENT_ID` in backend settings and `VITE_GOOGLE_CLIENT_ID` in frontend env.
- **Note:** Google OAuth login response returns `{access, refresh, email, created}` — note this is a **different shape** than the email/password login response (`{user: {...}, tokens: {...}}`). `[NEEDS CONFIRMATION FROM OWNER]` — this inconsistency is in the code; the frontend's `authService.googleLogin()` normalizes it, but it's a latent bug risk.

#### 3.1.5 Logout

- **Flow:** Client sends `{refresh}` token → backend blacklists it via `simplejwt.token_blacklist` → subsequent refresh attempts fail.

#### 3.1.6 Password Reset

- **Flow (3 steps):**
  1. `POST /api/auth/otp/request/` with `{email, purpose: "password_reset"}` → OTP emailed.
  2. `POST /api/auth/otp/verify/` with `{email, code, purpose: "password_reset"}` → returns success (no tokens).
  3. `POST /api/auth/password/reset/` with `{email, code, new_password}` → password updated, OTP marked used.

#### 3.1.7 Security Features

- **Change password:** `POST /api/auth/security/change-password/` — requires current password; logs `SecurityAuditLog` event.
- **Active sessions:** `GET /api/auth/security/sessions/` — lists non-blacklisted outstanding JWT tokens.
- **Revoke all sessions:** `DELETE /api/auth/security/sessions/` — blacklists all tokens for user.
- **Delete account:** `DELETE /api/auth/security/delete-account/` — soft deletes by setting `is_active=False`.
- **Audit log:** Last 10 security events shown via `GET /api/auth/security/logs/`.

#### 3.1.8 Profile Management

- **Endpoint:** `GET/PATCH /api/auth/profile/`
- **Fields editable:** `full_name`, `nickname`, `avatar_image`, `gender`, `body_type`, `skin_tone`
- **Note:** Profile `gender`/`body_type`/`skin_tone` choices differ from `AvatarProfile` choices (fewer options, different set). These are two separate models tracking overlapping but distinct data. `[NEEDS CONFIRMATION FROM OWNER]` — is `Profile.gender` intended to be synced with `AvatarProfile.gender`, or are they independent?

#### 3.1.9 Address Book

- `GET/POST /api/auth/addresses/` — list and create user addresses.
- `GET/PUT/PATCH/DELETE /api/auth/addresses/<uuid:pk>/`
- **Rules:** First address saved for a user is automatically set as default. Only one address can be default at a time (enforced in `Address.save()`).

---

### 3.2 Avatar Studio (3D Fitting Room)

**Status:** Complete — with significant architectural refinement history (see §8)

#### 3.2.1 Overview

The Avatar Studio at `/avatar` is a full-screen 3D canvas where users configure a digital mannequin representing their body. Measurements entered here are:
1. Displayed live on the 3D model (height/weight drive scale via Three.js lerp).
2. Persisted to `AvatarProfile` on the backend.
3. Frozen as a JSON snapshot into each `Order.avatar_snapshot` at checkout.

#### 3.2.2 User Flow

1. User navigates to `/avatar`.
2. `AvatarPage` mounts → `useAvatarStore.fetchAvatar()` called (guarded by `hasAttemptedFetch` to prevent double-fetch).
3. If authenticated + profile exists → avatar loaded with saved data, `isConfirmed = true`, HUDs appear.
4. If not authenticated or no profile → form shown with defaults.
5. User fills calibration form (`AvatarForm`) with: nickname, age, gender, body type, skin tone, height, weight, chest, waist, shoulder width, hips.
6. User clicks "Confirm Avatar" → `confirmAvatar()` action fires:
   - **Guest:** `isConfirmed = true` + "Please sign in" notification. No backend call. (Guided onboarding UX.)
   - **Authenticated:** `POST /api/avatars/me/` → saves profile → `isConfirmed = true` + success notification.
7. When confirmed: form hides, Left HUD (biometrics), Right HUD (measurements), and bottom controls appear.
8. Bottom controls: Idle / Walk animation toggle + Reset avatar.

#### 3.2.3 3D Rendering Architecture

- **Canvas:** Single `<Canvas id="avatar-canvas">` inside `AvatarViewer`. Camera at `[0, 3.5, 4.5]`, FOV 40°.
- **AvatarModel:** Renders **two** `SingleGenderAvatar` instances (male + female) simultaneously. The inactive gender is hidden by lerping its scale to 0. This avoids React re-suspending on gender change.
- **GLB Loading:** `useGLTF` with Draco decoder at `https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/`. Both GLBs are preloaded at app startup in `main.tsx` using the same Draco URL constant (same cache key = no double download).
- **Skeleton clone:** `SkeletonUtils.clone(scene)` is called per gender instance. Guard: only clones when `scene.children.length > 0` (real GLB resolved, not empty group) to prevent the flash-then-blank bug.
- **Scale:** Height drives Y-scale (clamped 0.5–2.0 based on 170 cm baseline). Weight drives XZ-scale (clamped 0.5–2.0 based on 120 kg formula).
- **Animations:** GLB animations searched by keyword (`idle`, `walk`). Transitions via `fadeOut(0.4) → fadeIn(0.4)`.
- **Skin tone:** 12 tones mapped to hex values. `applySkinTone()` traverses all meshes; uses **inverted approach** — identifies non-skin meshes (clothing, hair, eyes, accessories) by name patterns and skips them. Everything else is treated as skin.
- **Frustum culling:** Disabled on all avatar meshes (`child.frustumCulled = false`) to prevent invisible-avatar bug when camera or position shifts push the bounding box outside the frustum.

#### 3.2.4 Home Page Hero Model

- Separate `<Canvas id="hero-canvas">` on the landing page (`/`).
- Both GLBs loaded; inactive gender hidden by lerping scale to 0.
- `IdleRig` component drives ambient rotation (0.285 rad/s with ±15% sin modulation), vertical bob, and micro-breathing scale pulse.
- Paused via `IntersectionObserver` (threshold 0.05) when canvas scrolls out of viewport and via `visibilitychange` when tab is backgrounded.
- **Important:** Hero Canvas is unmounted when React Router navigates to `/avatar` — no concurrent WebGL renderers.

---

### 3.3 Product Catalogue

**Status:** Complete

#### 3.3.1 Product Browsing

- `GET /api/products/` — lists all active products with media, variants, like count, comment count, `is_liked` for the requesting user.
- **Filtering:** Optional `?categories=name1,name2` query param to filter by category names.
- **Ordering:** `display_order ASC, created_at DESC, id ASC`.
- Products page (`/products`) and category detail page (`/products/category/:categoryName`).

#### 3.3.2 Product Detail

- `GET /api/products/<uuid:id>/` — single product with full variant list, media, social data.
- Route: `/products/:id`

#### 3.3.3 Variants

Each `Product` has one or more `ProductVariant` records. A variant is the purchasable unit with: `sku`, `color`, `size`, `price`, and `measurements` (a JSON field for 3D garment dimension data — [NEEDS CONFIRMATION FROM OWNER] on how this is used in UI).

#### 3.3.4 Social Features (Likes, Comments, Shares)

- **Like toggle:** `POST /api/products/like/` `{product_id}` — creates or deletes `ProductLike`. Returns `{liked: bool}`. Frontend uses optimistic update.
- **Add comment:** `POST /api/products/comment/` `{product_id, text}`. No edit/delete endpoint exists.
- **List comments:** `GET /api/products/<uuid:id>/comments/`
- **Share tracking:** `POST /api/products/share/` `{product_id, platform}` — records analytics only.
- **User liked products:** `GET /api/products/liked/` — returns all products liked by the authenticated user.

---

### 3.4 Cart

**Status:** Complete

- **Get cart:** `GET /api/cart/` — returns cart with items, totals (note: shipping/tax/discount returned as 0 from cart serializer; real values computed only at checkout).
- **Add to cart:** `POST /api/cart/add/` `{variant_id, quantity}` — validates stock, creates/updates `CartItem`. Duplicate variant adds to existing quantity.
- **Update quantity:** `PATCH /api/cart/item/<uuid:item_id>/update/` `{quantity}` — quantity=0 removes the item.
- **Remove item:** `DELETE /api/cart/item/<uuid:item_id>/`
- **Rules:** Each user has one `Cart` (OneToOne). Cart items are unique per (cart, variant).

---

### 3.5 Checkout & Orders

**Status:** Complete

#### 3.5.1 Checkout Flow

1. `POST /api/orders/checkout/` with shipping address fields + optional `provider` (default `"chapa"`).
2. `CheckoutService.checkout()` (atomic transaction):
   a. Fetches cart with `select_for_update()`.
   b. Validates cart is not empty; validates all variants are active.
   c. Calls `InventoryService.reserve()` for each item (pessimistic locking).
   d. Calculates `subtotal`, `shipping_fee`, `tax` (15% of subtotal), `discount` (0.00), `total`.
   e. Captures `avatar_snapshot` (returns `None` if user has no `AvatarProfile` — checkout proceeds anyway).
   f. Creates `Order` + `OrderItem` records.
   g. Empties cart (`cart.items.all().delete()`).
   h. Creates `Payment` record via `PaymentService`.
   i. Calls `ChapaGateway.create_payment()` → gets `checkout_url`.
3. Returns `{message, order_id, payment_id, checkout_url}`.
4. Frontend redirects user to `checkout_url` (Chapa-hosted payment page).

#### 3.5.2 Shipping Fee Calculation

Hardcoded in `CheckoutService.calculate_shipping()`:

| Condition | Fee (ETB) |
|-----------|-----------|
| City is Addis Ababa / Finfinne / Sheger | 300.00 |
| City is Adama | 150.00 |
| Region is Oromia / Amhara / Sidama / Dire Dawa | 500.00 |
| All other | 700.00 |

`[NEEDS CONFIRMATION FROM OWNER]` — are these final shipping tiers?

#### 3.5.3 Payment Webhook

- `POST /api/payments/webhook/` — unauthenticated (Chapa server-to-server).
- Identifies payment by `tx_ref` (= `Payment.id` UUID).
- **Idempotent:** Already-processed payments return 200 immediately.
- **Verification:** Backend calls `ChapaGateway.verify_payment()` to confirm with Chapa's servers (does not trust webhook payload alone).
- On success: `PaymentService.mark_success()` → marks payment, transitions order `PENDING → CONFIRMED → PROCESSING`, confirms inventory.
- On failure: `PaymentService.mark_failed()` → marks payment, cancels order, releases reserved stock.
- Returns 503 on Chapa verification error so Chapa retries.

#### 3.5.4 Order Lifecycle State Machine

```
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
   ↓           ↓           ↓
CANCELLED   CANCELLED   CANCELLED
```

Enforced by `OrderLifecycle.ALLOWED_TRANSITIONS`. The `transition()` method is the **only** allowed way to change order status. Shipped and Delivered orders cannot be cancelled.

#### 3.5.5 Order History & Detail

- `GET /api/orders/` — authenticated user's orders, ordered by `-created_at`.
- `GET /api/orders/<uuid:pk>/` — order detail including items and `avatar_snapshot`.
- UI: `/orders` shows filterable list. `/orders/:id` shows full detail.

#### 3.5.6 Order Expiration (Celery Beat Task)

- Task `task_expire_orders` runs every 30 minutes.
- Finds `Order` records with `payment_status=pending` AND `created_at` older than 30 minutes.
- Releases reserved inventory → cancels order via lifecycle engine → sets `payment_status=failed`.

---

### 3.6 Account Page

**Status:** Complete

Route `/account`. Tabs:
1. **Overview** — name, email, verification status
2. **Personal Details** — edit `Profile` fields (full_name, nickname, gender, body_type, skin_tone, avatar_image)
3. **Shipping Addresses** — list, add, edit, delete, set-as-default
4. **Password & Security** — change password, view/revoke active sessions, view audit log, delete account
5. **Regional Preferences** — `[NEEDS CONFIRMATION FROM OWNER]` — this tab exists in i18n but its implementation in the account page components was not fully verified

---

### 3.7 i18n (Internationalization)

**Status:** Partial — infrastructure in place, coverage incomplete

- **Library:** i18next with `HttpBackend` (loads JSON from `/locales/{{lng}}/{{ns}}.json`) and `LanguageDetector` (browser locale auto-detection).
- **Supported locale files:** `en/`, `am/` (Amharic), `fr/` (French), `om/` (Oromo).
- **Fallback locale:** English (`en`).
- **Coverage:** The English `translation.json` covers: nav, footer, cart, account tabs, hero section. Large parts of the UI (avatar studio, products, orders, checkout) are **not yet wrapped in `t()` calls** — they use hardcoded English strings.
- **Extraction tooling:** `i18next-parser` is installed (`npm run extract-i18n`) but extraction has not been run systematically.
- `[NEEDS CONFIRMATION FROM OWNER]` — which languages need full support by launch?

---

### 3.8 Admin Panel

**Status:** Complete (Django built-in)

Available at `/admin/`. Registered models:
- `accounts`: User, Profile, OTPCode, Address, SecurityAuditLog
- `avatars`: AvatarProfile (with fieldsets for Identity, Visual Style, Detailed Measurements)
- `products`: Category, Product, ProductVariant, ProductMedia (with inline editing)
- `cart`: Cart, CartItem
- `orders`: Order, OrderItem
- `payments`: Payment

`[NEEDS CONFIRMATION FROM OWNER]` — a standalone custom admin panel was mentioned in past conversations as a planned feature. The current admin is Django's built-in.

---

## 4. Data Model

### 4.1 BaseModel (abstract — `common/models.py`)

All models inheriting `BaseModel` automatically get:

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUIDField (PK) | UUID v4, auto-generated, not editable |
| `created_at` | DateTimeField | Set on create |
| `updated_at` | DateTimeField | Updated on every save |

**Exception:** `AvatarProfile` does **not** inherit `BaseModel` — it uses Django's default auto-increment integer PK and defines its own `created_at`/`updated_at` fields with `auto_now_add`/`auto_now`.

### 4.2 User (`accounts.User`)

Extends `AbstractBaseUser + PermissionsMixin + BaseModel`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID PK | From BaseModel |
| `email` | EmailField | Unique, used as USERNAME_FIELD |
| `is_active` | BooleanField | Default True; set False on soft delete |
| `is_staff` | BooleanField | Django admin access |
| `is_verified` | BooleanField | Email OTP verified flag |
| `created_at` | DateTimeField | From BaseModel |
| `updated_at` | DateTimeField | From BaseModel |

**Note:** There is a commented-out `id = models.UUIDField(...)` line in the model — this is dead code since BaseModel already provides it. Safe to remove.

### 4.3 Profile (`accounts.Profile`)

One-to-one with User. Auto-created by `post_save` signal on User creation.

| Field | Type | Choices / Notes |
|-------|------|-----------------|
| `id` | UUID PK | |
| `user` | OneToOneField → User | related_name=`profile` |
| `full_name` | CharField(255) | nullable |
| `nickname` | CharField(100) | nullable |
| `avatar_image` | ImageField | uploads to `avatars/` |
| `gender` | CharField | `male`, `female`, `other`, `prefer_not_to_say` |
| `body_type` | CharField | `slim`, `athletic`, `average`, `curvy`, `plus_size` |
| `skin_tone` | CharField | `fair`, `light`, `medium`, `tan`, `deep` |

### 4.4 AvatarProfile (`avatars.AvatarProfile`)

Full biometric profile for 3D avatar rendering. One-to-one with User. **Not** auto-created — user must explicitly create it via the Avatar Studio.

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | AutoField (int PK) | Not UUID — differs from all other models |
| `user` | OneToOneField → User | |
| `nickname` | CharField(50) | blank=True |
| `age` | PositiveIntegerField | 1–120, default 25 |
| `gender` | CharField | `male`, `female` |
| `body_type` | CharField | `slim`, `athletic`, `average`, `plus`, `inverted_triangle`, `pear`, `rectangle` |
| `skin_tone` | CharField | 12 options: `ivory`→`ebony` |
| `height` | FloatField | 50–250 cm, default 170 |
| `weight` | FloatField | 20–300 kg, default 70 |
| `chest` | FloatField | cm, default 90 |
| `waist` | FloatField | cm, default 80 |
| `shoulder_width` | FloatField | cm, default 45 |
| `hips` | FloatField | cm, default 95 |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |

`as_measurement_snapshot()` returns a plain dict of all biometric fields — called by `CheckoutService` to freeze measurements into `Order.avatar_snapshot`.

### 4.5 OTPCode (`accounts.OTPCode`)

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | on_delete=CASCADE |
| `code` | CharField(6) | 6-digit zero-padded integer |
| `purpose` | CharField | `email_verify` or `password_reset` |
| `is_used` | BooleanField | |
| `expires_at` | DateTimeField | |

`is_valid()` returns `not is_used and now < expires_at`.

### 4.6 SecurityAuditLog (`accounts.SecurityAuditLog`)

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | |
| `event` | CharField(255) | Free-text description |
| `ip_address` | GenericIPAddressField | X-Forwarded-For aware |
| `user_agent` | TextField | |
| `created_at` | DateTimeField | auto_now_add |

**Note:** Does **not** inherit BaseModel.

### 4.7 Address (`accounts.Address`)

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | related_name=`addresses` |
| `label` | CharField(50) | Default "Home" |
| `full_name` | CharField(200) | |
| `phone_number` | CharField(30) | |
| `region` | CharField(100) | Default "Addis Ababa" |
| `city` | CharField(100) | |
| `sub_city` | CharField(100) | blank |
| `woreda` | CharField(100) | blank |
| `house_no` | CharField(100) | blank |
| `is_default` | BooleanField | |

`save()` clears `is_default` on all other user addresses if this one is set default.

### 4.8 Category (`products.Category`)

| Field | Type | Notes |
|-------|------|-------|
| `name` | CharField(100) | unique |
| `slug` | SlugField(120) | unique, auto-generated |
| `description` | TextField | |
| `image` | ImageField | uploads to `categories/images/` |
| `banner` | ImageField | uploads to `categories/banners/` |
| `parent` | FK → self | nullable, supports nesting |
| `is_active` | BooleanField | |
| `display_order` | PositiveIntegerField | |

### 4.9 Product (`products.Product`)

| Field | Type | Notes |
|-------|------|-------|
| `category` | FK → Category | on_delete=PROTECT |
| `name` | CharField(150) | |
| `slug` | SlugField(180) | unique, auto-generated |
| `description` | TextField | |
| `brand` | CharField(120) | |
| `is_active` | BooleanField | |
| `is_featured` | BooleanField | |
| `display_order` | PositiveIntegerField | |

### 4.10 ProductVariant (`products.ProductVariant`)

| Field | Type | Notes |
|-------|------|-------|
| `product` | FK → Product | on_delete=CASCADE |
| `name` | CharField(150) | |
| `sku` | CharField(100) | unique |
| `color` | CharField(50) | |
| `size` | CharField(30) | |
| `price` | DecimalField(10,2) | |
| `stock` | PositiveIntegerField | total physical inventory |
| `reserved_stock` | PositiveIntegerField | locked during checkout |
| `is_active` | BooleanField | |
| `measurements` | JSONField | 3D garment measurements dict |

`available_stock` property: `max(stock - reserved_stock, 0)`.

### 4.11 ProductMedia (`products.ProductMedia`)

| Field | Type | Notes |
|-------|------|-------|
| `product` | FK → Product | |
| `media_type` | CharField | `image` or `video` |
| `file` | FileField | uploads to `products/media/` |
| `alt_text` | CharField(255) | |
| `is_primary` | BooleanField | |
| `display_order` | PositiveIntegerField | |

### 4.12 ProductLike / ProductComment / ProductShare

All follow the same pattern: FK to `User` + FK to `Product`.

- `ProductLike`: `unique_together = (user, product)`
- `ProductComment`: adds `text` TextField
- `ProductShare`: adds `platform` CharField(50)

### 4.13 Cart / CartItem (`cart`)

- `Cart`: OneToOne with User. `is_active` BooleanField (currently not used for anything — always True).
- `CartItem`: FK → Cart + FK → ProductVariant. `unique_together = (cart, variant)`.

### 4.14 Order (`orders.Order`)

| Field | Type | Notes |
|-------|------|-------|
| `user` | FK → User | on_delete=PROTECT |
| `order_number` | CharField(20) | unique; format `TLT-YYYYMMDD-NNNNNN` |
| `status` | CharField | `pending/confirmed/processing/shipped/delivered/cancelled` |
| `payment_status` | CharField | `pending/paid/failed/refunded` |
| `subtotal` | DecimalField(12,2) | |
| `shipping_fee` | DecimalField(12,2) | |
| `tax` | DecimalField(12,2) | 15% of subtotal |
| `discount` | DecimalField(12,2) | always 0.00 currently |
| `total` | DecimalField(12,2) | subtotal + shipping + tax - discount |
| `full_name` | CharField(200) | shipping address |
| `phone` | CharField(30) | |
| `region` | CharField(100) | |
| `city` | CharField(100) | |
| `sub_city` | CharField(100) | |
| `woreda` | CharField(100) | |
| `house_no` | CharField(100) | |
| `postal_code` | CharField(30) | |
| `note` | TextField | |
| `avatar_snapshot` | JSONField | nullable; frozen measurements at checkout time |

### 4.15 OrderItem (`orders.OrderItem`)

| Field | Type | Notes |
|-------|------|-------|
| `order` | FK → Order | |
| `product` | FK → Product | on_delete=PROTECT |
| `variant` | FK → ProductVariant | on_delete=PROTECT |
| `product_name` | CharField(200) | snapshot of name at time of order |
| `variant_name` | CharField(200) | snapshot |
| `sku` | CharField(100) | snapshot |
| `color` | CharField(50) | snapshot |
| `size` | CharField(30) | snapshot |
| `price` | DecimalField(12,2) | snapshot |
| `quantity` | PositiveIntegerField | |
| `subtotal` | DecimalField(12,2) | price × quantity |

### 4.16 Payment (`payments.Payment`)

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUIDField (PK) | Used as Chapa `tx_ref` |
| `user` | FK → User | |
| `order` | OneToOneField → Order | related_name=`payment` |
| `amount` | DecimalField(10,2) | |
| `currency` | CharField(10) | `ETB` |
| `status` | CharField | `pending/initiated/success/failed/cancelled/refunded` |
| `provider` | CharField | `chapa` (only option) |
| `transaction_id` | CharField(255) | nullable; from Chapa response |
| `checkout_url` | URLField | nullable; Chapa hosted payment page |
| `webhook_received` | BooleanField | |
| `webhook_payload` | JSONField | raw Chapa webhook body for debugging |

### 4.17 Entity Relationship Summary

```
User ──1:1── Profile
User ──1:1── AvatarProfile
User ──1:1── Cart ──1:N── CartItem ──N:1── ProductVariant
User ──1:N── Address
User ──1:N── OTPCode
User ──1:N── SecurityAuditLog
User ──1:N── Order ──1:N── OrderItem ──N:1── Product
                  └──1:1── Payment
Product ──N:1── Category
Product ──1:N── ProductVariant
Product ──1:N── ProductMedia
Product ──1:N── ProductLike (N:1── User)
Product ──1:N── ProductComment (N:1── User)
Product ──1:N── ProductShare (N:1── User)
Category ──self── Category (parent/children for nesting)
```
---

## 5. API Specification

Base URL (dev): `http://127.0.0.1:8000/api`  
Auth: `Authorization: Bearer <access_token>` on all protected endpoints.  
Content-Type: `application/json`  
Auto-generated schema: `GET /api/schema/` (OpenAPI), UI at `/api/docs/` (Swagger) and `/api/redoc/`.

### 5.1 Auth Endpoints (`/api/auth/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register/` | None | Register new user. Returns `{user, tokens}`. OTP sent automatically. |
| POST | `/api/auth/login/` | None | Login. Returns `{user, tokens}`. |
| POST | `/api/auth/logout/` | Required | Blacklists refresh token. Body: `{refresh}`. |
| POST | `/api/auth/google/` | None | Google OAuth. Body: `{token}`. Returns `{access, refresh, email, created}`. |
| POST | `/api/auth/otp/request/` | None | Send OTP. Body: `{email, purpose}`. Purpose: `email_verify` or `password_reset`. |
| POST | `/api/auth/otp/verify/` | None | Verify OTP. Body: `{email, code, purpose}`. Returns tokens if `email_verify`. |
| POST | `/api/auth/password/reset/` | None | Reset password. Body: `{email, code, new_password}`. |
| GET | `/api/auth/profile/` | Required | Get current user profile. |
| PATCH | `/api/auth/profile/` | Required | Update profile fields. |
| GET | `/api/auth/addresses/` | Required | List user addresses. |
| POST | `/api/auth/addresses/` | Required | Create address. |
| GET | `/api/auth/addresses/<uuid:pk>/` | Required | Get single address. |
| PUT | `/api/auth/addresses/<uuid:pk>/` | Required | Full update address. |
| PATCH | `/api/auth/addresses/<uuid:pk>/` | Required | Partial update address. |
| DELETE | `/api/auth/addresses/<uuid:pk>/` | Required | Delete address. |
| GET | `/api/auth/security/logs/` | Required | Last 10 security events. |
| POST | `/api/auth/security/change-password/` | Required | Body: `{current_password, new_password}`. |
| GET | `/api/auth/security/sessions/` | Required | List active sessions. |
| DELETE | `/api/auth/security/sessions/` | Required | Revoke all other sessions. |
| DELETE | `/api/auth/security/delete-account/` | Required | Soft-delete account. |

**JWT Refresh** (built-in simplejwt — not explicitly listed in custom urls but available):  
`POST /api/auth/token/refresh/` — Body: `{refresh}`. Returns `{access}`.  
`[NEEDS CONFIRMATION FROM OWNER]` — this endpoint is called by the Axios interceptor but is not declared in `accounts/api/urls.py`. It must be wired up via simplejwt's built-in views somewhere, or the refresh interceptor silently fails. Verify this is mounted.

---

**Register response shape:**
```json
{
  "user": { "id": "uuid", "email": "x@x.com", "is_verified": false },
  "tokens": { "refresh": "...", "access": "..." }
}
```

**Login response shape:**
```json
{
  "user": { "id": "uuid", "email": "x@x.com" },
  "tokens": { "refresh": "...", "access": "..." }
}
```

**Google login response shape** (different — inconsistency noted):
```json
{ "access": "...", "refresh": "...", "email": "x@x.com", "created": true }
```

**OTP Verify response (email_verify purpose):**
```json
{
  "message": "Email verified successfully.",
  "user": { "id": "uuid", "email": "x@x.com", "is_verified": true },
  "tokens": { "access": "...", "refresh": "..." }
}
```

---

### 5.2 Avatar Endpoints (`/api/avatars/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/avatars/me/` | None (AllowAny) | Get current user's avatar profile. 404 if none. Guests get 404, not 401. |
| POST | `/api/avatars/me/` | Required | Create or fully replace avatar profile (upsert). Returns 201 on create, 200 on replace. |
| PATCH | `/api/avatars/me/` | Required | Partial update avatar profile. 404 if doesn't exist. |
| DELETE | `/api/avatars/me/` | Required | Delete avatar profile. |

**Request/Response body (all methods):**
```json
{
  "nickname": "string",
  "age": 25,
  "gender": "male|female",
  "body_type": "slim|athletic|average|plus|inverted_triangle|pear|rectangle",
  "skin_tone": "ivory|fair|light|honey|medium|caramel|tan|chestnut|rich|espresso|deep|ebony",
  "height": 170.0,
  "weight": 70.0,
  "chest": 90.0,
  "waist": 80.0,
  "shoulder_width": 45.0,
  "hips": 95.0
}
```

Response adds `id`, `created_at`, `updated_at` (read-only).

---

### 5.3 Product Endpoints (`/api/products/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products/` | None | List active products. Optional `?categories=name1,name2`. |
| GET | `/api/products/<uuid:id>/` | None | Product detail. |
| GET | `/api/products/liked/` | Required | Products liked by current user. |
| POST | `/api/products/like/` | Required | Toggle like. Body: `{product_id}`. Returns `{liked: bool}`. |
| POST | `/api/products/comment/` | Required | Add comment. Body: `{product_id, text}`. |
| GET | `/api/products/<uuid:id>/comments/` | None | List comments for product. |
| POST | `/api/products/share/` | Required | Record share. Body: `{product_id, platform}`. |

**Product serializer response shape:**
```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string",
  "description": "string",
  "brand": "string",
  "is_featured": false,
  "category_name": "string",
  "media": [
    { "id": "uuid", "media_type": "image|video", "file": "/media/...", "is_primary": true, "display_order": 0 }
  ],
  "variants": [
    { "id": "uuid", "name": "string", "sku": "string", "color": "string", "size": "string", "price": "999.00", "available_stock": 5, "measurements": {} }
  ],
  "like_count": 42,
  "comment_count": 7,
  "is_liked": false
}
```

---

### 5.4 Cart Endpoints (`/api/cart/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/cart/` | Required | Get cart with items and totals. |
| POST | `/api/cart/add/` | Required | Add item. Body: `{variant_id, quantity}`. |
| PATCH | `/api/cart/item/<uuid:item_id>/update/` | Required | Update quantity. Body: `{quantity}`. quantity=0 removes. |
| DELETE | `/api/cart/item/<uuid:item_id>/` | Required | Remove item. |

**Cart response shape:**
```json
{
  "id": "uuid",
  "total_items": 3,
  "unique_items": 2,
  "subtotal": "1500.00",
  "shipping": 0,
  "tax": 0,
  "discount": 0,
  "grand_total": "1500.00",
  "items": [
    {
      "id": "uuid",
      "quantity": 2,
      "subtotal": "1000.00",
      "product": { "id": "uuid", "name": "string", "slug": "string" },
      "variant": { "id": "uuid", "name": "string", "sku": "string", "color": "string", "size": "string", "price": "500.00", "stock": 10 },
      "image": "http://localhost:8000/media/products/media/img.jpg"
    }
  ]
}
```

Note: Cart serializer returns `shipping`, `tax`, `discount` as `0`. Real values are computed only at checkout.

---

### 5.5 Order Endpoints (`/api/orders/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/orders/checkout/` | Required | Create order + initiate payment. See §3.5.1. |
| GET | `/api/orders/` | Required | List user orders. |
| GET | `/api/orders/<uuid:pk>/` | Required | Order detail. |

**Checkout request body:**
```json
{
  "full_name": "Almaz Tadesse",
  "phone": "+251911234567",
  "region": "Addis Ababa",
  "city": "Addis Ababa",
  "sub_city": "Bole",
  "woreda": "03",
  "house_no": "Block 5",
  "postal_code": "",
  "note": "",
  "provider": "chapa"
}
```

**Checkout response:**
```json
{
  "message": "Checkout initialized successfully.",
  "order_id": "uuid",
  "payment_id": "uuid",
  "checkout_url": "https://checkout.chapa.co/..."
}
```

**Order list item shape:**
```json
{
  "id": "uuid",
  "order_number": "TLT-20260706-000001",
  "status": "pending",
  "payment_status": "pending",
  "total": "2150.00",
  "item_count": 2,
  "created_at": "2026-07-06T10:00:00Z"
}
```

**Order detail** includes all of the above plus: `subtotal`, `shipping_fee`, `tax`, `discount`, `full_name`, `phone`, `region`, `city`, `sub_city`, `woreda`, `house_no`, `postal_code`, `note`, `avatar_snapshot`, and `items[]`.

---

### 5.6 Payment Endpoints (`/api/payments/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/payments/create/` | Required | Standalone payment creation for an existing order. Body: `{order_id, provider}`. |
| POST | `/api/payments/webhook/` | None | Chapa server-to-server webhook. |

Note: In practice the checkout endpoint (`/api/orders/checkout/`) handles payment creation inline. The standalone `/api/payments/create/` is available for creating a new payment attempt on an existing order (e.g. retry after failure).

**Webhook body (from Chapa):**
```json
{ "tx_ref": "payment-uuid", "status": "success", ... }
```

The backend ignores `payload.status` and independently verifies with Chapa's verify API.

---

### 5.7 JWT Token Refresh

`POST /api/auth/token/refresh/` — `{refresh}` → `{access}`.

This is called automatically by the Axios response interceptor in `apiClient.ts` on any 401 response. If refresh also fails, all stored tokens and user data are cleared from localStorage.

**JWT lifetimes (from settings):**
- Access token: **60 minutes**
- Refresh token: **30 days**
- `ROTATE_REFRESH_TOKENS = True` — new refresh token issued on each use
- `BLACKLIST_AFTER_ROTATION = True` — old refresh token blacklisted
---

## 6. Non-Functional Requirements

### 6.1 Performance

- **3D asset loading:** GLBs are preloaded at app startup (`useGLTF.preload()` in `main.tsx`) using the same Draco URL constant as all in-scene uses — guaranteeing a single cache key and one network fetch per model. Female avatar GLB is ~10 MB; male is ~3.5 MB. Load time is network-dependent.
- **Canvas rendering:** DPR capped at 1.5 in Avatar Studio and `min(devicePixelRatio, 2)` on home hero. `powerPreference: 'high-performance'` requested from WebGL context. Frame loop paused (IdleRig) via IntersectionObserver and visibilitychange on home hero.
- **API timeouts:** Axios `apiClient` has a 10-second timeout. Chapa gateway sets a 15-second timeout on payment initialization and 10 seconds on verification.
- **DB queries:** Cart and product list views use `select_related` and `prefetch_related` to avoid N+1 queries. Inventory updates use `select_for_update()` for row-level locking.
- **No caching layer** is implemented (no Redis query cache, no CDN). `[NEEDS CONFIRMATION FROM OWNER]`

### 6.2 Security

| Mechanism | Implementation |
|-----------|---------------|
| JWT auth | simplejwt; Bearer token in Authorization header |
| Token rotation | Refresh tokens rotated and blacklisted on each use |
| Token blacklisting | `rest_framework_simplejwt.token_blacklist` app; DB-backed |
| Access token lifetime | 60 minutes |
| Refresh token lifetime | 30 days |
| Password hashing | Django's default PBKDF2 + SHA256 |
| Password validation | 4 Django validators (similarity, min length 8, common words, numeric-only) |
| CORS | `django-cors-headers`; dev: only `localhost:5173` allowed |
| CSRF | Django CsrfViewMiddleware active; CSRF_TRUSTED_ORIGINS set in dev |
| OTP security | Previous unused OTPs invalidated on new request; 10-min expiry |
| Google token verification | `google.oauth2.id_token.verify_oauth2_token()` — server-side verification |
| Payment verification | Backend calls Chapa verify API independently — webhook payload `status` field is NOT trusted |
| Soft delete | Accounts deactivated (not deleted) to preserve order history |
| Account ownership | All queryset filters scope to `request.user` (e.g. addresses, cart, orders) |
| Admin access | Standard Django admin at `/admin/`; requires `is_staff=True` |
| Secret management | Secrets loaded from `.env` via `django-environ`; never committed |

**Not implemented / gaps:**
- No rate limiting on auth endpoints (OTP request, login)
- No HTTPS enforcement in production settings (production.py is empty)
- No Content Security Policy headers
- `[NEEDS CONFIRMATION FROM OWNER]` on all of the above

### 6.3 Responsiveness & Browser Support

- Styled with Tailwind CSS. Layout is responsive with mobile breakpoints visible in component code (e.g. `hidden md:block` for HUDs in Avatar Studio).
- No explicit browser support matrix defined in code. `[NEEDS CONFIRMATION FROM OWNER]`
- WebGL (Three.js) requires a GPU-capable browser. The 3D canvas degrades gracefully (Suspense fallback `null` on home hero; spinning torus on Avatar Studio).

### 6.4 Localization Status

| Locale | Code | File exists | UI coverage |
|--------|------|-------------|-------------|
| English | `en` | ✅ | ~30% (nav, footer, cart, account tabs, hero) |
| Amharic | `am` | ✅ (directory exists) | Unknown — not verified |
| French | `fr` | ✅ (directory exists) | Unknown |
| Oromo | `om` | ✅ (directory exists) | Unknown |

Large portions of the UI (Avatar Studio, products, orders, checkout) use hardcoded English strings with no `t()` calls. The i18n infrastructure is in place but extraction has not been run systematically.

---

## 7. Third-Party Integrations

### 7.1 Google OAuth 2.0

- **Purpose:** Social login — allows users to sign up/in with a Google account without setting a password.
- **Integration point:** `backend/apps/accounts/api/google.py` — `GoogleLoginView`.
- **Flow:** Frontend uses Google Identity Services JS library to obtain an `id_token`. It POSTs the token to the backend, which verifies it server-side using `google-auth` library.
- **Config required:**
  - Backend: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in `.env`
  - Frontend: `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`

### 7.2 Chapa Payment Gateway

- **Purpose:** Ethiopian payment processing (mobile money, bank transfer, card).
- **Integration point:** `backend/apps/payments/gateways/chapa.py` — `ChapaGateway`.
- **API version:** v1 (`https://api.chapa.co/v1/`)
- **Flow:**
  1. Backend POSTs to `https://api.chapa.co/v1/transaction/initialize` with amount, currency (ETB), email, `tx_ref` (= `payment.id`), `callback_url`, `return_url`.
  2. Chapa returns a `checkout_url` — frontend redirects user there.
  3. After payment, Chapa POSTs to `callback_url` (the webhook endpoint).
  4. Backend calls `https://api.chapa.co/v1/transaction/verify/{tx_ref}` to verify.
- **Config required:** `CHAPA_SECRET_KEY`, `CHAPA_CALLBACK_URL`, `CHAPA_RETURN_URL`
- **`tx_ref`:** Set to the `Payment.id` UUID. This is the linking key between Chapa and the local DB.
- **Currency:** All amounts in ETB.

### 7.3 Brevo (SMTP Email)

- **Purpose:** Transactional emails for OTP delivery (email verification and password reset).
- **Integration point:** Django's email framework (`django.core.mail.send_mail`), called from `backend/apps/accounts/utils.py`.
- **SMTP relay:** `smtp-relay.brevo.com:587` with TLS.
- **Config required:** `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`
- **Email content:** Plain text only. No HTML templates. Content: `"Your code is {code}. It expires in {N} minutes."`

### 7.4 Google Draco (3D Compression)

- **Purpose:** Decodes Draco-compressed geometry in the avatar GLB files.
- **Integration:** CDN-hosted decoder at `https://www.gstatic.com/draco/versioned/decoders/1.5.5/gltf/` — passed to `useGLTF()` and `useGLTF.preload()`.
- **No config required** — URL is hardcoded in `AvatarModel.tsx` as the exported constant `DRACO_URL`, which is imported by `main.tsx` for consistency.

### 7.5 Redis (Celery Broker & Result Backend)

- **Purpose:** Message queue for Celery async tasks (currently only the order expiration task) and result storage.
- **Config required:** `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` (default: `redis://localhost:6379/0`)
- **Periodic task:** `task_expire_orders` runs every 30 minutes via Celery Beat.

---

## 8. Known Issues, Tech Debt & Open Risks

### 8.1 Fixed Issues (recently resolved — still worth knowing)

| Issue | Status | Notes |
|-------|--------|-------|
| Avatar double-load / flash-then-blank | **Fixed** | Was caused by `useGLTF` path changing on gender switch, forcing React to unmount and re-suspend. Now fixed by rendering both genders always and toggling scale. Also fixed empty-group → real-group swap by guarding `useMemo` on `scene.children.length > 0`. |
| Avatar disappeared / culled by frustum | **Fixed** | Moving the scene group to `x=-1.2` pushed bounding box outside the narrow 32° FOV frustum. Fixed by centering at `x=0` and setting `frustumCulled = false` on all meshes. |
| Skin tone tinted clothing | **Fixed** | Old approach tried to positively identify skin meshes; new inverted approach identifies non-skin meshes (clothing, hair, eyes) and skips those. Everything else is skin. |
| OTP verify returned no tokens | **Fixed** | `VerifyOTPView` for `email_verify` purpose now returns fresh JWT tokens, so the user stays authenticated post-verification. |
| Avatar GET returned 401 for guests | **Fixed** | `AvatarProfileDetailView` now uses `AllowAny` for GET only; returns 404 for no-profile rather than 401. |
| GLB double-downloaded on avatar route | **Fixed** | `main.tsx` now imports `DRACO_URL` from `AvatarModel.tsx` and uses the same constant for preload calls, ensuring one shared cache key. |

### 8.2 Active Tech Debt & Risks

#### 8.2.1 Production Settings Empty
`config/settings/production.py` contains only `from .base import *`. There is no HTTPS enforcement, no production CORS config, no `ALLOWED_HOSTS` restriction, no `STATIC_ROOT` serving config, no `SECURE_*` settings. **This system cannot be safely deployed as-is.**

#### 8.2.2 Hardcoded API Base URL
`apiClient.ts` and `useEngagementStore.ts` both hardcode `http://127.0.0.1:8000/api`. Deployment to any environment requires manual code changes. Should be moved to `import.meta.env.VITE_API_URL`.

#### 8.2.3 Bookmark Endpoint Does Not Exist
`useEngagementStore.toggleBookmark()` calls `POST /api/products/bookmark/` but this endpoint is not wired in `products/api/urls.py`. Any bookmark action will silently fail (the optimistic update makes the UI appear to work, but no data is persisted). The `savedIdsList` state is also lost on page refresh — it is not fetched from the backend on load.

#### 8.2.4 Order Number Race Condition
`OrderNumberService.generate()` counts today's orders and adds 1. Under concurrent checkout requests, two orders placed simultaneously could receive the same sequence number (both read the same count before either saves). The `order_number` field has `unique=True` which will cause one request to fail with an IntegrityError, but this will surface as an unhandled 500. Should use `select_for_update()` or a DB sequence.

#### 8.2.5 Data Model Divergence: Profile vs AvatarProfile
Two separate models store overlapping user attribute data:
- `accounts.Profile`: `gender` (4 choices), `body_type` (5 choices), `skin_tone` (5 choices)
- `avatars.AvatarProfile`: `gender` (2 choices), `body_type` (7 choices), `skin_tone` (12 choices)

The avatar profile has richer choices. The account profile's fields appear to be unused by any active feature. `[NEEDS CONFIRMATION FROM OWNER]` — should `accounts.Profile.gender/body_type/skin_tone` be deprecated and removed?

#### 8.2.6 Token Refresh Endpoint May Not Be Mounted
The Axios interceptor calls `POST /api/auth/token/refresh/` but this path is not declared in `accounts/api/urls.py`. SimpleJWT provides this view out of the box but it must be explicitly included in `config/urls.py`. Verify it is mounted, or the auto-refresh mechanism silently fails.

#### 8.2.7 Cart Serializer Shipping/Tax Returns Zero
`CartSerializer.get_shipping()` and `get_tax()` always return `0`. The real shipping fee (ETB 150–700) and 15% tax are only computed in `CheckoutService`. The cart preview UI therefore shows an incorrect total before checkout. `[NEEDS CONFIRMATION FROM OWNER]` — is showing "Calculated at checkout" in the cart intentional?

#### 8.2.8 No Tests Written
`tests.py` in every app contains only `from django.test import TestCase`. No test suite exists. There are `pytest` and `pytest-django` in requirements but no test files.

#### 8.2.9 useViewerStore is Empty
`src/app/store/useViewerStore.ts` is an empty file (0 bytes). Placeholder for a feature not yet implemented.

#### 8.2.10 i18n Coverage Incomplete
The i18n infrastructure is deployed but ~70% of the UI strings are not wrapped in `t()` calls. The app effectively renders in English only for all routes except those sections explicitly translated.

#### 8.2.11 AvatarProfile Uses Integer PK
All other models use UUID PKs via BaseModel. `AvatarProfile` uses Django's default `AutoField` (integer). This is an inconsistency that could matter if IDs are ever exposed in URLs or external systems.

#### 8.2.12 Comment Delete/Edit Not Implemented
`ProductComment` records can only be created (`POST /api/products/comment/`). There is no edit or delete endpoint. Users cannot remove their own comments.

#### 8.2.13 `Cart.is_active` Flag Is Unused
The `Cart` model has an `is_active` BooleanField described as "Inactive after checkout" but `CheckoutService` deletes the cart items and keeps the Cart object; `is_active` is never set to False anywhere in the code.

#### 8.2.14 Django's `boto3` / `django-storages` Installed But Not Configured
Both `boto3` and `django-storages` appear in `requirements/base.txt`. No S3 or cloud storage configuration exists in any settings file. Media files are served locally in development. Production media storage strategy is undefined.

---

## 9. Setup & Local Development Guide

### 9.1 Prerequisites

- Python 3.12+ (versions present in venv)
- Node.js 20+ with npm
- PostgreSQL (any recent version)
- Redis (for Celery)

### 9.2 Backend Setup

```bash
# 1. Navigate to backend directory
cd backend/

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements/development.txt

# 4. Copy and configure environment
cp .env.example .env
# Edit .env: fill in DB_*, GOOGLE_CLIENT_ID, CHAPA_SECRET_KEY, EMAIL_* values

# 5. Run database migrations
python manage.py migrate --settings=config.settings.development

# 6. Create a superuser for admin access
python manage.py createsuperuser --settings=config.settings.development

# 7. Start the development server
python manage.py runserver --settings=config.settings.development
# API available at http://127.0.0.1:8000
# Admin at http://127.0.0.1:8000/admin/
# Swagger UI at http://127.0.0.1:8000/api/docs/
```

### 9.3 Celery (Background Tasks)

Celery is required for order expiration. Run in separate terminals:

```bash
# Worker
celery -A config worker --loglevel=info

# Beat scheduler (periodic tasks)
celery -A config beat --loglevel=info
```

If Redis is not running, the server still starts but checkout tasks will fail silently on expiration.

### 9.4 Frontend Setup

```bash
# 1. Navigate to frontend directory
cd frontend/

# 2. Install dependencies
npm install

# 3. Configure environment (Google OAuth client ID)
# frontend/.env is already present with VITE_GOOGLE_CLIENT_ID

# 4. Start dev server
npm run dev
# App available at http://localhost:5173
```

### 9.5 3D Models

The GLB files (`public/models/maleAvatar.glb` and `femaleAvatar.glb`) must be present. They are tracked in the repository (not in `.gitignore`). If missing, the Avatar Studio will show a spinning loader indefinitely.

### 9.6 Seed Data

No seed management command or fixtures exist. Products and categories must be created manually via the Django admin at `/admin/`. `[NEEDS CONFIRMATION FROM OWNER]` — are there seed fixtures planned?

### 9.7 Running Tests

No tests exist. If you add tests:

```bash
# Backend
pytest --ds=config.settings.development

# Frontend (no test framework configured)
```

### 9.8 i18n Extraction

To extract new translation keys from the frontend source:

```bash
cd frontend/
npm run extract-i18n
```

This runs `i18next-parser` as configured in `i18next-parser.config.js`.

---

## 10. Glossary / Codebase Conventions

### 10.1 Naming Conventions

| Scope | Convention | Example |
|-------|-----------|---------|
| Python files | snake_case | `checkout_service.py` |
| Python classes | PascalCase | `CheckoutService`, `OrderLifecycle` |
| Django models | PascalCase singular | `ProductVariant` |
| Django apps | snake_case | `apps.accounts` |
| React components | PascalCase | `AvatarViewer`, `HeroModel` |
| React hooks | camelCase with `use` prefix | `useAvatarStore`, `useAuthStore` |
| TypeScript types/interfaces | PascalCase | `AvatarData`, `AuthUser` |
| Zustand store files | `use<Name>Store.ts` | `useCartStore.ts` |
| Frontend feature dirs | lowercase singular | `avatar/`, `account/`, `cart/` |
| CSS classes | Tailwind utilities only | no custom class names |
| API URL paths | lowercase with hyphens | `/api/auth/change-password/` |
| Order numbers | `TLT-YYYYMMDD-NNNNNN` | `TLT-20260706-000001` |
| localStorage keys | `tilet3d_<name>` | `tilet3d_access_token`, `tilet3d_refresh_token`, `tilet3d_user` |

### 10.2 Architectural Patterns

**Backend:**

- **Service Layer:** Business logic lives in `services/` subdirectories (e.g. `orders/services/checkout.py`, `products/services/inventory.py`), not in views. Views are thin — they validate input via serializers and call services.
- **Gateway Pattern:** Payment providers are abstracted behind `BaseGateway`. `GatewayFactory.get_gateway(provider)` returns the correct implementation. Add new gateways by subclassing `BaseGateway` and registering in `_gateways` dict.
- **State Machine:** Order status transitions are enforced by `OrderLifecycle.transition()`. Never update `order.status` directly — always go through the lifecycle engine.
- **Measurement Snapshot:** `AvatarProfile.as_measurement_snapshot()` produces the frozen dict that goes into `Order.avatar_snapshot`. Do not change its shape without migrating existing order records.
- **BaseModel:** Extend `common.models.BaseModel` for all new models to get UUID PK + timestamps automatically. Exception: `AvatarProfile` does not follow this — do not replicate that pattern.

**Frontend:**

- **Feature Slices:** Code is organized by feature (`features/avatar/`, `features/products/`, etc.), each containing `api/`, `components/`, `pages/`, `store/`, `types/`, `hooks/` as needed.
- **Zustand Stores:** Global state lives in stores, not in component state. Prefer fine-grained subscriptions (`useStore(s => s.field)`) over subscribing to the whole store to minimize re-renders.
- **Axios apiClient:** All authenticated API calls must go through `src/shared/api/apiClient.ts`. Direct `fetch()` calls (as in `useEngagementStore`) should be migrated to use `apiClient` for consistent auth and error handling.
- **Lazy Loading:** All routes except `HomePage` are lazy-loaded via `React.lazy()` in `AppRoutes.tsx`.
- **GLB Draco URL:** Always import `DRACO_URL` from `AvatarModel.tsx` when calling `useGLTF` or `useGLTF.preload`. Never hardcode a different URL — it would create a separate cache key and cause double-download.
- **Avatar Scene Safety:** Do not translate the scene group in X or Z when inside a narrow-FOV camera setup. Avatar meshes must have `frustumCulled = false`. Use scale lerp for show/hide transitions, not mounting/unmounting.

### 10.3 Settings Module Selection

The Django settings module must always be explicitly passed or set:

```bash
# Development
python manage.py <command> --settings=config.settings.development

# Or set DJANGO_SETTINGS_MODULE in the shell
export DJANGO_SETTINGS_MODULE=config.settings.development
```

Celery's `celery.py` defaults to `config.settings.development`. This must be updated for production.

---

## 11. Appendix

### 11.1 All Environment Variable Names

**Backend (`backend/.env`):**

```
SECRET_KEY
DEBUG
ALLOWED_HOSTS
DB_NAME
DB_USER
DB_PASSWORD
DB_HOST
DB_PORT
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
CHAPA_SECRET_KEY
CHAPA_CALLBACK_URL
CHAPA_RETURN_URL
EMAIL_BACKEND
EMAIL_HOST
EMAIL_PORT
EMAIL_USE_TLS
EMAIL_HOST_USER
EMAIL_HOST_PASSWORD
DEFAULT_FROM_EMAIL
OTP_EXPIRY_MINUTES
CELERY_BROKER_URL
CELERY_RESULT_BACKEND
```

**Frontend (`frontend/.env`):**

```
VITE_GOOGLE_CLIENT_ID
```

### 11.2 Key Backend Python Packages

| Package | Version | Purpose |
|---------|---------|---------|
| Django | 5.2 | Web framework |
| djangorestframework | 3.15.2 | REST API |
| djangorestframework-simplejwt | 5.4.0 | JWT auth + token blacklist |
| drf-spectacular | 0.29.0 | OpenAPI schema generation |
| django-cors-headers | 4.4.0 | CORS middleware |
| django-environ | 0.14.0 | .env file loading |
| django-extensions | 4.1 | Dev utilities (shell_plus, etc.) |
| django-storages | 1.14.4 | Cloud storage backends (configured but unused) |
| psycopg / psycopg2-binary | 3.3.4 / 2.9.9 | PostgreSQL driver |
| celery | 5.6.3 | Async task queue |
| redis | 8.0.1 | Redis client (Celery broker) |
| google-auth | 2.55.1 | Google OAuth token verification |
| requests | 2.34.2 | HTTP client (Chapa API calls) |
| pillow | 11.1.0 | Image processing (ImageField) |
| whitenoise | 6.8.0 | Static file serving |
| gunicorn | 23.0.0 | WSGI server for production |
| boto3 | 1.35.0 | AWS S3 SDK (installed, not configured) |

### 11.3 Key Frontend npm Packages

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.6 | UI framework |
| react-dom | 19.2.6 | DOM rendering |
| react-router-dom | 7.17.0 | Client-side routing |
| three | 0.184.0 | 3D rendering engine |
| @react-three/fiber | 9.6.1 | React renderer for Three.js |
| @react-three/drei | 10.7.7 | Three.js helpers (OrbitControls, useGLTF, etc.) |
| @react-three/postprocessing | 3.0.4 | Post-processing effects |
| postprocessing | 6.39.1 | Post-processing library |
| zustand | 5.0.14 | State management |
| axios | 1.18.1 | HTTP client |
| framer-motion | 12.40.0 | UI animations |
| gsap | 3.15.0 | Hero section animations |
| i18next | 26.3.6 | i18n core |
| react-i18next | 17.0.11 | React i18n bindings |
| i18next-browser-languagedetector | 8.2.1 | Browser locale detection |
| i18next-http-backend | 4.0.1 | Load translation JSON from server |
| i18next-parser | 9.0.2 | Extract translation keys from source |
| lucide-react | 1.17.0 | Icon library |
| react-hot-toast | 2.6.0 | Toast notifications |
| clsx | 2.1.1 | Conditional class names |
| tailwindcss | 3.4.17 | Utility CSS framework |

### 11.4 Items Marked [NEEDS CONFIRMATION FROM OWNER]

The following items could not be confirmed from the code alone and require owner clarification:

1. **Token refresh endpoint mount:** Is `POST /api/auth/token/refresh/` explicitly mounted in `config/urls.py`? If not, the auto-refresh mechanism in `apiClient.ts` silently fails on 401.
2. **Hardcoded API URL:** Should `apiClient.ts` and `useEngagementStore.ts` use `VITE_API_URL` instead of the hardcoded `http://127.0.0.1:8000/api`?
3. **Google OAuth response shape inconsistency:** The Google login returns `{access, refresh, email, created}` while email login returns `{user: {…}, tokens: {…}}`. Is this intentional?
4. **Profile vs AvatarProfile:** Are `accounts.Profile.gender/body_type/skin_tone` used anywhere, or should they be deprecated?
5. **Shipping tiers:** Are the hardcoded ETB 150/300/500/700 shipping fees final?
6. **Bookmark endpoint:** `POST /api/products/bookmark/` is called but doesn't exist. Is this planned?
7. **Account page "Regional Preferences" tab:** Is the tab content implemented?
8. **Seed data / fixtures:** Are there plans for database seeding scripts?
9. **Supported languages for launch:** Which of `en/am/fr/om` need full coverage?
10. **`ProductVariant.measurements` JSON field:** How is this used on the frontend? Is it the 3D try-on garment fitting data?
11. **`Cart.is_active`:** Never set to False — is this planned for future use or can it be removed?
12. **Media storage in production:** Is S3 (`django-storages` + `boto3`) the intended production media backend?
13. **Rate limiting:** Is rate limiting on auth endpoints (OTP, login) planned?
14. **Custom admin panel:** A standalone custom admin frontend was discussed. Is it still planned?

---

*End of SRS — Tilet3D v1.0.0*
