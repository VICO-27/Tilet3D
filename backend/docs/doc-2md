# Phase 2 — Products App (Current Progress)

**Project:** Tilet3D  
**Backend:** Django + Django REST Framework + PostgreSQL  
**Frontend:** React + Vite (Not integrated yet)

---

# Objective

Design and implement a scalable Products module that will support:

- Ethiopian traditional clothing
- Traditional shoes
- Traditional bags
- Accessories
- Future AI-powered 3D virtual try-on
- Future seller marketplace

The architecture is intentionally designed to support many different product types without changing the database schema.

---

# Architecture Decisions

## Parent Product + Child Variant

Instead of storing every product as a single database record, products are separated into two levels.

### Product

Represents the generic product.

Example:

Habesha Kemis

Contains:

- Name
- Description
- Category
- Brand
- Featured flag
- Status
- Slug

---

### Product Variant

Represents purchasable variations.

Example:

Habesha Kemis

Variant 1

- White
- Medium

Variant 2

- White
- Large

Variant 3

- Gold
- Medium

Variant 4

- Gold
- Large

Each variant has:

- SKU
- Price
- Stock
- Size
- Color
- Measurements
- Dynamic JSON specifications

This avoids duplicate Product records.

---

# JSON-Based Flexible Product Data

Instead of adding hundreds of database columns for different product types, PostgreSQL JSON fields are used.

Example:

```json
{
  "fabric": "Cotton",
  "neck_style": "Round",
  "elasticity": 0.8,
  "waist": 78,
  "chest": 94
}
```

Advantages:

- Works for dresses
- Works for shoes
- Works for bags
- Works for future products

without schema migrations.

---

# Category System

Implemented hierarchical categories.

Example

Women

- Habesha Kemis
- Netela

Men

- Kaba
- Traditional Shirt

Children

Accessories

Supports:

- image
- video
- display order
- active/inactive
- parent categories

---

# Product Media

Created ProductMedia model.

Supports:

- Images
- Videos

Each media object contains:

- media type
- primary flag
- display order

This allows the frontend to:

- rotate product colors
- autoplay product videos
- build TikTok-like product cards

---

# Admin Panel

Implemented Django Admin for

- Categories
- Products
- Variants
- Product Media

Includes:

- search
- filtering
- slug generation
- ordering

Currently only administrators can publish products.

Future:

Seller dashboard.

---

# Fake Product Seeder

Built fake product generator.

Purpose:

Populate database quickly for frontend development.

Automatically creates

- Categories
- Products
- Variants
- Product Media

using Faker.

---

# REST API

Implemented:

GET

/api/products/

Returns

- products
- variants
- media

Example response

```json
[
  {
    "name": "Habesha Kemis",
    "variants": [
      {
        "color": "White",
        "size": "M",
        "media": [...]
      }
    ]
  }
]
```

---

Implemented:

GET

/api/products/{slug}/

Returns detailed information for one product.

---

# Cart System

Implemented

Cart

Cart Item

Endpoints

GET

/api/products/cart/

POST

/api/products/cart/add/

DELETE

/api/products/cart/item/{id}/

PATCH

/api/products/cart/item/{id}/update/

Authentication required.

---

# Social Features

Implemented models and endpoints for

Likes

Comments

Shares

Prepared serializer fields for

- like_count
- comment_count
- is_liked

for future frontend integration.

---

# Authentication

Uses

JWT

Custom Email Authentication Backend

Google OAuth

Profile System

Authentication is required for

- cart
- likes
- comments
- shares

---

# Bugs Encountered

## Django Admin Login

Problem

Admin login always failed.

Cause

EmailBackend expected username while serializer sent email.

Solution

Modified authentication backend to support both.

---

## URL Routing Conflict

Problem

/api/products/cart/

returned

No Product matches the given query

Cause

Product detail route

<slug:slug>

was declared before

cart/

Solution

Moved product detail route to the bottom of urlpatterns.

---

# API Testing

Tested using

- Browser
- Django REST Framework Browsable API
- Postman

Verified

Products

Product Detail

Authentication

Cart routing

---

# Current Folder Structure

apps/products

```
products/
│
├── api/
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
│
├── admin.py
├── models.py
├── migrations/
└── management/
    └── commands/
        └── seed_products.py
```

---

# Current Status

Completed

- Category model
- Product model
- Variant model
- Product Media
- Admin
- Product APIs
- Fake Seeder
- Cart
- Likes
- Comments
- Shares
- Authentication integration

---

# Phase 2 Remaining Tasks

## Refactor API Architecture

Current

```
/api/products/cart/
/api/products/like/
/api/products/comment/
/api/products/share/
```

Target

```
/api/products/
/api/cart/
/api/interactions/
/api/orders/
/api/payments/
```

Reason

Better scalability and separation of responsibilities.

---

# Future Work

Order System

Payment Integration

Wishlist

Seller Marketplace

Inventory Management

Recommendation Engine

3D Avatar Integration

Mesh Matching

Fabric Simulation

AI Size Recommendation

Try-On Rendering

Review & Rating System

Product Search

Product Filtering

Notifications

Admin Analytics

---

# Phase Status

Phase 2 is approximately 70–75% complete.

The product catalog foundation is now stable enough to begin separating business modules into dedicated apps before implementing checkout and payments.