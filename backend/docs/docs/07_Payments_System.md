# 07. Payments System

---

# Payments Module

Location

```
apps/payments/
```

The Payments module is responsible for managing the complete payment lifecycle of an order.

Unlike the Orders module, which manages purchases, the Payments module manages the movement of money between the customer and the business.

Its responsibilities include:

- Creating payment records
- Initializing payment gateways
- Receiving webhook callbacks
- Updating payment status
- Synchronizing order status
- Confirming inventory after successful payment
- Releasing reserved inventory after failed payment
- Providing a gateway abstraction for multiple payment providers

The module was designed to separate business logic from external payment providers, making it easy to integrate additional gateways in the future.

---

# High-Level Payment Flow

```
Checkout

↓

Create Payment Record

↓

Initialize Payment Gateway

↓

Return Checkout URL

↓

Customer Pays

↓

Gateway Sends Webhook

↓

Validate Webhook

↓

Update Payment

↓

Update Order

↓

Confirm Inventory
```

The frontend never marks a payment as successful.

Only the payment provider can do that through the webhook.

---

# Architecture

The payment system is divided into multiple layers.

```
API Views

↓

Payment Service

↓

Gateway Factory

↓

Payment Gateway

↓

External Provider
```

Each layer has a single responsibility.

---

# Responsibilities

## API Layer

Responsible for:

- Request validation
- Authentication
- Calling services
- Returning HTTP responses

No business logic exists inside API views.

---

## Payment Service

Responsible for:

- Creating payments
- Updating payment status
- Updating orders
- Confirming inventory
- Releasing inventory

This is the business logic layer.

---

## Gateway Layer

Responsible only for communicating with payment providers.

Examples:

- Chapa
- Telebirr
- Stripe
- PayPal

The gateway never modifies the database.

It only sends and receives HTTP requests.

---

# Payment Model

Each payment stores:

- UUID
- User
- Order
- Amount
- Currency
- Provider
- Payment Status
- Transaction ID
- Checkout URL
- Webhook Status
- Raw Webhook Payload
- Created Date
- Updated Date

The payment record becomes the source of truth for all money-related operations.

---

# Payment Status State Machine

Current statuses:

```
Pending

↓

Initiated

↓

Success
```

Possible failure path:

```
Pending

↓

Initiated

↓

Failed
```

Other supported states:

```
Cancelled

Refunded
```

Using Django TextChoices guarantees consistent values across the application.

Example

```python
class PaymentStatus(models.TextChoices):
    PENDING = "pending"
    INITIATED = "initiated"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
```

---

# Payment Creation

When checkout completes successfully, a payment record is created.

```
PaymentService.create_payment(...)
```

The payment initially stores:

- user
- order
- amount
- currency
- provider

Status

```
Initiated
```

No money has been transferred yet.

---

# Gateway Initialization

After creating the payment, the gateway is initialized.

```
GatewayFactory.get_gateway(provider)
```

The factory returns the appropriate implementation.

Example

```
Provider

↓

GatewayFactory

↓

ChapaGateway
```

This pattern allows adding new providers without modifying checkout logic.

---

# Why Use a Gateway Factory?

Without a factory:

```
if provider == "chapa":
    ...

elif provider == "telebirr":
    ...

elif provider == "stripe":
    ...
```

As more providers are added, checkout becomes difficult to maintain.

Instead:

```
GatewayFactory

↓

Correct Gateway
```

The CheckoutService never needs to know which provider is being used.

---

# Chapa Gateway

Location

```
apps/payments/gateways/chapa.py
```

Responsibilities:

- Build HTTP request
- Send request
- Parse response
- Return checkout URL

The gateway never:

- Creates database records
- Updates payment status
- Updates orders
- Confirms inventory

It is intentionally isolated from business logic.

---

# Payment Initialization Request

The gateway sends:

- Amount
- Currency
- Customer Email
- Transaction Reference
- Callback URL

Example payload

