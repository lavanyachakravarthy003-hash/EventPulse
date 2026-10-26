# EventPulse: Multi-Tenant Event & Ticket Reservation System

EventPulse is a multi-tenant event management and ticket reservation platform built with React, Vite, Node.js, Express, PostgreSQL, Prisma, and Redis. It is engineered to handle heavy concurrent booking spikes without double-booking seats through atomic transactions and row locking, with a 10-minute temporary reservation hold engine, asynchronous payment gateway simulation, and real-time organizer analytics.

---

## 1. System Architecture & Core Problem Solutions

### Concurrent Booking Protection (0% Double-Booking Guarantee)
- **Problem**: When 100 users attempt to purchase the last 3 tickets for a popular festival or keynote at the exact same millisecond, standard database queries suffer from race conditions where multiple requests read available capacity before updating it, resulting in oversold seats.
- **Solution**: We implement transactional row locking (`SELECT * FROM "TicketTier" WHERE id = $1 FOR UPDATE`) combined with atomic in-memory mutex queues. The transaction atomically validates that `totalCapacity - (soldCount + heldCount) >= requestedQuantity`, increments `heldCount`, and generates a hold record. Any request exceeding capacity is rejected with `409 Conflict`.

### 10-Minute Temporary Reservation Holds
- When an attendee selects seats, an atomic hold is placed with `expiresAt = now() + 10 minutes`.
- The seats are removed from general availability while the customer completes payment details.
- If checkout is completed within 10 minutes, the hold is marked `COMPLETED`, `heldCount` is decremented, and `soldCount` is incremented.

### Background Cron Worker (Expired Hold Release)
- A background worker runs every 5 seconds checking for any reservation where `status = 'HELD'` and `now() >= expiresAt`.
- Expired seats are returned to general inventory atomically, and the Redis cache is invalidated.

### Caching Layer with Redis
- High-read event listings and tier availabilities are cached in Redis with a 30-second TTL.
- Cache invalidation triggers automatically upon hold creation, hold expiration, cancellation, or checkout completion.

---

## 2. Entity Relationship (ER) Data Model

```mermaid
erDiagram
    USERS ||--o{ EVENTS : "organizes (1:N)"
    USERS ||--o{ RESERVATION_HOLDS : "holds (1:N)"
    USERS ||--o{ ORDERS : "purchases (1:N)"

    EVENTS ||--o{ TICKET_TIERS : "offers (1:N)"
    EVENTS ||--o{ RESERVATION_HOLDS : "applies_to (1:N)"
    EVENTS ||--o{ ORDERS : "associated_with (1:N)"

    TICKET_TIERS ||--o{ RESERVATION_HOLDS : "locks (1:N)"
    TICKET_TIERS ||--o{ ORDERS : "ordered_in (1:N)"
    TICKET_TIERS ||--o{ TICKETS : "tier_type (1:N)"

    RESERVATION_HOLDS ||--o| ORDERS : "converts_to (1:1)"
    ORDERS ||--o{ TICKETS : "contains (1:N)"
    ORDERS ||--|| TRANSACTIONS : "settles (1:1)"

    USERS {
        uuid id PK
        string email UK
        string passwordHash
        string name
        enum role "ADMIN | ORGANIZER | ATTENDEE"
        string organizationName
        datetime createdAt
    }

    EVENTS {
        uuid id PK
        uuid organizerId FK
        string title
        text description
        string category
        string location
        string venueName
        datetime startDate
        datetime salesCutoffDate
        string status "ACTIVE | DRAFT | COMPLETED"
        int viewsCount
    }

    TICKET_TIERS {
        uuid id PK
        uuid eventId FK
        string name "VIP | General | Early Bird"
        decimal price
        int totalCapacity
        int heldCount "atomic 10-min hold"
        int soldCount "confirmed orders"
        datetime salesCutoffDate
        string[] perks
    }

    RESERVATION_HOLDS {
        uuid id PK
        uuid userId FK
        uuid eventId FK
        uuid tierId FK
        int quantity
        string status "HELD | EXPIRED | COMPLETED"
        datetime expiresAt "now() + 10 mins"
    }

    ORDERS {
        uuid id PK
        string orderNumber UK
        uuid userId FK
        uuid eventId FK
        uuid tierId FK
        uuid reservationId FK
        int quantity
        decimal totalAmount
        string status "PAID | CANCELLED"
    }

    TICKETS {
        uuid id PK
        uuid orderId FK
        uuid tierId FK
        string ticketCode UK
        string attendeeName
        string qrCodeValue UK
        string status "VALID | CHECKED_IN"
    }

    TRANSACTIONS {
        uuid id PK
        uuid orderId FK
        string paymentGateway "STRIPE_SIMULATOR"
        string transactionRef UK
        decimal amount
        string status "SUCCESS | DECLINED | TIMEOUT"
        string authCode
        int simulatedLatencyMs
    }
```

---

## 3. Quick Start on Windows in VS Code

### Prerequisites
1. **Node.js**: Install v20 LTS or v22 LTS from [nodejs.org](https://nodejs.org).
2. **VS Code**: Install from [code.visualstudio.com](https://code.visualstudio.com).
3. **PostgreSQL & Redis**: Install locally on Windows or run via Docker Desktop:
   ```bash
   docker compose up -d
   ```

### Setup Steps (PowerShell)
```powershell
# 1. Clone or open the project folder
cd eventpulse

# 2. Install dependencies
npm install

# 3. Configure environment variables in .env
# Copy from .env.example
cp .env.example .env

# 4. Run Prisma database migrations
npx prisma migrate dev --name init

# 5. Seed the database with demo users and events
npx prisma db seed

# 6. Start full-stack development server (Express backend + Vite frontend)
npm run dev
```


---



