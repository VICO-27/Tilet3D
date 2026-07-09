# Backend Architecture

**Project:** Tilet3D Backend  
**Document Version:** 1.0  
**Last Updated:** July 2026

---

# Table of Contents

1. Architecture Overview
2. Architectural Goals
3. Layered Architecture
4. Application Structure
5. Request Lifecycle
6. Service Layer
7. Data Flow
8. Transactions
9. Inventory Architecture
10. Payment Architecture
11. Design Principles
12. Scalability
13. Future Architecture

---

# 1. Architecture Overview

Tilet3D Backend follows a **Layered Modular Architecture**.

The project is organized into independent Django applications, where each application owns its own models, API endpoints, serializers, admin configuration, and business logic.

Unlike a traditional Django project where business logic often lives inside views, Tilet3D separates responsibilities into dedicated service classes.

This results in a backend that is:

- Modular
- Maintainable
- Scalable
- Easy to test
- Easy to extend

---

# 2. Architectural Goals

The architecture was designed around several engineering goals.

## Separation of Concerns

Each layer has a single responsibility.

- Views handle HTTP requests.
- Serializers validate incoming data.
- Services contain business logic.
- Models represent persistent data.

Business rules never live inside API views.

---

## Modularity

Each business domain is isolated into its own Django application.

```
accounts/
products/
cart/
orders/
payments/
common/
services/
```

Every application can evolve independently.

---

## Reusability

Business services are reusable from:

- REST APIs
- Management commands
- Scheduled jobs
- Future GraphQL APIs
- Background workers

For example, checkout logic is written once inside `CheckoutService` and can be reused from multiple entry points.

---

## Scalability

The architecture allows future expansion without major refactoring.

Examples include:

- Multiple payment providers
- Seller accounts
- AI services
- Notification systems
- Recommendation engine
- Analytics

---

# 3. Layered Architecture

The backend follows five logical layers.

```
                 Client
                    │
                    ▼
          Django REST Framework
                    │
                    ▼
             API Views Layer
                    │
                    ▼
          Serializer Validation
                    │
                    ▼
            Business Services
                    │
                    ▼
              Django Models
                    │
                    ▼
               PostgreSQL
```

Each layer communicates only with the layer immediately below it.

---

# 4. Application Structure

## Accounts

Responsibilities

- Registration
- Login
- JWT
- Google OAuth
- User Profiles

---

## Products

Responsibilities

- Categories
- Products
- Variants
- Images
- Videos
- Likes
- Comments
- Shares

---

## Cart

Responsibilities

- Shopping cart
- Cart items
- Quantity updates

---

## Orders

Responsibilities

- Checkout
- Order creation
- Order snapshots
- Order lifecycle

---

## Payments

Responsibilities

- Payment records
- Gateway communication
- Webhook processing

---

## Common

Shared reusable components.

Examples

- BaseModel
- Utility functions

---

## Services

Reserved for advanced AI functionality.

Examples

- Rendering
- Avatar generation
- Optimization
- Telemetry

---

# 5. Request Lifecycle

A typical request follows this path.

```
HTTP Request

↓

URL Routing

↓

APIView

↓

Serializer

↓

Business Service

↓

Database

↓

Serializer

↓

HTTP Response
```

The service layer acts as the center of the backend.

---

# 6. Service Layer

The service layer contains all important business rules.

Current services include

```
CheckoutService

↓

InventoryService

↓

PaymentService

↓

OrderNumberService

↓

GatewayFactory
```

Each service performs one well-defined responsibility.

---

## CheckoutService

Responsible for

- validating cart
- reserving inventory
- creating orders
- creating order items
- initializing payment

---

## InventoryService

Responsible for

- reserve stock
- release stock
- confirm stock

Inventory rules are centralized here instead of being duplicated.

---

## PaymentService

Responsible for

- payment creation
- payment state changes
- order synchronization
- inventory synchronization

External payment APIs are intentionally excluded from this service.

---

## GatewayFactory

Responsible for selecting the correct payment gateway.

Example

```
GatewayFactory

↓

ChapaGateway

↓

Future StripeGateway

↓

Future TelebirrGateway
```

This keeps payment providers interchangeable.

---

# 7. Data Flow

## Product Purchase

```
User

↓

Product

↓

Cart

↓

Checkout

↓

Inventory Reserved

↓

Order Created

↓

Payment Created

↓

Payment Gateway

↓

Webhook

↓

Payment Confirmed

↓

Inventory Confirmed

↓

Order Processing
```

This flow guarantees consistency between inventory, payments, and orders.

---

# 8. Database Transactions

Critical operations use Django database transactions.

Example

```
Checkout

↓

Reserve Inventory

↓

Create Order

↓

Create Items

↓

Initialize Payment
```

If any step fails, the transaction rolls back automatically.

Benefits

- No partial orders
- No orphan records
- No inconsistent inventory

---

# 9. Inventory Architecture

Inventory is divided into two values.

```
Stock

Reserved Stock
```

Example

```
Stock = 20

Reserved = 3

Available = 17
```

Checkout reserves inventory immediately.

Successful payment confirms inventory.

Failed payment releases inventory.

This approach prevents overselling.

---

# 10. Payment Architecture

The payment system is intentionally separated.

```
Checkout

↓

PaymentService

↓

GatewayFactory

↓

ChapaGateway

↓

Chapa API
```

The gateway is responsible only for HTTP communication.

Business rules remain inside the backend.

---

# 11. Design Principles

The backend follows several engineering principles.

## Single Responsibility Principle

Each class has one responsibility.

Example

```
CheckoutService

ONLY checkout.
```

```
InventoryService

ONLY inventory.
```

```
PaymentService

ONLY payments.
```

---

## Dependency Inversion

Business logic depends on abstractions instead of payment providers.

```
PaymentService

↓

GatewayFactory

↓

Gateway Interface

↓

Chapa
```

Future gateways can be added without modifying checkout logic.

---

## DRY

Business rules are written once.

Inventory calculations exist only inside InventoryService.

Checkout logic exists only inside CheckoutService.

Payment synchronization exists only inside PaymentService.

---

## Snapshot Strategy

Orders store product information at purchase time.

Example

```
Product Name

Variant Name

Price

Color

Size

SKU
```

Even if a product changes later, historical orders remain accurate.

---

# 12. Scalability

The architecture is prepared for future features.

Examples

```
Celery

↓

Redis

↓

Background Jobs
```

```
Recommendation Engine
```

```
3D Avatar Generation
```

```
Notification Service
```

```
Seller Dashboard
```

```
Multiple Warehouses
```

```
AI Size Recommendation
```

Minimal changes to the existing architecture will be required.

---

# 13. Future Architecture

The long-term architecture will expand into additional services.

```
Frontend

↓

REST API

↓

Business Services

↓

AI Services

↓

Recommendation Engine

↓

3D Rendering

↓

Virtual Try-On

↓

Machine Learning Models
```

The current backend has been intentionally designed so these services can be added without major refactoring.

---

# Conclusion

The Tilet3D backend adopts a layered, service-oriented architecture that separates presentation, validation, business logic, and persistence into distinct components.

This architecture improves maintainability, reduces code duplication, simplifies testing, and provides a scalable foundation for future AI-powered capabilities such as virtual try-on, body measurement analysis, and personalized recommendations while maintaining clean separation between business logic and external integrations.