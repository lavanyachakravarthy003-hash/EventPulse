export function getPrismaSchema(): string {
  return `// Prisma Schema for Multi-Tenant Event & Ticket Reservation System
// Database: PostgreSQL with Atomic Transactions and Row Locking

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  ORGANIZER
  ATTENDEE
}

enum EventStatus {
  DRAFT
  ACTIVE
  COMPLETED
  CANCELLED
}

enum HoldStatus {
  HELD
  EXPIRED
  COMPLETED
  CANCELLED
}

enum OrderStatus {
  PENDING
  PAID
  FAILED
  CANCELLED
}

enum TicketStatus {
  VALID
  CHECKED_IN
  REFUNDED
}

enum PaymentStatus {
  SUCCESS
  DECLINED
  TIMEOUT
}

model User {
  id               String            @id @default(uuid())
  email            String            @unique
  passwordHash     String
  name             String
  role             Role              @default(ATTENDEE)
  organizationName String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  events           Event[]           @relation("OrganizerEvents")
  reservations     ReservationHold[]
  orders           Order[]

  @@index([role])
}

model Event {
  id              String            @id @default(uuid())
  organizerId     String
  organizer       User              @relation("OrganizerEvents", fields: [organizerId], references: [id], onDelete: Cascade)
  title           String
  description     String            @db.Text
  category        String
  location        String
  venueName       String
  imageUrl        String
  startDate       DateTime
  endDate         DateTime
  salesCutoffDate DateTime
  status          EventStatus       @default(ACTIVE)
  viewsCount      Int               @default(0)
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  tiers           TicketTier[]
  reservations    ReservationHold[]
  orders          Order[]

  @@index([organizerId])
  @@index([status, salesCutoffDate])
}

model TicketTier {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id], onDelete: Cascade)
  name            String
  description     String?           @db.Text
  price           Decimal           @db.Decimal(10, 2)
  totalCapacity   Int
  heldCount       Int               @default(0) // incremented on 10-min hold
  soldCount       Int               @default(0) // incremented on confirmed checkout
  salesCutoffDate DateTime
  perks           String[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  reservations    ReservationHold[]
  orders          Order[]
  tickets         Ticket[]

  @@index([eventId])
}

model ReservationHold {
  id             String      @id @default(uuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId        String
  event          Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tierId         String
  tier           TicketTier  @relation(fields: [tierId], references: [id], onDelete: Cascade)
  quantity       Int
  status         HoldStatus  @default(HELD)
  expiresAt      DateTime    // Set to now() + 10 minutes
  createdAt      DateTime    @default(now())

  order          Order?

  @@index([status, expiresAt])
  @@index([userId, status])
  @@index([tierId, status])
}

model Order {
  id              String           @id @default(uuid())
  orderNumber     String           @unique // e.g. ORD-2026-8819
  userId          String
  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventId         String
  event           Event            @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tierId          String
  tier            TicketTier       @relation(fields: [tierId], references: [id], onDelete: Cascade)
  reservationId   String?          @unique
  reservation     ReservationHold? @relation(fields: [reservationId], references: [id])
  quantity        Int
  totalAmount     Decimal          @db.Decimal(10, 2)
  status          OrderStatus      @default(PAID)
  createdAt       DateTime         @default(now())

  tickets         Ticket[]
  transaction     Transaction?

  @@index([userId])
  @@index([eventId])
}

model Ticket {
  id             String       @id @default(uuid())
  orderId        String
  order          Order        @relation(fields: [orderId], references: [id], onDelete: Cascade)
  tierId         String
  tier           TicketTier   @relation(fields: [tierId], references: [id], onDelete: Cascade)
  ticketCode     String       @unique // e.g. TKT-EVP-84920
  attendeeName   String
  qrCodeValue    String       @unique
  status         TicketStatus @default(VALID)
  createdAt      DateTime     @default(now())

  @@index([orderId])
  @@index([ticketCode])
}

model Transaction {
  id                 String         @id @default(uuid())
  orderId            String         @unique
  order              Order          @relation(fields: [orderId], references: [id], onDelete: Cascade)
  paymentGateway     String         @default("STRIPE_SIMULATOR")
  transactionRef     String         @unique
  amount             Decimal        @db.Decimal(10, 2)
  currency           String         @default("USD")
  status             PaymentStatus  @default(SUCCESS)
  authCode           String
  paymentMethod      String
  simulatedLatencyMs Int
  createdAt          DateTime       @default(now())

  @@index([orderId])
  @@index([transactionRef])
}
`;
}

