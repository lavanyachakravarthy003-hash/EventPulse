import {
  User,
  Event,
  TicketTier,
  ReservationHold,
  Order,
  Ticket,
  Transaction,
  OrganizerAnalytics,
  ConcurrencyTestSummary,
  ConcurrencyTestAttempt,
  CacheTelemetry
} from '../types/index.ts';

// -------------------------------------------------------------
// Mutex lock for simulating PostgreSQL SELECT ... FOR UPDATE
// and atomic Redis locks to guarantee 0% double-booking
// -------------------------------------------------------------
class TierMutex {
  private lockedTiers = new Set<string>();
  private waitQueues = new Map<string, Array<() => void>>();

  async acquire(tierId: string): Promise<() => void> {
    if (!this.lockedTiers.has(tierId)) {
      this.lockedTiers.add(tierId);
      return () => this.release(tierId);
    }

    return new Promise((resolve) => {
      if (!this.waitQueues.has(tierId)) {
        this.waitQueues.set(tierId, []);
      }
      this.waitQueues.get(tierId)!.push(() => {
        resolve(() => this.release(tierId));
      });
    });
  }

  private release(tierId: string): void {
    const queue = this.waitQueues.get(tierId);
    if (queue && queue.length > 0) {
      const nextResolver = queue.shift()!;
      nextResolver();
    } else {
      this.lockedTiers.delete(tierId);
      this.waitQueues.delete(tierId);
    }
  }
}

const tierMutex = new TierMutex();

// -------------------------------------------------------------
// Redis Cache Simulation Layer with TTL and telemetry
// -------------------------------------------------------------
class RedisCacheSimulator {
  private cache = new Map<string, { value: string; expiresAt: number }>();
  public hits = 0;
  public misses = 0;
  public lastInvalidation = new Date().toISOString();

  get<T>(key: string): { data: T | null; hit: boolean } {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return { data: null, hit: false };
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return { data: null, hit: false };
    }

    this.hits++;
    return { data: JSON.parse(entry.value) as T, hit: true };
  }

  set<T>(key: string, value: T, ttlSeconds = 60): void {
    this.cache.set(key, {
      value: JSON.stringify(value),
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  del(keyPattern: string): void {
    this.lastInvalidation = new Date().toISOString();
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern) || keyPattern === '*') {
        this.cache.delete(key);
      }
    }
  }

  getTelemetry(): CacheTelemetry {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRatio: total > 0 ? Number(((this.hits / total) * 100).toFixed(1)) : 0,
      totalKeys: this.cache.size,
      lastInvalidation: this.lastInvalidation,
    };
  }
}

export const redisCache = new RedisCacheSimulator();

// -------------------------------------------------------------
// Seed Database Tables
// -------------------------------------------------------------

export const usersTable: User[] = [
  {
    id: 'usr_admin_01',
    email: 'admin@eventpulse.io',
    name: 'Alexandra Vance',
    role: 'ADMIN',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'usr_org_01',
    email: 'sarah@summitcorp.io',
    name: 'Sarah Jenkins',
    role: 'ORGANIZER',
    organizationName: 'Summit Global Productions',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'usr_org_02',
    email: 'marcus@soundwave.live',
    name: 'Marcus Chen',
    role: 'ORGANIZER',
    organizationName: 'SoundWave Live Touring',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'usr_att_01',
    email: 'alice@gmail.com',
    name: 'Alice Reynolds',
    role: 'ATTENDEE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'usr_att_02',
    email: 'bob@outlook.com',
    name: 'Bob Martinez',
    role: 'ATTENDEE',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80',
  },
];

