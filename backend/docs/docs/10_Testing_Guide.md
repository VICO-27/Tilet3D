# 10. Testing Guide

> **Project:** Tilet3D Backend  
> **Purpose:** Document the testing strategy, API verification process, tools used, expected results, and known issues encountered during backend development.

---

# Overview

The Tilet3D backend was tested incrementally throughout development to ensure that each application and business workflow behaved correctly before integrating with the next module.

Testing focused on:

- Authentication
- Products
- Cart
- Orders
- Payments
- Inventory Management
- Order Lifecycle
- Payment Webhooks

The goal was to validate both individual endpoints and complete business workflows.

---

# Testing Tools

The following tools were used throughout development.

| Tool | Purpose |
|-------|----------|
| Postman | API testing |
| Django Admin | Database verification |
| PostgreSQL | Data inspection |
| Django Shell | Manual debugging |
| Browser | Media verification |
| Terminal | Server logs and exception tracing |

---

# Development Environment

Operating System

```
Ubuntu 24.04 LTS
```

Backend

```
Django
Django REST Framework
```

Database

```
PostgreSQL
```

Authentication

```
JWT (SimpleJWT)
```

Payment Gateway

```
Chapa Sandbox
```

---

# Testing Workflow

The backend was tested using the following sequence.

```
Register
      ↓
Login
      ↓
Profile
      ↓
Products
      ↓
Cart
      ↓
Checkout
      ↓
Payment Initialization
      ↓
Webhook
      ↓
Orders
```

Each stage had to pass before proceeding to the next.

---

# Authentication Testing

## Register

Endpoint

```
POST /api/auth/register/
```

Verified

- User creation
- Password hashing
- Duplicate email prevention
- Validation errors

Expected Result

```
201 Created
```

---

## Login

Endpoint

```
POST /api/auth/login/
```

Verified

- JWT access token
- JWT refresh token
- Correct credentials
- Invalid credentials

Expected Result

```
200 OK
```

---

## Profile

Endpoint

```
GET /api/auth/profile/
```

Verified

- JWT authentication
- User profile retrieval

Expected Result

```
200 OK
```

---

# Products Testing

## Product List

Endpoint

```
GET /api/products/
```

Verified

- Product retrieval
- Category serialization
- Variant serialization
- Product media
- Like count
- Comment count

Expected Result

```
200 OK
```

---

## Product Detail

Endpoint

```
GET /api/products/{slug}/
```

Verified

- Slug lookup
- Variant loading
- Product media
- Like status
- Comment count

Expected Result

```
200 OK
```

---

## Like Product

Endpoint

```
POST /api/products/like/
```

Verified

- Like creation
- Like removal
- Toggle behavior

Expected Result

```
liked=true
liked=false
```

---

## Comment

Endpoint

```
POST /api/products/comment/
```

Verified

- Comment creation
- Product relation
- User relation

Expected Result

```
Comment saved
```

---

## Share

Endpoint

```
POST /api/products/share/
```

Verified

- Share record creation
- Platform storage

Expected Result

```
Share recorded
```

---

# Cart Testing

## Add Item

Verified

- Variant exists
- Quantity validation
- Existing cart item update
- Cart creation

Expected Result

```
201 Created
```

---

## View Cart

Verified

- Cart retrieval
- Variant information
- Prices
- Totals

Expected Result

```
200 OK
```

---

## Update Quantity

Verified

- Quantity modification
- Price recalculation

Expected Result

```
200 OK
```

---

## Remove Item

Verified

- Cart item deletion

Expected Result

```
204 No Content
```

---

# Checkout Testing

Checkout is the most important business workflow.

Verified

- Empty cart validation
- Inventory reservation
- Order creation
- Order item creation
- Snapshot creation
- Cart clearing
- Payment creation
- Chapa initialization

Expected Result

```
201 Created
```

Example Response

```json
{
    "message": "Checkout initialized successfully.",
    "order_id": "...",
    "payment_id": "...",
    "checkout_url": "..."
}
```

---

# Payment Testing

## Payment Initialization

Verified

