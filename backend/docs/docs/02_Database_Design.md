# Database Design

**Project:** Tilet3D Backend  
**Database:** PostgreSQL  
**ORM:** Django ORM  
**Document Version:** 1.0  

---

# Table of Contents

1. Database Overview
2. Database Design Goals
3. Entity Relationship Overview
4. Common Base Model
5. Accounts Database Design
6. Products Database Design
7. Cart Database Design
8. Orders Database Design
9. Payments Database Design
10. Inventory Design
11. Relationships Summary
12. Data Integrity Strategy
13. UUID Strategy
14. Snapshot Strategy
15. Future Database Improvements

---

# 1. Database Overview

Tilet3D uses PostgreSQL as the primary database.

The database stores all persistent business data including:

- Users
- Profiles
- Products
- Product variants
- Product media
- Shopping carts
- Orders
- Payments
- Inventory states

The database design follows relational database principles while using Django ORM for abstraction.

---

# 2. Database Design Goals

The database was designed around the following goals:

## Data Integrity

The database must prevent invalid states.

Examples:

- Orders must belong to existing users.
- Payments must belong to existing orders.
- Cart items must reference valid product variants.

---

## Historical Accuracy

Customer transactions must remain correct even when products change.

Example:

A product price changes from:

```
3500 ETB
```

to

```
4000 ETB
```

Existing orders must still show:

```
3500 ETB
```

This is handled through order snapshots.

---

## Scalability

The design supports future expansion:

- More payment gateways
- Multiple sellers
- Warehouses
- AI recommendations
- Analytics

---

# 3. Entity Relationship Overview

High-level relationship diagram:

```
User

 |
 |
 +----------------+
 |                |
Profile         Orders
                  |
                  |
              Order Items
                  |
                  |
              Products
                  |
                  |
            Product Variants
                  |
                  |
              Inventory


User

 |
 |
 +-----------+
             |
            Cart
             |
             |
          Cart Items
             |
             |
      Product Variants


Order

 |
 |
Payment
```

---

# 4. Common Base Model

Location:

```
apps/common/models.py
```

The project uses a reusable base model.

Conceptually:

```python
BaseModel

- id
- created_at
- updated_at
```

---

## UUID Primary Keys

All major business entities use UUID identifiers.

Example:

```
20c8faa3-4854-4fdf-a787-d7730474ac56
```

Advantages:

- Harder to guess than sequential IDs
- Better for distributed systems
- Safer for public APIs

---

## Timestamp Tracking

Every model automatically stores:

```
created_at
updated_at
```

Benefits:

- Auditing
- Debugging
- Analytics
- Sorting

---

# 5. Accounts Database Design

## User Model

Application:

```
apps.accounts
```

The project uses a custom user model.

Main responsibilities:

- Authentication
- Authorization
- User identity

---

## User Fields

Conceptually:

| Field | Purpose |
|-|-|
| id | UUID identifier |
| email | Login identity |
| password | Hashed password |
| is_active | Account status |
| is_staff | Admin access |
| is_superuser | Full permissions |
| created_at | Creation timestamp |
| updated_at | Update timestamp |

---

## Why Custom User Model?

Django's default user model uses username authentication.

Tilet3D requires:

```
Email → Login
```

Therefore a custom user model was implemented.

---

# 6. Products Database Design

Application:

```
apps.products
```

The product system follows an e-commerce standard:

```
Product

    |
    |
Product Variant

    |
    |
Product Media
```

---

# Category Model

Represents product classification.

Example:

```
Habesha Clothing

    |
    |
Traditional Dresses
```

Fields:

| Field | Purpose |
|-|-|
| name | Category name |
| slug | URL identifier |
| description | Category information |
| parent | Nested categories |
| is_active | Visibility |
| display_order | Sorting |

---

# Product Model

Represents the main product.

Example:

```
Modern Habesha Kemis
```

Fields:

| Field | Purpose |
|-|-|
| name | Product name |
| slug | URL identifier |
| description | Product details |
| brand | Product brand |
| category | Product classification |
| is_featured | Homepage display |
| is_active | Availability |

---

# Product Variant Model

Important design decision:

Products do not directly represent purchasable items.

Variants represent actual inventory items.

Example:

Product:

```
Modern Habesha Kemis
```

Variants:

```
White / M
White / L
Blue / M
```

Fields:

| Field | Purpose |
|-|-|
| name | Variant name |
| SKU | Inventory identifier |
| color | Color option |
| size | Size option |
| price | Current price |
| stock | Available quantity |
| reserved_stock | Temporarily reserved quantity |
| is_active | Purchase availability |

---

# Product Media Model

Stores product images and videos.

Supports:

- Images
- Videos
- Multiple media files

Fields:

| Field | Purpose |
|-|-|
| variant | Related product variant |
| media_type | Image/video |
| file | Media location |
| is_primary | Main image |
| display_order | Sorting |

---

# Product Social Models

## ProductLike

Relationship:

```
User

+

Product
```

