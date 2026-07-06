# Tilet3D Backend Documentation

## Phase I — Cart & Orders Module

---

# Cart App

## Overview

The Cart application is responsible for managing a customer's shopping cart before checkout. Every authenticated user owns one active cart that contains multiple cart items. Each cart item references a specific product variant rather than the product itself.

Example:

```
Product
└── Habesha Kemis

Variant
├── White - S
├── White - M
├── White - L

Cart
└── Cart Item
      └── White - M
```

This design allows customers to purchase the exact color, size, and price combination.

---

# Design Decisions

Several architectural decisions were made during the implementation.

## 1. Cart is its own application

Instead of storing Cart inside the Products application, a dedicated Cart app was created.

Advantages:

* Better separation of responsibilities.
* Products remain responsible only for catalog management.
* Easier future maintenance.
* Easier testing.
* Cleaner architecture.

---

## 2. One Cart per User

Each authenticated user owns exactly one active cart.

Relationship:

```
User
 └── One Cart
       └── Many Cart Items
```

Model relationship:

```
User
    ↓ OneToOne
Cart
```

Benefits:

* Simplifies checkout.
* Eliminates duplicate carts.
* Faster cart retrieval.

---

## 3. Cart Items reference Product Variants

A customer purchases a Product Variant instead of a Product.

Reason:

Different variants have different:

* Price
* Size
* Color
* Stock
* SKU

Example

```
Habesha Kemis

Variant A
Color : White
Size  : S
Price : 3200

Variant B
Color : White
Size  : M
Price : 3500
```

The cart therefore stores Variant IDs.

---

## 4. Images are loaded dynamically

Images are never duplicated inside Cart.

Instead,

```
CartItem
    ↓
Variant
    ↓
ProductMedia
```

The serializer automatically returns the primary image.

---

## Models

### Cart

Represents the active shopping cart of one user.

Fields

| Field      | Description         |
| ---------- | ------------------- |
| id         | UUID Primary Key    |
| user       | Owner of the cart   |
| is_active  | Current active cart |
| created_at | Creation timestamp  |
| updated_at | Last update         |

Relationship

```
User
    ↓
Cart
```

---

### CartItem

Represents one selected product variant.

Fields

| Field    | Description       |
| -------- | ----------------- |
| id       | UUID              |
| cart     | Parent cart       |
| variant  | Purchased variant |
| quantity | Selected quantity |

Relationship

```
Cart
    ↓
CartItem
        ↓
ProductVariant
```

---

# Business Logic

## View Cart

```
GET /api/cart/
```

Process

1. Authenticate user.
2. Get or create the user's cart.
3. Prefetch product and media.
4. Serialize cart.
5. Return response.

---

## Add Item

```
POST /api/cart/add/
```

Workflow

```
Receive Variant ID
        ↓
Validate UUID
        ↓
Find Variant
        ↓
Check Product Active
        ↓
Check Variant Active
        ↓
Check Stock
        ↓
Create Cart Item
        ↓
Return Success
```

---

## Update Quantity

```
PATCH /api/cart/item/<uuid>/
```

Workflow

```
Find Cart Item
        ↓
Validate Quantity
        ↓
Update Quantity
        ↓
Save
```

---

## Remove Item

```
DELETE /api/cart/item/<uuid>/
```

Workflow

```
Find Cart Item
        ↓
Delete
        ↓
Return Success
```

---

# Stock Validation

Stock validation occurs before any item is added.

Validation Rules

* Variant must exist.
* Variant must be active.
* Product must be active.
* Quantity > 0.
* Quantity cannot exceed stock.
* Existing quantity + new quantity cannot exceed stock.

Example

Current stock

```
5
```

Already in cart

```
3
```

Trying to add

```
4
```

Result

```
3 + 4 > 5

Rejected
```

This prevents overselling.

---

# API Reference

## Get Cart

```
GET /api/cart/
```

Authentication

```
Bearer Token
```

Response

```json
{
    "id": "...",
    "total_items": 4,
    "subtotal": 14278,
    "items": [
        {
            "id": "...",
            "quantity": 2,
            "subtotal": 6676,
            "product": {
                "id": "...",
                "name": "Society Habesha Set",
                "slug": "society-habesha-set"
            },
            "variant": {
                "id": "...",
                "name": "Black - L",
                "sku": "SKU001",
                "color": "White",
                "size": "S",
                "price": "3338.00",
                "stock": 12
            },
            "image": "/media/products/..."
        }
    ]
}
```

---

## Add Item

```
POST /api/cart/add/
```

Request

```json
{
    "variant_id": "...",
    "quantity": 2
}
```

Response

```json
{
    "message": "Item added successfully."
}
```

---

## Update Item

```
PATCH /api/cart/item/<uuid>/update/
```

Request

```json
{
    "quantity": 3
}
```

Response

```json
{
    "message": "Cart item updated."
}
```

---

## Remove Item

```
DELETE /api/cart/item/<uuid>/
```

Response

```json
{
    "message": "Item removed from cart."
}
```

---

# Orders App

## Overview

The Orders application converts a customer's shopping cart into a permanent purchase record.