export const eventsTable: Event[] = [
  {
    id: 'evt_tech_2026',
    organizerId: 'usr_org_01',
    organizerName: 'Summit Global Productions',
    title: 'Global Tech Innovation Keynote 2026',
    description: 'The premier annual gathering of software architects, distributed systems engineers, and technology leaders exploring atomic computing, AI orchestration, and cloud infrastructure.',
    category: 'Technology',
    location: 'San Francisco, CA',
    venueName: 'Moscone Convention Center',
    imageUrl: '/src/assets/images/event_tech_summit_1792987606723.jpg',
    startDate: '2026-11-15T09:00:00Z',
    endDate: '2026-11-17T18:00:00Z',
    salesCutoffDate: '2026-11-14T23:59:59Z',
    status: 'ACTIVE',
    createdAt: '2026-10-01T10:00:00Z',
    viewsCount: 3840,
    tiers: [
      {
        id: 'tier_tech_vip',
        eventId: 'evt_tech_2026',
        name: 'VIP All-Access Pass',
        description: 'Front-row keynote seating, private speaker lounge access, catered lunch & exclusive after-party.',
        price: 899,
        totalCapacity: 50,
        heldCount: 4,
        soldCount: 38,
        salesCutoffDate: '2026-11-14T23:59:59Z',
        perks: ['Speaker Lounge Access', 'Front-row Keynote Seating', 'Executive Dinner Ticket', 'Fast-track Badge Pickup'],
      },
      {
        id: 'tier_tech_ga',
        eventId: 'evt_tech_2026',
        name: 'General Admission',
        description: 'Access to all main stages, exhibition hall, workshops, and general networking receptions.',
        price: 499,
        totalCapacity: 300,
        heldCount: 8,
        soldCount: 245,
        salesCutoffDate: '2026-11-14T23:59:59Z',
        perks: ['All Keynote Stages', 'Workshop Sessions', 'Expo Hall Pass', 'Digital Swag Bag'],
      },
      {
        id: 'tier_tech_early',
        eventId: 'evt_tech_2026',
        name: 'Early Bird Student / Researcher',
        description: 'Special discounted admission for verified students, academics, and indie open-source contributors.',
        price: 199,
        totalCapacity: 80,
        heldCount: 2,
        soldCount: 75, // Only 3 left! Perfect for concurrency stress test
        salesCutoffDate: '2026-11-10T23:59:59Z',
        perks: ['Full Conference Access', 'Student Mentorship Track', 'Community Discord Channel'],
      },
    ],
  },
  {
    id: 'evt_music_2026',
    organizerId: 'usr_org_02',
    organizerName: 'SoundWave Live Touring',
    title: 'Echoes Twilight Music Festival',
    description: 'A two-day open-air celebration of indie electronic, acoustic soundscapes, and visual light projections in an amphitheater setting.',
    category: 'Music',
    location: 'Austin, TX',
    venueName: 'Zilker Park Outdoor Pavilion',
    imageUrl: '/src/assets/images/event_music_festival_1792987608003.jpg',
    startDate: '2026-12-05T14:00:00Z',
    endDate: '2026-12-06T23:30:00Z',
    salesCutoffDate: '2026-12-04T23:59:59Z',
    status: 'ACTIVE',
    createdAt: '2026-10-05T12:00:00Z',
    viewsCount: 5120,
    tiers: [
      {
        id: 'tier_music_backstage',
        eventId: 'evt_music_2026',
        name: 'VIP Backstage Experience',
        description: 'Direct backstage pavilion access, premium viewing deck, open craft cocktail bar, and VIP restroom trailers.',
        price: 450,
        totalCapacity: 60,
        heldCount: 6,
        soldCount: 48,
        salesCutoffDate: '2026-12-04T23:59:59Z',
        perks: ['Elevated Viewing Deck', 'Open Craft Bar', 'Artist Hospitality Access', 'Dedicated Express Entry'],
      },
      {
        id: 'tier_music_weekend',
        eventId: 'evt_music_2026',
        name: 'Weekend General Admission',
        description: 'Entry to both days across all three festival stages, food truck village, and art installations.',
        price: 185,
        totalCapacity: 500,
        heldCount: 15,
        soldCount: 420,
        salesCutoffDate: '2026-12-04T23:59:59Z',
        perks: ['2-Day Festival Access', '3 Stages', 'Art Installations Access', 'Re-entry Privileges'],
      },
    ],
  },
  {
    id: 'evt_design_2026',
    organizerId: 'usr_org_01',
    organizerName: 'Summit Global Productions',
    title: 'Architectural Design & Product Pavilion',
    description: 'An international forum exploring sustainable materials, modular spatial architecture, and human-centric industrial design.',
    category: 'Design & Art',
    location: 'Seattle, WA',
    venueName: 'Center for Architecture & Design',
    imageUrl: '/src/assets/images/event_design_conference_1792987607933.jpg',
    startDate: '2026-11-28T10:00:00Z',
    endDate: '2026-11-29T17:00:00Z',
    salesCutoffDate: '2026-11-27T23:59:59Z',
    status: 'ACTIVE',
    createdAt: '2026-10-10T14:30:00Z',
    viewsCount: 2200,
    tiers: [
      {
        id: 'tier_design_full',
        eventId: 'evt_design_2026',
        name: 'Professional Delegate',
        description: 'Access to keynote symposium, exhibition pavilion booths, portfolio critique lounge, and design directory.',
        price: 320,
        totalCapacity: 120,
        heldCount: 2,
        soldCount: 94,
        salesCutoffDate: '2026-11-27T23:59:59Z',
        perks: ['Symposium Sessions', 'Portfolio Review Lounge', 'Exhibition Pavilion Access', 'Printed Design Yearbook'],
      },
    ],
  },
];