- Payment creation
- Provider selection
- Checkout URL generation

Expected Result

```
Payment Created
```

---

## Chapa Sandbox

Verified

- API key
- Hosted payment page
- Checkout URL

Example

```
https://checkout.chapa.co/...
```

---

## Webhook Testing

Endpoint

```
POST /api/payments/webhook/
```

Manual Payload

```json
{
    "tx_ref":"payment_uuid",
    "status":"success"
}
```

Verified

- Payment success
- Payment failure
- Idempotency
- Order update
- Inventory confirmation

Expected Result

```json
{
    "message":"Webhook processed"
}
```

---

# Order Testing

## Order List

Verified

- User filtering
- Pagination readiness
- Order serialization

Expected Result

```
200 OK
```

---

## Order Detail

Verified

- Snapshot integrity
- Order items
- Totals
- Status

Expected Result

```
200 OK
```

---

# Inventory Testing

Inventory management was tested extensively.

Verified

## Reservation

During checkout

```
Stock
↓

Reserved Stock
```

Verified

- Reservation amount
- Multiple products
- Concurrent requests

---

## Confirmation

After payment success

Verified

```
Reserved Stock
↓

Actual Stock
```

---

## Release

Payment failed

Verified

```
Reserved Stock

↓

Available Stock
```

---

# Order Lifecycle Testing

Verified transitions

```
Pending
↓

Processing
↓

Shipped
↓

Delivered
```

Failure path

```
Pending

↓

Cancelled
```

Invalid transitions correctly raise exceptions.

---

# Admin Panel Testing

Verified

- Product management
- Categories
- Variants
- Media
- Orders
- Order Items
- Payments
- Cart
- Users

---

# Database Verification

After every major operation the PostgreSQL database was inspected.

Verified

- User creation
- Cart creation
- Order creation
- Payment creation
- Inventory updates
- Foreign key relationships

---

# Error Handling Tests

The following error cases were intentionally tested.

Authentication

```
401 Unauthorized
```

Invalid Product

```
404 Not Found
```

Missing Fields

```
400 Bad Request
```

Insufficient Stock

```
Business Validation Error
```

Duplicate Payment

```
Ignored via Idempotency
```

---

# Bugs Encountered

During development several important bugs were discovered and fixed.

## Product Detail 404

Problem

```
UUID requested
```

Cause

```
Endpoint expected slug
```

Solution

```
Use slug lookup
```

---

## Missing PaymentService Method

Problem

```
initialize_gateway()
```

Cause

```
Legacy service call remained after payment refactoring.
```

Solution

Payment initialization logic was moved into CheckoutService.

---

## Chapa API Key

Problem

```
Invalid API Key
```

Cause

Incorrect environment variable loading.

Solution

Proper `.env` loading with django-environ.

---

## Chapa Response Parsing

Problem

```
KeyError: tx_ref
```

Cause

Sandbox API returned only `checkout_url`.

Solution

Gateway parser updated to safely handle missing fields.

---

## Inventory Synchronization

Problem

Potential stock inconsistency.

Solution

Implemented three inventory operations:

- Reserve
- Confirm
- Release

---

# Test Coverage Summary

| Module | Status |
|---------|--------|
| Authentication | ✅ Passed |
| Products | ✅ Passed |
| Cart | ✅ Passed |
| Checkout | ✅ Passed |
| Orders | ✅ Passed |
| Payments | ✅ Passed |
| Webhooks | ✅ Passed |
| Inventory | ✅ Passed |
| Admin Panel | ✅ Passed |

---

# Overall Result

The backend successfully passed end-to-end functional testing.

Verified business flow:

```
Register
      ↓
Login
      ↓
Browse Products
      ↓
Add to Cart
      ↓
Checkout
      ↓
Reserve Inventory
      ↓
Create Order
      ↓
Initialize Payment
      ↓
Redirect to Chapa
      ↓
Webhook
      ↓
Confirm Inventory
      ↓
Update Order
      ↓
View Orders
```

This confirms that all major backend components operate correctly together and are ready for frontend integration.