```json
{
    "amount": "3500.00",
    "currency": "ETB",
    "email": "customer@example.com",
    "tx_ref": "payment_uuid",
    "callback_url": "http://localhost:8000/api/payments/webhook/"
}
```

---

# Gateway Response

Example

```json
{
    "status": "success",
    "data": {
        "checkout_url": "https://checkout.chapa.co/..."
    }
}
```

The gateway extracts:

- checkout_url

The transaction reference is already known because it was generated before sending the request.

---

# Checkout Response

The frontend receives:

```json
{
    "message": "Checkout initialized successfully.",
    "order_id": "...",
    "payment_id": "...",
    "checkout_url": "https://checkout.chapa.co/..."
}
```

The frontend redirects the user to Chapa.

---

# Payment Webhook

Endpoint

```
POST /api/payments/webhook/
```

The webhook is called by Chapa after payment is completed.

This endpoint is public.

Authentication is disabled because payment providers cannot authenticate using JWT.

---

# Webhook Processing

The webhook receives data similar to:

```json
{
    "tx_ref": "...",
    "status": "success"
}
```

The system then:

1. Finds the payment
2. Stores the webhook payload
3. Checks idempotency
4. Marks payment
5. Updates order
6. Updates inventory

---

# Idempotency

One of the most important design decisions.

Payment providers may send the same webhook multiple times.

Example

```
Webhook

↓

Success

↓

Network Timeout

↓

Gateway Retries

↓

Same Webhook Again
```

Without idempotency:

- Inventory deducted twice
- Orders updated twice
- Duplicate business events

The system prevents this.

Example

```python
if payment.status == PaymentStatus.SUCCESS:
    return
```

This guarantees that successful payments are processed only once.

---

# Successful Payment

When payment succeeds:

```
PaymentService.mark_success(...)
```

Business actions:

- Payment → Success
- Order Payment Status → Paid
- Order Status → Processing
- Confirm reserved inventory

Inventory permanently decreases only after successful payment.

---

# Failed Payment

When payment fails:

```
PaymentService.mark_failed(...)
```

Business actions:

- Payment → Failed
- Order Payment Status → Failed
- Order Status → Cancelled
- Reserved inventory released

This ensures products become available for other customers.

---

# Inventory Synchronization

Successful payment

```
Reserved Stock

↓

Stock Sold
```

Failed payment

```
Reserved Stock

↓

Available Stock
```

This reservation-confirmation workflow prevents overselling while avoiding premature stock reduction.

---

# Transaction Safety

Critical operations use

```python
transaction.atomic()
```

and

```python
select_for_update()
```

This prevents race conditions during concurrent webhook processing.

---

# API Endpoints

## Create Payment

```
POST /api/payments/create/
```

Creates a payment and initializes the selected gateway.

---

## Payment Webhook

```
POST /api/payments/webhook/
```

Processes gateway notifications.

---

# Admin Panel

The Django Admin provides tools for monitoring payments.

Administrators can:

- View payments
- Filter by provider
- Filter by payment status
- Search by payment ID
- Search by transaction ID
- Search by customer email

This simplifies debugging and operational monitoring.

---

# Design Decisions

Several architectural decisions shaped the payment system.

## Service Layer

Business logic is centralized inside PaymentService.

---

## Gateway Isolation

External APIs are isolated from business logic.

---

## Gateway Factory Pattern

Supports multiple payment providers without changing checkout code.

---

## Idempotent Webhooks

Repeated webhooks never duplicate business actions.

---

## Deferred Inventory Deduction

Inventory is confirmed only after payment succeeds.

---

## Atomic Transactions

Critical payment operations execute as a single database transaction.

---

# Future Improvements

Planned enhancements include:

- Chapa payment verification API
- Telebirr integration
- Stripe integration
- PayPal integration
- Refund processing
- Partial refunds
- Payment retries
- Payment expiration
- Webhook signature verification
- Payment analytics dashboard
- Multi-currency support
- Asynchronous webhook processing using Celery