Unlike the cart, an order never changes after checkout except for administrative status updates.

---

# Checkout Flow

```
Customer clicks Checkout
            │
            ▼
Validate Request
            │
            ▼
Load Cart
            │
            ▼
Validate Stock
            │
            ▼
Calculate Totals
            │
            ▼
Create Order
            │
            ▼
Create Order Items
            │
            ▼
Reduce Inventory
            │
            ▼
Clear Cart
            │
            ▼
Return Order
```

Everything executes inside a database transaction.

---

# Order Lifecycle

```
Cart
   │
   ▼
Checkout
   │
   ▼
Pending
   │
   ├────────► Paid
   │
   ▼
Processing
   │
   ▼
Shipped
   │
   ▼
Delivered
```

Possible alternative states

```
Cancelled

Refunded
```

---

# Snapshot Strategy

Order items store a snapshot of the purchased product.

Stored fields include:

* Product Name
* Variant Name
* SKU
* Color
* Size
* Price

Reason

Product data may change in the future.

Example

Today

```
Habesha Kemis
3500 ETB
```

Next month

```
Habesha Kemis
4500 ETB
```

The customer's previous order must still display

```
3500 ETB
```

Snapshots preserve purchase history.

---

# Stock Deduction

Stock is reduced only after successful order creation.

Workflow

```
Variant Stock
      12
       │
Customer buys 2
       │
       ▼
Save Order
       │
       ▼
Stock = 10
```

Cart deletion occurs only after successful stock reduction.

---

# API Documentation

## Checkout

```
POST /api/orders/checkout/
```

Authentication

```
Bearer Token
```

Request

```json
{
    "full_name": "John Doe",
    "phone": "0912345678",
    "region": "Oromia",
    "city": "Adama",
    "sub_city": "Bole",
    "woreda": "03",
    "house_no": "H12",
    "postal_code": "1000",
    "note": "Deliver after 5 PM"
}
```

Response

```json
{
    "message": "Order placed successfully.",
    "order": {
        "order_number": "A3B5D8F2E1C4",
        "status": "Pending",
        "payment_status": "Pending",
        "total": "14278.00"
    }
}
```

---

## List Orders

```
GET /api/orders/
```

Returns all orders belonging to the authenticated user.

---

## Order Detail

```
GET /api/orders/<order_number>/
```

Returns

* Order Information
* Shipping Details
* Payment Status
* Ordered Items
* Totals

---

# Important Architectural Decisions

## Separate Applications

```
accounts
products
cart
orders
```

Each application has one responsibility.

---

## UUID Primary Keys

Every major model uses UUIDs.

Benefits

* Harder to enumerate
* Better security
* Better for distributed systems

---

## Snapshot-Based Orders

Orders never depend on mutable product data.

Historical accuracy is preserved.

---

## Atomic Checkout

Checkout executes inside a database transaction.

If any operation fails:

* No order is created.
* Stock is not reduced.
* Cart remains unchanged.

This guarantees database consistency.

---

## Future Payment Integration

Orders are intentionally decoupled from payment gateways.

This design allows future integration with:

* Chapa
* Telebirr
* CBE Birr
* Stripe
* PayPal

without changing checkout logic.

---

# Bugs Encountered and Solutions

## 1. Cart moved from Products app

Problem

Initially, Cart and CartItem were inside the Products application.

This mixed catalog responsibilities with shopping functionality.

Solution

A dedicated Cart application was created.

Benefits

* Cleaner architecture.
* Better maintainability.
* Easier testing.
* Better scalability.

---

## 2. Migration Failure

Error

```
FieldDoesNotExist

CartItem has no field named cart
```

Cause

Django generated migrations that attempted to remove fields and constraints in an invalid order after moving the models.

Solution

* Removed incorrect migration files.
* Reset the development database.
* Generated fresh migrations.
* Migrated again with Cart as its own application.

---

## 3. PostgreSQL Schema Issue

Error

```
no schema has been selected to create in
```

Cause

The public schema was accidentally removed without being recreated with proper ownership and permissions.

Solution

* Recreated the public schema.
* Restored ownership.
* Regranted schema permissions.
* Re-ran migrations.

---

## 4. Invalid UUID Error

Error

```
ValidationError

Invalid UUID
```

Cause

Placeholder text was sent instead of a real Product Variant UUID during API testing.

Solution

UUID validation was added before querying the database, and API testing now uses actual Variant IDs returned from the Product API.

---

# Current Project Status

## Completed

* Common application
* Accounts application
* JWT Authentication
* Google OAuth
* Products
* Categories
* Product Variants
* Product Media
* Cart
* Checkout
* Orders
* Stock validation
* Order snapshots
* Order history
* Django Admin configuration
* REST API implementation
* Postman testing
* Git version control

---

## Next Milestone

The next backend module is the **Payments** application.

Planned features:

* Payment model
* Cash on Delivery support
* Payment records
* Payment status tracking
* Payment abstraction layer
* Future integration with Ethiopian payment gateways (Chapa, Telebirr, CBE Birr) and international providers if needed.
