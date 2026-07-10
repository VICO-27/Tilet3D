# Cart System Documentation

## Overview

The Cart system is responsible for managing a customer's shopping session before an order is created.

It acts as the temporary storage between browsing products and completing checkout.

The Cart module allows authenticated users to:

- Add products to their cart
- Update item quantities
- Remove items
- View current cart contents
- Calculate cart totals
- Validate inventory before checkout

Unlike an Order, the Cart is temporary and fully editable until the customer decides to place an order.

---

# Cart System Architecture

The Cart module follows the same layered architecture used throughout the backend.

```
                Client Application
                        │
                        ▼
                 Cart API Views
                        │
                        ▼
                Business Logic
                        │
                        ▼
                  Cart Models
                        │
                        ▼
                  PostgreSQL Database
```

The Cart system is intentionally lightweight.

Business rules such as inventory reservation are delegated to specialized services rather than being implemented directly inside the models.

---

# Application Structure

```
apps/cart/

├── api/
│   ├── serializers.py
│   ├── urls.py
│   └── views.py
│
├── migrations/
│
├── admin.py
├── apps.py
├── models.py
└── tests.py
```

---

# Design Goals

The Cart system was designed around several principles.

- One active cart per user
- Cart items reference product variants instead of products
- Cart remains editable until checkout
- Inventory is validated before checkout
- Stock is not permanently deducted while items remain in the cart
- Checkout is responsible for creating Orders

---

# Why a Separate Cart?

Without a cart, users would need to purchase one item immediately.

A dedicated cart allows users to:

- Add multiple products
- Compare products
- Adjust quantities
- Continue shopping
- Checkout once

This provides the standard shopping experience expected in modern e-commerce applications.

---

# Database Models

The Cart application contains two primary models.

```
Cart

CartItem
```

---

# Cart Model

The Cart model represents a user's active shopping session.

Relationship:

```
User

   │

   ▼

Cart

   │

   ▼

CartItem
```

---

## Cart Fields

The Cart model stores:

```python
id
user
is_active
created_at
updated_at
```

### Field Explanation

**id**

Unique UUID identifier.

---

**user**

Owner of the cart.

Each authenticated user owns exactly one active cart.

---

**is_active**

Allows carts to be archived in the future without deletion.

Current implementation keeps the cart active.

---

# One Cart Per User

Business rule:

```
One User

↓

One Active Cart
```

Benefits:

- Simpler checkout
- Easier frontend logic
- Better inventory consistency
- Cleaner database relationships

---

# CartItem Model

A CartItem represents one product variant inside the cart.

Relationship:

```
Cart

   │

   ▼

CartItem

   │

   ▼

ProductVariant
```

---

## CartItem Fields

```python
id
cart
variant
quantity
created_at
updated_at
```

---

# Why CartItem References ProductVariant

Customers purchase:

```
White / Medium Habesha Kemis
```

not

```
Habesha Kemis
```

The ProductVariant contains:

- Size
- Color
- SKU
- Price
- Stock

Therefore every cart item points directly to a ProductVariant.

---

# Cart Workflow

The complete cart lifecycle is:

```
Customer logs in

        │

        ▼

View products

        │

        ▼

Add item

        │

        ▼

Update quantity

        │

        ▼

Continue shopping

        │

        ▼

Checkout

        │

        ▼

Cart cleared
```

---

# Add To Cart Flow

The Add to Cart endpoint performs several operations.

```
Receive Product Variant

        │

        ▼

Validate Variant

        │

        ▼

Find User Cart

        │

        ▼

Already Exists?

      /      \

    Yes       No

     │         │

Increase Qty  Create Item

      │

      ▼

Return Updated Cart
```

---

# Updating Cart Quantity

Customers may change quantities at any time before checkout.

Example:

Before:

```
White Medium

Quantity:

1
```

Customer updates:

```
Quantity:

3
```

The cart item is updated without creating duplicates.

---

# Removing Items

If quantity becomes zero or the user removes the item:

```
Cart Item

↓

Delete

↓

Cart Updated
```

---

# Viewing Cart

The View Cart endpoint returns:

- Cart information
- Cart items
- Product details
- Variant details
- Prices
- Quantities
- Subtotals
- Total amount