export function getPostmanCollectionJson(appUrl: string = 'http://localhost:3000'): object {
  return {
    info: {
      name: 'EventPulse - Multi-Tenant Event & Ticket Reservation API',
      _postman_id: 'e6b54a20-3dfa-4933-bf9a-7c92bdf33119',
      description:
        'Complete Postman Collection testing all REST endpoints of the Multi-Tenant Event & Ticket Reservation System, including RBAC, Redis caching, 10-minute reservation holds, concurrent booking race condition stress-testing (409 Conflict), and hold expiration edge cases.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    variable: [
      { key: 'baseUrl', value: appUrl, type: 'string' },
      { key: 'adminToken', value: '', type: 'string' },
      { key: 'organizerToken', value: '', type: 'string' },
      { key: 'attendeeToken', value: '', type: 'string' },
      { key: 'testEventId', value: 'evt_tech_2026', type: 'string' },
      { key: 'testTierId', value: 'tier_tech_early', type: 'string' },
      { key: 'activeHoldId', value: '', type: 'string' },
    ],
    item: [
      {
        name: '1. Authentication & RBAC',
        item: [
          {
            name: 'Login as Attendee (Alice)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'alice@gmail.com', password: 'Password123!' }, null, 2),
              },
              url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                    'var jsonData = pm.response.json();',
                    'pm.collectionVariables.set("attendeeToken", jsonData.token);',
                    'pm.test("Role is ATTENDEE", function () { pm.expect(jsonData.user.role).to.eql("ATTENDEE"); });',
                  ],
                },
              },
            ],
          },
          {
            name: 'Login as Organizer (Sarah)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify({ email: 'sarah@summitcorp.io', password: 'Password123!' }, null, 2),
              },
              url: { raw: '{{baseUrl}}/api/auth/login', host: ['{{baseUrl}}'], path: ['api', 'auth', 'login'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                    'var jsonData = pm.response.json();',
                    'pm.collectionVariables.set("organizerToken", jsonData.token);',
                    'pm.test("Role is ORGANIZER", function () { pm.expect(jsonData.user.role).to.eql("ORGANIZER"); });',
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        name: '2. Events & Redis Caching',
        item: [
          {
            name: 'Get All Active Events (Redis Cached)',
            request: {
              method: 'GET',
              header: [],
              url: { raw: '{{baseUrl}}/api/events', host: ['{{baseUrl}}'], path: ['api', 'events'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status is 200 OK", function () { pm.response.to.have.status(200); });',
                    'pm.test("Returns X-Cache header", function () { pm.expect(pm.response.headers.has("X-Cache")).to.be.true; });',
                  ],
                },
              },
            ],
          },
          {
            name: 'Get Event Details by ID',
            request: {
              method: 'GET',
              header: [],
              url: { raw: '{{baseUrl}}/api/events/{{testEventId}}', host: ['{{baseUrl}}'], path: ['api', 'events', '{{testEventId}}'] },
            },
          },
        ],
      },
      {
        name: '3. Reservation Engine (10-Minute Hold)',
        item: [
          {
            name: 'Place 10-Minute Hold (Atomic Concurrency Safe)',
            request: {
              method: 'POST',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{attendeeToken}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    eventId: '{{testEventId}}',
                    tierId: '{{testTierId}}',
                    quantity: 1,
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/reservations/hold', host: ['{{baseUrl}}'], path: ['api', 'reservations', 'hold'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status is 201 Created", function () { pm.response.to.have.status(201); });',
                    'var jsonData = pm.response.json();',
                    'pm.collectionVariables.set("activeHoldId", jsonData.reservation.id);',
                    'pm.test("ExpiresAt is set approximately 10 minutes in future", function () {',
                    '  var exp = new Date(jsonData.reservation.expiresAt).getTime();',
                    '  var now = Date.now();',
                    '  pm.expect(exp - now).to.be.above(550000);',
                    '});',
                  ],
                },
              },
            ],
          },
          {
            name: 'Get Active Holds for User',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{attendeeToken}}' }],
              url: { raw: '{{baseUrl}}/api/reservations/active', host: ['{{baseUrl}}'], path: ['api', 'reservations', 'active'] },
            },
          },
        ],
      },
      {
        name: '4. Checkout & Payment Simulation',
        item: [
          {
            name: 'Checkout Active Hold (Success Simulation)',
            request: {
              method: 'POST',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{attendeeToken}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    reservationId: '{{activeHoldId}}',
                    customerName: 'Alice Reynolds',
                    customerEmail: 'alice@gmail.com',
                    paymentSimulationMode: 'SUCCESS',
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/checkout', host: ['{{baseUrl}}'], path: ['api', 'checkout'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                    'var jsonData = pm.response.json();',
                    'pm.test("Order is PAID", function () { pm.expect(jsonData.order.status).to.eql("PAID"); });',
                    'pm.test("Tickets generated with valid QR codes", function () { pm.expect(jsonData.order.tickets.length).to.be.above(0); });',
                  ],
                },
              },
            ],
          },
          {
            name: 'Checkout Simulation: Card Declined (Edge Case)',
            request: {
              method: 'POST',
              header: [
                { key: 'Content-Type', value: 'application/json' },
                { key: 'Authorization', value: 'Bearer {{attendeeToken}}' },
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    reservationId: '{{activeHoldId}}',
                    customerName: 'Alice Reynolds',
                    customerEmail: 'alice@gmail.com',
                    paymentSimulationMode: 'DECLINED',
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/checkout', host: ['{{baseUrl}}'], path: ['api', 'checkout'] },
            },
          },
        ],
      },
      {
        name: '5. Edge Cases: Race Conditions & Expiry',
        item: [
          {
            name: 'Race Condition Stress Test (Atomic Mutex Simulation)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    tierId: 'tier_tech_early',
                    totalAttempts: 25,
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/simulate/concurrency', host: ['{{baseUrl}}'], path: ['api', 'simulate', 'concurrency'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status code is 200", function () { pm.response.to.have.status(200); });',
                    'var data = pm.response.json();',
                    'pm.test("Zero double bookings occurred", function () { pm.expect(data.doubleBookingsCount).to.eql(0); });',
                    'pm.test("Successful holds equal initial available capacity", function () { pm.expect(data.successfulHolds).to.eql(data.initialAvailable); });',
                  ],
                },
              },
            ],
          },
          {
            name: 'Expired Hold Checkout Rejection (Edge Case)',
            request: {
              method: 'POST',
              header: [{ key: 'Content-Type', value: 'application/json' }],
              body: {
                mode: 'raw',
                raw: JSON.stringify(
                  {
                    reservationId: 'res_seed_expired_test',
                    customerName: 'Late Attendee',
                    customerEmail: 'late@user.com',
                  },
                  null,
                  2
                ),
              },
              url: { raw: '{{baseUrl}}/api/checkout', host: ['{{baseUrl}}'], path: ['api', 'checkout'] },
            },
            event: [
              {
                listen: 'test',
                script: {
                  exec: [
                    'pm.test("Status is 400 Bad Request", function () { pm.response.to.have.status(400); });',
                  ],
                },
              },
            ],
          },
          {
            name: 'Trigger Background Expiry Worker Now',
            request: {
              method: 'POST',
              header: [],
              url: { raw: '{{baseUrl}}/api/worker/tick', host: ['{{baseUrl}}'], path: ['api', 'worker', 'tick'] },
            },
          },
        ],
      },
      {
        name: '6. Organizer Analytics',
        item: [
          {
            name: 'Get Organizer Real-Time Revenue & Conversion Metrics',
            request: {
              method: 'GET',
              header: [{ key: 'Authorization', value: 'Bearer {{organizerToken}}' }],
              url: { raw: '{{baseUrl}}/api/analytics/organizer?organizerId=usr_org_01', host: ['{{baseUrl}}'], path: ['api', 'analytics', 'organizer'], query: [{ key: 'organizerId', value: 'usr_org_01' }] },
            },
          },
        ],
      },
    ],
  };
}

export function getDockerComposeYaml(): string {
  return `version: '3.8'

services:
  # Persistent PostgreSQL Relational Database
  postgres:
    image: postgres:16-alpine
    container_name: eventpulse-postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
      POSTGRES_DB: eventpulse_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d eventpulse_db"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Redis In-Memory Cache and Temporary Hold Store
  redis:
    image: redis:7-alpine
    container_name: eventpulse-redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Full-Stack Application
  app:
    build: .
    container_name: eventpulse-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://postgres:postgrespassword@postgres:5432/eventpulse_db?schema=public"
      REDIS_URL: "redis://redis:6379"
      JWT_SECRET: "eventpulse_production_jwt_secret_key_change_me"
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

volumes:
  postgres_data:
  redis_data:
`;
}
