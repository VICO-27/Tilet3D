# Products System Documentation

## Overview

The Products system is the core catalog management module of Tilet3D.

It is responsible for managing:

- Product categories
- Products
- Product variants
- Product media
- Product inventory information
- Product interactions (likes, comments, shares)
- Product API endpoints
- Admin product management

The system was designed specifically for an e-commerce platform selling Ethiopian cultural clothing while keeping future AI virtual try-on integration in mind.

---

# Product System Architecture

The product architecture follows a layered design:

                Frontend Client
                      |
                      |
                      v
              Products API Layer
                      |
                      |
                      v
              Product Services
                      |
                      |
                      v
              Product Models
                      |
                      |
                      v
                PostgreSQL Database


---

# Main Product Components

The Products application contains:

apps/products/

├── api/
│ ├── serializers.py
│ ├── views.py
│ └── urls.py
│
├── services/
│ └── inventory.py
│
├── management/
│ └── commands/
│
├── models.py
├── admin.py
└── tests.py


---

# Design Philosophy

The product system follows several important design decisions:

## 1. Product and Product Variant Separation

A product is separated from its purchasable variants.

Example:


Product:
Modern Habesha Kemis

Variants:
White / Small
White / Medium
White / Large
Blue / Medium


Why?

Because customers buy a specific variant, not the general product.

The variant contains:

- Size
- Color
- SKU
- Price
- Stock

---

## 2. Media Belongs to Variants

Product images are connected to variants.

Example:


Habesha Kemis

|
|
+-- White / Medium
        |
        +-- white_front.jpg
        +-- white_side.jpg


|
|
+-- Blue / Medium
        |
        +-- blue_front.jpg

Reason:

Different colors may have different images.

---

# Database Models

Location:


apps/products/models.py


---

# Category Model

## Purpose

Organizes products into groups.

Example:


Habesha Clothing

|
+-- Kemis

|
+-- Men's Clothing

|
+-- Accessories

---

## Category Fields

Example:

