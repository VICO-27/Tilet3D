# 09. Design Decisions

---

# Overview

This document explains the major architectural and engineering decisions made during the development of the Tilet3D backend.

Rather than simply documenting what the system does, it explains why specific approaches were chosen and what benefits they provide.

These decisions improve maintainability, scalability, consistency, and long-term extensibility.

---

# Service Layer Architecture

## Decision

Business logic is implemented inside dedicated service classes instead of API views.

Examples:

```
CheckoutService
PaymentService
InventoryService
OrderNumberService
```

---

## Why?

APIView classes should only be responsible for:

- Receiving HTTP requests
- Validating input
- Calling business services
- Returning HTTP responses

They should not contain business rules.

---

## Benefits

- Easier testing
- Better separation of concerns
- Reusable business logic
- Cleaner API views
- Easier maintenance

---

## Example

Instead of:

```
APIView

↓

Validate

↓

Reserve Stock

↓

Create Order

↓

Create Payment

↓

Initialize Gateway

↓

Return Response
```

The API view simply performs:

```
APIView

↓

CheckoutService.checkout()

↓

Response
```

---

# Gateway Pattern

## Decision

Payment providers are isolated behind gateway classes.

Examples:

```
ChapaGateway

TelebirrGateway

StripeGateway
```

---

## Why?

Each payment provider exposes different APIs.

Keeping provider-specific code inside gateway classes prevents the rest of the application from depending on external APIs.

---

## Benefits

- Easer provider replacement
- Cleaner code
- Better testing
- Reduced coupling

---

# Gateway Factory Pattern

## Decision

A factory selects the correct payment gateway.

```
GatewayFactory

↓

Provider

↓

Gateway
```

---

## Why?

Without a factory, the application would require multiple conditional statements.

```
if provider == "chapa":
    ...

elif provider == "telebirr":
    ...

elif provider == "stripe":
    ...
```

As the number of providers grows, maintenance becomes increasingly difficult.

---

## Benefits

- Extensible architecture
- Cleaner code
- Open/Closed Principle
- Easy addition of new providers

---

# Inventory Reservation

## Decision

Inventory is reserved during checkout but deducted only after successful payment.

---

## Why?

Immediately decreasing stock during checkout creates problems if the customer abandons payment.

The system instead maintains two quantities:

```
Stock

Reserved Stock
```

Checkout moves items into reserved stock.

Successful payment confirms the reservation.

Failed payment releases the reservation.

---

## Benefits

- Prevents overselling
- Handles abandoned payments
- Supports concurrent checkout safely

---

# Snapshot Strategy

## Decision

Order items store copies of product information.

Each OrderItem stores:

- Product Name
- Variant Name
- SKU
- Color
- Size
- Price

instead of referencing only the Product table.

---

## Why?

Product data changes over time.

For example:

Today

```
Price = 3500 ETB
```

Tomorrow

```
Price = 4200 ETB
```

Historical orders must continue displaying the original purchase price.

---

## Benefits

- Accurate invoices
- Financial integrity
- Auditability
- Historical consistency

---

# UUID Primary Keys

## Decision

All major models use UUID primary keys.

Examples:

- User
- Product
- Variant
- Order
- Payment

---

## Why?

Sequential integer IDs expose implementation details and are predictable.

UUIDs provide:

- Better security
- Global uniqueness
- Easier distributed systems support

---

## Benefits

- Harder to enumerate resources
- Suitable for microservices
- Safer public APIs

---

# Human-Friendly Order Numbers

## Decision

Orders use UUIDs internally but expose readable order numbers.

Example

```
TLT-20260710-000001
```

---

## Why?

UUIDs are not suitable for customer support.

Readable order numbers improve communication between:

- Customers
- Support staff
- Warehouse personnel

---

## Benefits

- Easy searching
- Better user experience
- Easier manual tracking

---

# State Machine Architecture

## Decision

Order status changes are managed through a lifecycle service.

Example

```
OrderLifecycle.transition(...)
```

instead of directly assigning

```
order.status = ...
```

---

## Why?

Orders should not move between arbitrary states.

Example

```
Delivered

↓

Pending
```

must never be allowed.

---

## Benefits

- Valid state transitions
- Consistent business rules
- Easier maintenance

---

# Payment State Machine

## Decision

Payments maintain their own lifecycle independent of orders.

Possible statuses include:

- Pending
- Initiated
- Success
- Failed
- Cancelled
- Refunded

---

## Why?

Orders and payments represent different business concepts.

Example

```
Order

Processing

Payment

Paid
```

or

```
Order

Cancelled

Payment

Refunded
```

---

## Benefits

- Flexible business workflows
- Better accounting
- Easier refunds

---

# Transaction Management

## Decision

Critical operations execute inside database transactions.

Example

```
transaction.atomic()
```

---

## Why?

Checkout modifies multiple tables:

- Cart
- Order
- OrderItem
- Payment
- Inventory

If one operation fails, the database must remain consistent.

---

## Benefits

- Atomic operations
- No partial orders
- Data consistency

---

# Row-Level Locking

## Decision

Checkout uses

```
select_for_update()
```

to lock rows during critical operations.

---

## Why?

Without locking, simultaneous checkout requests could reserve the same inventory.

---

## Benefits

- Prevents race conditions
- Protects inventory
- Ensures consistency

---

# Idempotent Webhooks

## Decision

Payment webhooks are processed only once.

---

## Why?

Payment providers may retry webhook delivery.

Without idempotency:

- Inventory could be deducted twice.
- Orders could be updated multiple times.
- Duplicate events could occur.

---

## Benefits

- Safe retries
- Consistent payment processing
- No duplicate inventory updates

---

# Modular Django Apps

## Decision

The project is divided into independent Django applications.

Current modules include:

- Accounts
- Products
- Cart
- Orders
- Payments
- Common

---

## Why?

Each application owns a specific business domain.

---

## Benefits

- Clear boundaries
- Easier maintenance
- Better scalability
- Independent testing

---

# Configuration Management

## Decision

Environment-specific settings are separated.

```
base.py

development.py

production.py
```

Secrets are stored in:

```
.env
```

---

## Why?

Configuration should never be hardcoded.

---

## Benefits

- Secure credentials
- Environment flexibility
- Production readiness

---

# JWT Authentication

## Decision

Authentication uses JSON Web Tokens (JWT).

---

## Why?

The frontend is built as a separate React application.

JWT provides stateless authentication suitable for APIs.

---

## Benefits

- Scalable authentication
- Mobile-friendly
- No server-side sessions
- Easy frontend integration

---

# RESTful API Design

## Decision

The backend follows REST principles.

Examples:

```
GET

POST

PATCH

DELETE
```

Resources are exposed through predictable endpoints.

---

## Benefits

- Familiar developer experience
- Easy frontend integration
- Consistent API behavior

---

# Admin Interface

## Decision

Every major business entity is registered in Django Admin.

Examples:

- Products
- Orders
- Payments
- Users
- Cart

---

## Why?

The admin panel serves as an operational dashboard for developers and administrators.

---

## Benefits

- Faster debugging
- Easier data management
- Operational visibility

---

# Summary

The architecture emphasizes:

- Separation of concerns
- Modularity
- Scalability
- Transaction safety
- Maintainability
- Extensibility
- Consistent business rules
- Clean API design

These decisions provide a solid foundation for future features such as AI-powered virtual try-on, recommendation systems, multiple payment providers, seller accounts, analytics, and microservice extraction if the platform grows.