Stores user interactions.

---

## ProductComment

Stores product reviews/comments.

Fields:

| Field | Purpose |
|-|-|
| user | Comment owner |
| product | Target product |
| text | Comment content |

---

## ProductShare

Tracks sharing behavior.

Example:

```
Facebook
Telegram
Twitter
```

---

# 7. Cart Database Design

Application:

```
apps.cart
```

Relationship:

```
User

 1

 |

 1

Cart

 |

many

Cart Items

 |

1

Product Variant
```

---

# Cart Model

Represents active shopping session.

Fields:

| Field | Purpose |
|-|-|
| user | Cart owner |
| is_active | Current cart |
| created_at | Creation date |

---

# CartItem Model

Represents products inside a cart.

Fields:

| Field | Purpose |
|-|-|
| cart | Parent cart |
| variant | Selected product |
| quantity | Amount |

---

# Why Cart Uses Variants

Customers buy specific variants.

Example:

Wrong:

```
Buy Kemis
```

Correct:

```
Buy White Kemis Size M
```

Therefore cart items reference:

```
ProductVariant
```

---

# 8. Orders Database Design

Application:

```
apps.orders
```

Order relationship:

```
User

 |

Orders

 |

Order Items
```

---

# Order Model

Represents completed checkout intent.

Important fields:

| Field | Purpose |
|-|-|
| user | Customer |
| order_number | Human-readable ID |
| status | Order lifecycle |
| payment_status | Payment state |
| subtotal | Product total |
| shipping_fee | Delivery cost |
| tax | Tax amount |
| discount | Discount amount |
| total | Final amount |

---

# Shipping Information

Orders store:

- full name
- phone
- region
- city
- sub city
- woreda
- house number
- postal code
- notes

This avoids dependency on changing user profiles.

---

# OrderItem Model

Stores purchased products.

Important fields:

| Field | Purpose |
|-|-|
| product | Original product reference |
| variant | Original variant reference |
| product_name | Snapshot |
| variant_name | Snapshot |
| SKU | Snapshot |
| price | Purchase price |
| quantity | Purchased amount |
| subtotal | Item total |

---

# 9. Payments Database Design

Application:

```
apps.payments
```

Relationship:

```
Order

 |

Payment
```

One order has one payment record.

---

# Payment Model

Fields:

| Field | Purpose |
|-|-|
| user | Payment owner |
| order | Related order |
| amount | Payment amount |
| currency | Currency code |
| provider | Payment gateway |
| status | Payment state |
| transaction_id | Gateway reference |
| checkout_url | Payment page |
| webhook_payload | Gateway response |

---

# 10. Inventory Design

Inventory exists inside ProductVariant.

The system uses:

```
stock

+

reserved_stock
```

Example:

Initial:

```
stock = 20
reserved_stock = 0
```

After checkout:

```
stock = 20
reserved_stock = 3
```

Available:

```
20 - 3 = 17
```

After payment:

```
stock = 17
reserved_stock = 0
```

After failed payment:

```
stock = 20
reserved_stock = 0
```

---

# 11. Relationships Summary

| Relationship | Type |
|-|-|
| User → Profile | OneToOne |
| User → Cart | OneToOne |
| User → Orders | OneToMany |
| Product → Variants | OneToMany |
| Variant → Media | OneToMany |
| Cart → Items | OneToMany |
| Order → Items | OneToMany |
| Order → Payment | OneToOne |

---

# 12. Data Integrity Strategy

The backend uses several techniques.

## Foreign Keys

Prevent orphan records.

Example:

A payment cannot exist without an order.

---

## PROTECT Deletes

Important business records use:

```
on_delete=models.PROTECT
```

Example:

Products cannot be deleted if they appear in orders.

---

## Transactions

Critical operations use:

```python
transaction.atomic()
```

Example:

Checkout.

---

# 13. UUID Strategy

UUIDs are used for public-facing entities.

Reasons:

- Security
- Distributed system compatibility
- API safety

Examples:

```
Product ID

Order ID

Payment ID
```

---

# 14. Snapshot Strategy

Orders store historical product information.

Why?

Products change over time.

Without snapshots:

```
Old order

↓

Updated product name

↓

Incorrect history
```

With snapshots:

```
Order

↓

Original purchased information
```

This guarantees financial accuracy.

---

# 15. Future Database Improvements

Future versions may introduce:

## Search Optimization

Using:

- PostgreSQL full-text search
- Elasticsearch

---

## Analytics Database

Separate storage for:

- user behavior
- recommendations
- sales analytics

---

## AI Data Storage

Future tables:

```
BodyProfile

Avatar

Measurements

TryOnSession

Recommendation
```

---

# Conclusion

The Tilet3D database design provides a reliable foundation for an AI-powered e-commerce platform.

The schema balances traditional relational database principles with modern requirements such as scalability, inventory consistency, payment tracking, and future AI integration.

The design intentionally separates products, variants, inventory, orders, and payments to maintain accuracy throughout the complete shopping lifecycle.