```python
id
name
slug
description
parent
is_active
display_order
created_at
updated_at
Parent Category Support

Categories support nesting.

Example:

Clothing

 |
 +-- Women's Clothing

       |
       +-- Habesha Kemis

This allows future expansion.

Product Model
Purpose

Represents the main product information.

Example:

Modern Habesha Kemis
Product Fields
id
name
slug
description
brand
category
is_featured
is_active
created_at
updated_at
Product Responsibilities

The Product model stores:

Product identity
Marketing information
Category relationship
Visibility status

It does not store:

Price
Stock
Size
Color

Those belong to variants.

Product Variant Model
Purpose

Represents an actual purchasable item.

Example:

Modern Habesha Kemis

Variant:

Color:
White

Size:
Medium

Price:
3500 ETB

Stock:
20
Variant Fields
id
product
name
sku
color
size
price
stock
reserved_stock
measurements
is_active
created_at
updated_at
SKU System

Each variant has a unique SKU.

Example:

HKM-001-W-M

Meaning:

HKM
=
Habesha Kemis


001
=
Product number


W
=
White


M
=
Medium

Benefits:

Inventory tracking
Warehouse management
Order processing
Analytics
Inventory Management

Inventory logic is separated from models.

Location:

apps/products/services/inventory.py
Why Separate Inventory Logic?

Bad approach:

variant.stock -= quantity

directly inside views.

Problems:

Hard to maintain
No transaction control
Business logic scattered

Better approach:

API

 |
 v

InventoryService

 |
 v

Database
Inventory States

The system supports:

Available Stock

Physical stock available for purchase.

Example:

stock = 20
Reserved Stock

Stock temporarily locked during checkout.

Example:

stock = 20

reserved_stock = 2

Available:

20 - 2 = 18
Inventory Flow
Customer adds item to cart

        |
        v

Checkout started

        |
        v

Inventory reserved

        |
        v

Payment successful

        |
        v

Inventory confirmed

        |
        v

Order completed
Product Media System
Purpose

Stores product images and future videos.

Model:

ProductMedia
Media Fields
id
variant
media_type
file
is_primary
display_order
created_at
Supported Media Types

Current:

image

Future:

video
3D model
AR asset
AI generated preview
Primary Media

Each variant can have a main image.

Example:

White / Medium

Media:

1. white-front.webp
   primary=True


2. white-side.webp
   primary=False
Product Social Features

Tilet3D products support customer interaction.

Features:

Like
Comment
Share
Product Like System

Model:

ProductLike

Purpose:

Track user likes.

Example:

User A
likes
Modern Habesha Kemis
Like API Behavior

If user has not liked:

POST like

Creates like

Response:

{
    "liked": true
}

If user already liked:

POST like

Removes like

Response:

{
    "liked": false
}
Product Comment System

Model:

ProductComment

Stores:

user
product
text
created_at

Example:

{
    "text":
    "Beautiful traditional design"
}
Product Share System

Model:

ProductShare

Tracks product sharing.

Example:

User shared product to:

Facebook
Telegram
Instagram
Product API Architecture

Base URL:

/api/products/
Product List API

Endpoint:

GET /api/products/

Purpose:

Returns available products.

Authentication:

Public

Example response:

[
 {
    "id": "uuid",
    "name": "Modern Habesha Kemis",
    "slug": "modern-habesha-kemis",
    "category_name": "Habesha Clothing",
    "variants": []
 }
]
Product Detail API

Endpoint:

GET /api/products/<slug>/

Example:

GET /api/products/modern-habesha-kemis/

Response includes:

Product information
Variants
Media
Like count
Comment count
User like status

Example:

{
"name":"Modern Habesha Kemis",

"variants":[
 {
   "color":"White",
   "size":"M",
   "price":"3500.00"
 }
],

"like_count":10,

"comment_count":5
}
Like API

Endpoint:

POST /api/products/like/

Authentication:

Required

Request:

{
"product_id":"uuid"
}
Comment API

Endpoint:

POST /api/products/comment/

Authentication:

Required

Request:

{
"product_id":"uuid",
"text":"Amazing design"
}
Share API

Endpoint:

POST /api/products/share/

Request:

{
"product_id":"uuid",
"platform":"telegram"
}
Product Serialization

Location:

apps/products/api/serializers.py

The serializer converts:

Database Models

        |

        v

JSON API Response

The product serializer handles:

Nested variants
Variant media
Category information
Interaction counters
User-specific like state
Admin Management

Products are managed through Django Admin.

Available admin sections:

Products

Categories

Product Variants

Product Media

Product Likes

Product Comments

Product Shares
Product Creation Workflow

Current workflow:

Admin creates category

        |

Admin creates product

        |

Admin creates variants

        |

Admin uploads media

        |

Product becomes visible
Current Product Permissions

Current:

Admin only

Only administrators can create products.

Future:

Seller accounts

Seller dashboard

Product approval workflow
AI Virtual Try-On Preparation

The product system was designed to support AI features.

Future relationship:

Product Variant

        |

        |

AI Clothing Asset

        |

        |

Virtual Avatar System

Future AI fields may include:

3D model file

texture map

cloth simulation data

AI fitting parameters
Integration With Other Systems
Cart System

Cart stores:

ProductVariant

not Product.

Reason:

Customers purchase:

White Medium Kemis

not:

Modern Kemis
Order System

Orders store product snapshots.

Example:

Product name:
Modern Habesha Kemis

Variant:
White Medium

Price:
3500 ETB

Even if the product changes later, the order remains correct.

Payment System

Payments are connected indirectly:

Payment

 |

Order

 |

OrderItem

 |

ProductVariant
Performance Optimization

Implemented:

select_related

Used for:

category
product
prefetch_related

Used for:

variants
media
likes
comments

Benefits:

Reduced database queries
Faster product pages
Better scalability
Current Status

Products system status:

✅ Product model
✅ Category system
✅ Product variants
✅ Media system
✅ Inventory integration
✅ Like system
✅ Comment system
✅ Share system
✅ Product APIs
✅ Admin management
✅ Future AI compatibility

Future Improvements

Planned:

Product search
Filtering
Sorting
Product recommendations
Seller dashboard
Product reviews
Rating system
AI-generated product previews
3D clothing assets
Summary

The Products system provides a scalable foundation for Tilet3D's e-commerce platform.

The architecture separates:

Product identity
Purchasable variants
Inventory
Media
User interactions

This design allows the platform to evolve from a traditional clothing marketplace into an AI-powered virtual try-on ecosystem.