---

Example Response

```json
{
    "items": [
        {
            "product": "Modern Habesha Kemis",
            "variant": "White / M",
            "price": "3500.00",
            "quantity": 2,
            "subtotal": "7000.00"
        }
    ],
    "total": "7000.00"
}
```

---

# Cart Calculations

Each CartItem calculates:

```
subtotal

=

price × quantity
```

Cart total equals:

```
Sum of all item subtotals
```

Example:

```
Item A

3500 × 2

=

7000


Item B

1200 × 1

=

1200


Cart Total

8200 ETB
```

---

# Inventory Validation

The cart itself does **not** reserve inventory.

Instead, inventory is checked during checkout.

Reasons:

- Prevent unnecessary stock locking
- Avoid abandoned carts reserving products
- Improve customer experience

---

# Checkout Relationship

When checkout begins:

```
Cart

↓

Validate Inventory

↓

Reserve Stock

↓

Create Order

↓

Create Payment

↓

Delete Cart Items
```

After successful checkout:

```
Cart

↓

Empty
```

The cart itself remains available for future shopping.

---

# Business Rules

The Cart system enforces several rules.

### Rule 1

Only authenticated users may own carts.

---

### Rule 2

Each user has one active cart.

---

### Rule 3

Cart items must reference active ProductVariants.

---

### Rule 4

Quantities must be positive integers.

---

### Rule 5

Checkout validates inventory before creating an order.

---

# Cart API

Base URL

```
/api/cart/
```

---

## View Cart

Endpoint

```
GET /api/cart/
```

Authentication

Required

Purpose

Returns the authenticated user's current shopping cart.

---

## Add To Cart

Endpoint

```
POST /api/cart/add/
```

Example Request

```json
{
    "variant_id": "uuid",
    "quantity": 2
}
```

Purpose

Creates or updates a cart item.

---

## Update Cart Item

Endpoint

```
PATCH /api/cart/item/<item_id>/update/
```

Example Request

```json
{
    "quantity": 3
}
```

Purpose

Updates item quantity.

---

## Delete Cart Item

Endpoint

```
DELETE /api/cart/item/<item_id>/
```

Purpose

Removes an item from the cart.

---

# Serialization

The serializers expose:

- Variant information
- Product information
- Media
- Prices
- Quantities
- Calculated subtotals

Nested serialization reduces frontend requests and provides a complete cart representation.

---

# Admin Integration

The Cart application includes Django Admin support.

Administrators can:

- View carts
- Inspect cart items
- Monitor shopping activity
- Debug customer issues

Cart Items are displayed inline within the Cart admin page.

---

# Performance Optimizations

The Cart module minimizes database queries using:

## select_related

Used for:

- ProductVariant
- Product

---

## prefetch_related

Used when retrieving collections of cart items.

This significantly reduces N+1 query problems.

---

# Security

Only authenticated users can access their carts.

Users cannot:

- View another customer's cart
- Modify another customer's items
- Checkout another customer's cart

All cart operations use the authenticated request user.

---

# Relationship With Other Systems

## Products

Cart references ProductVariant.

```
CartItem

↓

ProductVariant
```

---

## Orders

Checkout converts CartItems into OrderItems.

```
CartItem

↓

OrderItem
```

---

## Inventory

Inventory reservation begins during checkout.

```
Cart

↓

InventoryService.reserve()
```

---

## Payments

The Cart system never interacts directly with payment providers.

Payments are initialized only after the Order has been created.

---

# Current Status

Implemented

- Cart model
- CartItem model
- Add to cart
- Update quantity
- Remove item
- View cart
- Cart totals
- Nested serialization
- Admin interface
- Checkout integration
- Authentication protection

---

# Future Improvements

Planned enhancements include:

- Save for later
- Guest shopping carts
- Coupon preview
- Estimated shipping costs
- Cart expiration
- Wishlist integration
- Recently viewed products
- AI product recommendations

---

# Summary

The Cart system serves as the bridge between product browsing and checkout.

It provides customers with a flexible shopping experience while keeping business rules centralized and preparing the platform for scalable order processing.

By separating cart management from inventory reservation and payment processing, the system remains modular, maintainable, and easy to extend as Tilet3D evolves.