export const reservationsTable: ReservationHold[] = [
  // Seed an active hold for Alice so she immediately sees the live 10-minute hold ticker
  {
    id: 'res_seed_alice_01',
    userId: 'usr_att_01',
    attendeeEmail: 'alice@gmail.com',
    attendeeName: 'Alice Reynolds',
    eventId: 'evt_tech_2026',
    eventTitle: 'Global Tech Innovation Keynote 2026',
    tierId: 'tier_tech_vip',
    tierName: 'VIP All-Access Pass',
    tierPrice: 899,
    quantity: 1,
    status: 'HELD',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(), // 8 minutes remaining
  },
];

export const ordersTable: Order[] = [
  {
    id: 'ord_101',
    orderNumber: 'ORD-2026-8819',
    userId: 'usr_att_02',
    customerName: 'Bob Martinez',
    customerEmail: 'bob@outlook.com',
    eventId: 'evt_tech_2026',
    eventTitle: 'Global Tech Innovation Keynote 2026',
    tierId: 'tier_tech_ga',
    tierName: 'General Admission',
    quantity: 2,
    totalAmount: 998,
    status: 'PAID',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tickets: [
      {
        id: 'tkt_101_1',
        orderId: 'ord_101',
        ticketCode: 'TKT-EVP-7712',
        attendeeName: 'Bob Martinez',
        tierName: 'General Admission',
        qrCodeValue: 'EVP:evt_tech_2026:tier_tech_ga:TKT-EVP-7712',
        status: 'VALID',
      },
      {
        id: 'tkt_101_2',
        orderId: 'ord_101',
        ticketCode: 'TKT-EVP-7713',
        attendeeName: 'Bob Martinez (Guest)',
        tierName: 'General Admission',
        qrCodeValue: 'EVP:evt_tech_2026:tier_tech_ga:TKT-EVP-7713',
        status: 'VALID',
      },
    ],
    transaction: {
      id: 'tx_101',
      orderId: 'ord_101',
      paymentGateway: 'STRIPE_SIMULATOR',
      transactionRef: 'ch_3N8e192x7803kK',
      amount: 998,
      currency: 'USD',
      status: 'SUCCESS',
      authCode: 'AUTH-892110',
      paymentMethod: 'Visa •••• 4242',
      simulatedLatencyMs: 840,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  },
];

export const transactionsTable: Transaction[] = [
  ordersTable[0].transaction!,
];

// -------------------------------------------------------------
// Database Operations & Atomic Concurrency Engine
// -------------------------------------------------------------

export class DatabaseService {
  // Find event by ID with Redis cache
  static getEventById(eventId: string): { event: Event | null; cached: boolean } {
    const cacheKey = `event:${eventId}`;
    const cached = redisCache.get<Event>(cacheKey);
    if (cached.data) {
      return { event: cached.data, cached: true };
    }

    const event = eventsTable.find((e) => e.id === eventId);
    if (!event) return { event: null, cached: false };

    // Update views count for conversion rate analytics
    event.viewsCount++;
    redisCache.set(cacheKey, event, 30);
    return { event, cached: false };
  }

  // Get all active events with Redis cache
  static getActiveEvents(): { events: Event[]; cached: boolean } {
    const cacheKey = 'events:active';
    const cached = redisCache.get<Event[]>(cacheKey);
    if (cached.data) {
      return { events: cached.data, cached: true };
    }

    const activeEvents = eventsTable.filter((e) => e.status === 'ACTIVE');
    redisCache.set(cacheKey, activeEvents, 30);
    return { events: activeEvents, cached: false };
  }

  // -----------------------------------------------------------
  // Atomic Reservation Hold (10-minute hold with mutex lock)
  // This simulates PostgreSQL `SELECT * FROM "TicketTier" WHERE id = $1 FOR UPDATE;`
  // -----------------------------------------------------------
  static async createReservationHold(params: {
    userId: string;
    attendeeEmail: string;
    attendeeName: string;
    eventId: string;
    tierId: string;
    quantity: number;
  }): Promise<{ reservation: ReservationHold; availableRemaining: number }> {
    const { userId, attendeeEmail, attendeeName, eventId, tierId, quantity } = params;

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }

    // Acquire lock for this specific tier
    const releaseLock = await tierMutex.acquire(tierId);

    try {
      const event = eventsTable.find((e) => e.id === eventId);
      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      // Check sales cut-off date
      if (new Date() > new Date(event.salesCutoffDate)) {
        throw new Error('Ticket sales have closed for this event.');
      }

      const tier = event.tiers.find((t) => t.id === tierId);
      if (!tier) {
        throw new Error(`Ticket tier not found: ${tierId}`);
      }

      if (new Date() > new Date(tier.salesCutoffDate)) {
        throw new Error(`Ticket sales have closed for tier: ${tier.name}`);
      }

      // Calculate currently available seats considering confirmed sales AND active 10-minute holds
      const currentAvailable = tier.totalCapacity - (tier.soldCount + tier.heldCount);

      if (currentAvailable < quantity) {
        const err: any = new Error(
          `Insufficient inventory. Requested ${quantity} ticket(s), but only ${Math.max(0, currentAvailable)} seat(s) remain in tier "${tier.name}".`
        );
        err.statusCode = 409;
        err.code = 'ERR_INSUFFICIENT_INVENTORY';
        err.available = Math.max(0, currentAvailable);
        throw err;
      }

      // ATOMIC UPDATE: increment heldCount
      tier.heldCount += quantity;

      // 10 minutes temporary reservation hold window (600,000 ms)
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      const reservation: ReservationHold = {
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        attendeeEmail,
        attendeeName,
        eventId,
        eventTitle: event.title,
        tierId,
        tierName: tier.name,
        tierPrice: tier.price,
        quantity,
        status: 'HELD',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };

      reservationsTable.unshift(reservation);

      // Invalidate Redis cache to guarantee fresh inventory reads
      redisCache.del(`event:${eventId}`);
      redisCache.del('events:active');

      return {
        reservation,
        availableRemaining: tier.totalCapacity - (tier.soldCount + tier.heldCount),
      };
    } finally {
      // Release lock
      releaseLock();
    }
  }

  // Release a reservation hold early (e.g. attendee cancels or changes mind)
  static async releaseReservationHold(reservationId: string, userId?: string): Promise<ReservationHold> {
    const reservation = reservationsTable.find((r) => r.id === reservationId);
    if (!reservation) {
      throw new Error(`Reservation hold not found: ${reservationId}`);
    }

    if (reservation.status !== 'HELD') {
      return reservation;
    }

    // Optional user validation
    if (userId && reservation.userId !== userId && userId !== 'usr_admin_01') {
      throw new Error('Unauthorized to release this reservation');
    }

    const releaseLock = await tierMutex.acquire(reservation.tierId);
    try {
      const event = eventsTable.find((e) => e.id === reservation.eventId);
      if (event) {
        const tier = event.tiers.find((t) => t.id === reservation.tierId);
        if (tier) {
          tier.heldCount = Math.max(0, tier.heldCount - reservation.quantity);
        }
        redisCache.del(`event:${event.id}`);
        redisCache.del('events:active');
      }

      reservation.status = 'CANCELLED';
      return reservation;
    } finally {
      releaseLock();
    }
  }

  // -----------------------------------------------------------
  // Atomic Checkout & Payment Execution
  // -----------------------------------------------------------
  static async executeCheckout(params: {
    reservationId: string;
    userId: string;
    customerName: string;
    customerEmail: string;
    paymentSimulationMode?: 'SUCCESS' | 'DECLINED' | 'TIMEOUT';
  }): Promise<{ order: Order; transaction: Transaction }> {
    const { reservationId, customerName, customerEmail, paymentSimulationMode = 'SUCCESS' } = params;

    const reservation = reservationsTable.find((r) => r.id === reservationId);
    if (!reservation) {
      throw new Error(`Reservation hold ${reservationId} not found`);
    }

    if (reservation.status !== 'HELD') {
      throw new Error(`Cannot checkout reservation with status "${reservation.status}". A 10-minute hold must be active.`);
    }

    // Check if 10-minute window has expired
    const nowTime = Date.now();
    const expiryTime = new Date(reservation.expiresAt).getTime();
    if (nowTime > expiryTime) {
      // Mark as expired
      await this.expireSingleHold(reservation);
      const err: any = new Error(
        'Your 10-minute reservation hold has expired. The held seats have been released back to general inventory.'
      );
      err.statusCode = 400;
      err.code = 'ERR_HOLD_EXPIRED';
      throw err;
    }

    // Acquire lock for transaction execution
    const releaseLock = await tierMutex.acquire(reservation.tierId);
    try {
      const event = eventsTable.find((e) => e.id === reservation.eventId);
      const tier = event?.tiers.find((t) => t.id === reservation.tierId);

      if (!event || !tier) {
        throw new Error('Event or ticket tier record is no longer available');
      }

      const totalAmount = tier.price * reservation.quantity;

      // Handle Mock Asynchronous Payment Simulation
      const simulatedLatencyMs = 900 + Math.floor(Math.random() * 600);

      if (paymentSimulationMode === 'DECLINED') {
        const failedTx: Transaction = {
          id: `tx_failed_${Date.now()}`,
          orderId: `ord_declined_${Date.now()}`,
          paymentGateway: 'STRIPE_SIMULATOR',
          transactionRef: `ch_dec_${Math.random().toString(36).substring(2, 9)}`,
          amount: totalAmount,
          currency: 'USD',
          status: 'DECLINED',
          authCode: 'ERR_CARD_DECLINED',
          paymentMethod: 'Visa •••• 0002',
          simulatedLatencyMs,
          createdAt: new Date().toISOString(),
        };
        transactionsTable.unshift(failedTx);
        const err: any = new Error('Payment was declined by card issuing bank. (Mock simulation: Card declined)');
        err.statusCode = 402;
        err.transaction = failedTx;
        throw err;
      }

      if (paymentSimulationMode === 'TIMEOUT') {
        const timeoutTx: Transaction = {
          id: `tx_timeout_${Date.now()}`,
          orderId: `ord_timeout_${Date.now()}`,
          paymentGateway: 'STRIPE_SIMULATOR',
          transactionRef: `ch_time_${Math.random().toString(36).substring(2, 9)}`,
          amount: totalAmount,
          currency: 'USD',
          status: 'TIMEOUT',
          authCode: 'ERR_GATEWAY_TIMEOUT',
          paymentMethod: 'Mastercard •••• 4444',
          simulatedLatencyMs: 3500,
          createdAt: new Date().toISOString(),
        };
        transactionsTable.unshift(timeoutTx);
        const err: any = new Error('Payment gateway response timed out. (Mock simulation: Gateway timeout)');
        err.statusCode = 504;
        err.transaction = timeoutTx;
        throw err;
      }

      // PAYMENT SUCCEEDED: Complete Atomic Commit
      // 1. Decrement heldCount, increment soldCount
      tier.heldCount = Math.max(0, tier.heldCount - reservation.quantity);
      tier.soldCount += reservation.quantity;

      // 2. Mark reservation completed
      reservation.status = 'COMPLETED';

      // 3. Create Order
      const orderId = `ord_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const orderNumber = `ORD-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      // 4. Generate Tickets with individual QR code values
      const tickets: Ticket[] = [];
      for (let i = 1; i <= reservation.quantity; i++) {
        const ticketCode = `TKT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        tickets.push({
          id: `tkt_${orderId}_${i}`,
          orderId,
          ticketCode,
          attendeeName: i === 1 ? customerName : `${customerName} (Guest ${i})`,
          tierName: tier.name,
          qrCodeValue: `EVENTPULSE:${event.id}:${tier.id}:${ticketCode}:${orderNumber}`,
          status: 'VALID',
        });
      }

      // 5. Create Transaction Record
      const transaction: Transaction = {
        id: `tx_${Date.now()}`,
        orderId,
        paymentGateway: 'STRIPE_SIMULATOR',
        transactionRef: `ch_succ_${Math.random().toString(36).substring(2, 10)}`,
        amount: totalAmount,
        currency: 'USD',
        status: 'SUCCESS',
        authCode: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentMethod: 'Visa •••• 4242',
        simulatedLatencyMs,
        createdAt: new Date().toISOString(),
      };

      transactionsTable.unshift(transaction);

      const order: Order = {
        id: orderId,
        orderNumber,
        userId: params.userId,
        customerName,
        customerEmail,
        eventId: event.id,
        eventTitle: event.title,
        tierId: tier.id,
        tierName: tier.name,
        quantity: reservation.quantity,
        totalAmount,
        status: 'PAID',
        createdAt: new Date().toISOString(),
        tickets,
        transaction,
      };

      ordersTable.unshift(order);

      // Invalidate Redis Cache
      redisCache.del(`event:${event.id}`);
      redisCache.del('events:active');

      return { order, transaction };
    } finally {
      releaseLock();
    }
  }

  // -----------------------------------------------------------
  // Background Expiry Worker Logic
  // Releases reservations where status === 'HELD' and expiresAt <= now
  // -----------------------------------------------------------
  static async releaseExpiredHolds(): Promise<{
    expiredCount: number;
    releasedHoldIds: string[];
    releasedSeatsCount: number;
  }> {
    const now = Date.now();
    const expiredHolds = reservationsTable.filter(
      (r) => r.status === 'HELD' && new Date(r.expiresAt).getTime() <= now
    );

    if (expiredHolds.length === 0) {
      return { expiredCount: 0, releasedHoldIds: [], releasedSeatsCount: 0 };
    }

    let releasedSeats = 0;
    const releasedIds: string[] = [];

    for (const hold of expiredHolds) {
      const releaseLock = await tierMutex.acquire(hold.tierId);
      try {
        if (hold.status === 'HELD') {
          hold.status = 'EXPIRED';
          releasedIds.push(hold.id);
          releasedSeats += hold.quantity;

          const event = eventsTable.find((e) => e.id === hold.eventId);
          if (event) {
            const tier = event.tiers.find((t) => t.id === hold.tierId);
            if (tier) {
              tier.heldCount = Math.max(0, tier.heldCount - hold.quantity);
            }
            redisCache.del(`event:${event.id}`);
          }
        }
      } finally {
        releaseLock();
      }
    }

    redisCache.del('events:active');
    return {
      expiredCount: releasedIds.length,
      releasedHoldIds: releasedIds,
      releasedSeatsCount: releasedSeats,
    };
  }

  private static async expireSingleHold(hold: ReservationHold): Promise<void> {
    const releaseLock = await tierMutex.acquire(hold.tierId);
    try {
      if (hold.status === 'HELD') {
        hold.status = 'EXPIRED';
        const event = eventsTable.find((e) => e.id === hold.eventId);
        if (event) {
          const tier = event.tiers.find((t) => t.id === hold.tierId);
          if (tier) {
            tier.heldCount = Math.max(0, tier.heldCount - hold.quantity);
          }
          redisCache.del(`event:${event.id}`);
          redisCache.del('events:active');
        }
      }
    } finally {
      releaseLock();
    }
  }

  // Force expire a hold for testing edge cases
  static async forceExpireHold(holdId: string): Promise<ReservationHold> {
    const hold = reservationsTable.find((r) => r.id === holdId);
    if (!hold) throw new Error('Hold not found');
    hold.expiresAt = new Date(Date.now() - 1000).toISOString();
    await this.expireSingleHold(hold);
    return hold;
  }

  // -----------------------------------------------------------
  // Concurrency Stress-Test Harness
  // Fires N simultaneous reservation requests for the specified tier
  // to prove atomic row locking / mutex prevents double booking!
  // -----------------------------------------------------------
  static async runConcurrencyStressTest(params: {
    tierId: string;
    totalAttempts: number;
  }): Promise<ConcurrencyTestSummary> {
    const { tierId, totalAttempts } = params;

    // Find tier
    let targetEvent: Event | undefined;
    let targetTier: TicketTier | undefined;

    for (const e of eventsTable) {
      const t = e.tiers.find((tier) => tier.id === tierId);
      if (t) {
        targetEvent = e;
        targetTier = t;
        break;
      }
    }

    if (!targetEvent || !targetTier) {
      throw new Error(`Tier ${tierId} not found`);
    }

    const initialAvailable = Math.max(0, targetTier.totalCapacity - (targetTier.soldCount + targetTier.heldCount));
    const startTime = Date.now();
    const attempts: ConcurrencyTestAttempt[] = [];

    // Construct array of concurrent requests fired with Promise.all
    const promises = Array.from({ length: totalAttempts }, async (_, index) => {
      const reqId = index + 1;
      const attendeeEmail = `stress_tester_${reqId}@benchmark.io`;
      const attendeeName = `Concurrency Bot ${reqId}`;
      const reqStart = Date.now();

      try {
        const result = await this.createReservationHold({
          userId: `bot_${reqId}`,
          attendeeEmail,
          attendeeName,
          eventId: targetEvent!.id,
          tierId: targetTier!.id,
          quantity: 1,
        });

        attempts.push({
          requestId: reqId,
          attendeeEmail,
          timestamp: new Date().toISOString(),
          status: 'SUCCESS_RESERVED',
          statusCode: 201,
          durationMs: Date.now() - reqStart,
          message: `Seat held successfully! Remaining tier capacity: ${result.availableRemaining}`,
          reservationId: result.reservation.id,
        });
      } catch (err: any) {
        attempts.push({
          requestId: reqId,
          attendeeEmail,
          timestamp: new Date().toISOString(),
          status: 'CONFLICT_SOLD_OUT',
          statusCode: err.statusCode || 409,
          durationMs: Date.now() - reqStart,
          message: err.message || 'Sold out. Concurrency lock prevented overselling.',
        });
      }
    });

    await Promise.all(promises);

    // Sort by request ID for clear inspection
    attempts.sort((a, b) => a.requestId - b.requestId);

    const successfulHolds = attempts.filter((a) => a.status === 'SUCCESS_RESERVED').length;
    const rejectedConflicts = attempts.filter((a) => a.status === 'CONFLICT_SOLD_OUT').length;

    // Audit verification: Did we hold more than what was initially available?
    const doubleBookingsCount = Math.max(0, successfulHolds - initialAvailable);

    return {
      tierId: targetTier.id,
      tierName: targetTier.name,
      initialAvailable,
      totalAttempts,
      successfulHolds,
      rejectedConflicts,
      doubleBookingsCount,
      executionDurationMs: Date.now() - startTime,
      attempts,
    };
  }

  // -----------------------------------------------------------
  // Organizer Analytics Dashboard Queries
  // -----------------------------------------------------------
  static getOrganizerAnalytics(organizerId: string): OrganizerAnalytics {
    const orgEvents = eventsTable.filter((e) => e.organizerId === organizerId);
    const orgEventIds = new Set(orgEvents.map((e) => e.id));

    const orgOrders = ordersTable.filter((o) => orgEventIds.has(o.eventId) && o.status === 'PAID');
    const totalRevenue = orgOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const totalTicketsSold = orgOrders.reduce((sum, o) => sum + o.quantity, 0);

    const orgActiveHolds = reservationsTable.filter(
      (r) => orgEventIds.has(r.eventId) && r.status === 'HELD'
    );
    const totalActiveHolds = orgActiveHolds.reduce((sum, r) => sum + r.quantity, 0);

    const totalViews = orgEvents.reduce((sum, e) => sum + e.viewsCount, 0);
    const totalHoldsPlaced = reservationsTable.filter((r) => orgEventIds.has(r.eventId)).length;
    const completedOrders = orgOrders.length;

    // Funnel conversion rate
    const overallConversionRate =
      totalHoldsPlaced > 0
        ? Number(((completedOrders / totalHoldsPlaced) * 100).toFixed(1))
        : 0;

    // Tier performance breakdown
    const tierPerformance = orgEvents.flatMap((evt) =>
      evt.tiers.map((t) => {
        const tierOrders = orgOrders.filter((o) => o.tierId === t.id);
        const tierRev = tierOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const occupancy =
          t.totalCapacity > 0
            ? Number((((t.soldCount + t.heldCount) / t.totalCapacity) * 100).toFixed(1))
            : 0;

        return {
          tierId: t.id,
          tierName: `${evt.title} - ${t.name}`,
          sold: t.soldCount,
          held: t.heldCount,
          capacity: t.totalCapacity,
          revenue: tierRev,
          occupancyPercent: occupancy,
        };
      })
    );

    return {
      totalRevenue,
      totalTicketsSold,
      totalActiveHolds,
      overallConversionRate,
      tierPerformance,
      funnel: {
        views: totalViews,
        holdsPlaced: totalHoldsPlaced,
        completedOrders,
        conversionRate: overallConversionRate,
      },
      recentOrders: orgOrders.slice(0, 10),
    };
  }
}
