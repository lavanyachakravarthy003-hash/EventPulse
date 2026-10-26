import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  DatabaseService,
  usersTable,
  eventsTable,
  reservationsTable,
  ordersTable,
  redisCache,
} from './src/server/db.ts';
import {
  getPrismaSchema,
  getPostmanCollectionJson,
  getDockerComposeYaml,
} from './src/server/deliverables.ts';
import { Event, TicketTier } from './src/types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Body parsing
app.use(express.json());

// Simple stateless JWT simulation helper using HMAC-SHA256
const JWT_SECRET = process.env.JWT_SECRET || 'eventpulse_dev_secret_key_2026';

function signToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const [header, body, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expected) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// Auth middleware helper
function authenticate(req: Request): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// -------------------------------------------------------------
// 1. Auth & RBAC Endpoints
// -------------------------------------------------------------

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = usersTable.find((u) => u.email.toLowerCase() === (email || '').toLowerCase().trim());

  if (!user) {
    // If not found in seed, create an attendee on the fly
    const newUser = {
      id: `usr_${Date.now()}`,
      email: email || 'user@example.com',
      name: email.split('@')[0] || 'Attendee',
      role: 'ATTENDEE' as const,
    };
    usersTable.push(newUser);
    const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });
    return res.json({ token, user: newUser });
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });
  return res.json({ token, user });
});

app.post('/api/auth/register', (req: Request, res: Response) => {
  const { email, name, role = 'ATTENDEE', organizationName } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const existing = usersTable.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    email,
    name,
    role: (role === 'ORGANIZER' || role === 'ADMIN' ? role : 'ATTENDEE') as any,
    organizationName: role === 'ORGANIZER' ? organizationName : undefined,
  };

  usersTable.push(newUser);
  const token = signToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });
  return res.status(201).json({ token, user: newUser });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authUser = authenticate(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Unauthenticated' });
  }
  const user = usersTable.find((u) => u.id === authUser.id);
  return res.json({ user: user || authUser });
});

// Demo accounts list for fast role switching in header
app.get('/api/auth/demo-users', (_req: Request, res: Response) => {
  return res.json({ users: usersTable });
});

// -------------------------------------------------------------
// 2. Events & Redis Caching Endpoints
// -------------------------------------------------------------

app.get('/api/events', (_req: Request, res: Response) => {
  const { events, cached } = DatabaseService.getActiveEvents();
  res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
  res.setHeader('X-Cache-Engine', 'Redis-Simulator (TTL 30s)');
  return res.json({
    events,
    cached,
    cacheTelemetry: redisCache.getTelemetry(),
  });
});

app.get('/api/events/:id', (req: Request, res: Response) => {
  const { event, cached } = DatabaseService.getEventById(req.params.id);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.setHeader('X-Cache', cached ? 'HIT' : 'MISS');
  return res.json({ event, cached });
});

app.post('/api/events', (req: Request, res: Response) => {
  const authUser = authenticate(req);
  if (!authUser || (authUser.role !== 'ORGANIZER' && authUser.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Only Organizers or Admins can create events' });
  }

  const {
    title,
    description,
    category,
    location,
    venueName,
    imageUrl,
    startDate,
    endDate,
    salesCutoffDate,
    tiers = [],
  } = req.body;

  if (!title || !startDate || !salesCutoffDate) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  const eventId = `evt_${Date.now()}`;
  const formattedTiers: TicketTier[] = (tiers.length > 0 ? tiers : [
    {
      name: 'General Admission',
      description: 'Standard event access',
      price: 99,
      totalCapacity: 100,
      salesCutoffDate: salesCutoffDate,
      perks: ['Standard Entry'],
    },
  ]).map((t: any, idx: number) => ({
    id: `tier_${eventId}_${idx + 1}`,
    eventId,
    name: t.name,
    description: t.description || '',
    price: Number(t.price),
    totalCapacity: Number(t.totalCapacity),
    heldCount: 0,
    soldCount: 0,
    salesCutoffDate: t.salesCutoffDate || salesCutoffDate,
    perks: t.perks || [],
  }));

  const newEvent: Event = {
    id: eventId,
    organizerId: authUser.id,
    organizerName: authUser.organizationName || authUser.name,
    title,
    description,
    category: category || 'Technology',
    location: location || 'Online / Hybrid',
    venueName: venueName || 'Virtual Event Center',
    imageUrl: imageUrl || '/src/assets/images/event_tech_summit_1792987606723.jpg',
    startDate,
    endDate: endDate || startDate,
    salesCutoffDate,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    tiers: formattedTiers,
    viewsCount: 0,
  };

  eventsTable.unshift(newEvent);
  redisCache.del('*'); // Invalidate event list cache

  return res.status(201).json({ event: newEvent });
});

// -------------------------------------------------------------
// 3. Reservation Engine (10-Minute Hold & Concurrency Mutex)
// -------------------------------------------------------------

app.post('/api/reservations/hold', async (req: Request, res: Response) => {
  const authUser = authenticate(req);
  const userId = authUser ? authUser.id : (req.body.userId || 'usr_guest');
  const attendeeEmail = authUser ? authUser.email : (req.body.attendeeEmail || 'guest@example.com');
  const attendeeName = authUser ? authUser.name : (req.body.attendeeName || 'Guest Attendee');

  const { eventId, tierId, quantity = 1 } = req.body;

  if (!eventId || !tierId) {
    return res.status(400).json({ error: 'eventId and tierId are required' });
  }

  try {
    const { reservation, availableRemaining } = await DatabaseService.createReservationHold({
      userId,
      attendeeEmail,
      attendeeName,
      eventId,
      tierId,
      quantity: Number(quantity),
    });

    return res.status(201).json({
      success: true,
      message: '10-minute temporary reservation hold confirmed.',
      reservation,
      availableRemaining,
      holdDurationMinutes: 10,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      error: err.message,
      code: err.code || 'ERR_RESERVATION_FAILED',
      available: err.available,
    });
  }
});

app.get('/api/reservations/active', (req: Request, res: Response) => {
  const authUser = authenticate(req);
  const now = Date.now();

  let holds = reservationsTable.filter(
    (r) => r.status === 'HELD' && new Date(r.expiresAt).getTime() > now
  );

  if (authUser && authUser.role !== 'ADMIN') {
    holds = holds.filter((r) => r.userId === authUser.id || r.attendeeEmail === authUser.email);
  }

  const enhancedHolds = holds.map((h) => ({
    ...h,
    remainingSeconds: Math.max(0, Math.floor((new Date(h.expiresAt).getTime() - now) / 1000)),
  }));

  return res.json({ holds: enhancedHolds });
});

app.post('/api/reservations/:id/release', async (req: Request, res: Response) => {
  const authUser = authenticate(req);
  const reservationId = req.params.id;

  try {
    const released = await DatabaseService.releaseReservationHold(reservationId, authUser?.id);
    return res.json({ success: true, reservation: released });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. Atomic Checkout & Payment Simulation
// -------------------------------------------------------------

app.post('/api/checkout', async (req: Request, res: Response) => {
  const authUser = authenticate(req);
  const {
    reservationId,
    customerName,
    customerEmail,
    paymentSimulationMode = 'SUCCESS',
  } = req.body;

  if (!reservationId) {
    return res.status(400).json({ error: 'reservationId is required' });
  }

  try {
    const result = await DatabaseService.executeCheckout({
      reservationId,
      userId: authUser?.id || 'usr_guest',
      customerName: customerName || authUser?.name || 'Customer',
      customerEmail: customerEmail || authUser?.email || 'customer@example.com',
      paymentSimulationMode,
    });

    return res.json({
      success: true,
      message: 'Checkout and payment completed successfully!',
      order: result.order,
      transaction: result.transaction,
    });
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      error: err.message,
      code: err.code || 'ERR_CHECKOUT_FAILED',
      transaction: err.transaction,
    });
  }
});

// Mock asynchronous payment webhook/gateway endpoint
app.post('/api/payments/simulate', async (req: Request, res: Response) => {
  const { amount, currency = 'USD', outcome = 'SUCCESS' } = req.body;

  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (outcome === 'DECLINED') {
    return res.status(402).json({
      success: false,
      status: 'DECLINED',
      error: 'Card declined: Insufficient funds or fraud suspicion',
      authCode: null,
    });
  }

  if (outcome === 'TIMEOUT') {
    return res.status(504).json({
      success: false,
      status: 'TIMEOUT',
      error: 'Gateway network request timed out',
    });
  }

  return res.json({
    success: true,
    status: 'SUCCESS',
    transactionRef: `tx_mock_${Date.now()}`,
    authCode: `AUTH_${Math.floor(100000 + Math.random() * 900000)}`,
    amount,
    currency,
  });
});

// -------------------------------------------------------------
// 5. Concurrency Race Condition Stress-Tester Endpoint
// -------------------------------------------------------------

app.post('/api/simulate/concurrency', async (req: Request, res: Response) => {
  const { tierId = 'tier_tech_early', totalAttempts = 20 } = req.body;

  try {
    const summary = await DatabaseService.runConcurrencyStressTest({
      tierId,
      totalAttempts: Math.min(50, Math.max(2, Number(totalAttempts))),
    });

    return res.json(summary);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 6. Background Expiry Worker Control Endpoints
// -------------------------------------------------------------

app.post('/api/worker/tick', async (_req: Request, res: Response) => {
  const result = await DatabaseService.releaseExpiredHolds();
  return res.json({
    success: true,
    message: 'Cron worker executed tick cycle.',
    timestamp: new Date().toISOString(),
    result,
  });
});

app.post('/api/worker/expire-now/:id', async (req: Request, res: Response) => {
  try {
    const expired = await DatabaseService.forceExpireHold(req.params.id);
    return res.json({ success: true, message: 'Reservation hold forcefully expired for test demonstration.', reservation: expired });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 7. Organizer Analytics & Admin Oversight Endpoints
// -------------------------------------------------------------

app.get('/api/analytics/organizer', (req: Request, res: Response) => {
  const organizerId = (req.query.organizerId as string) || 'usr_org_01';
  const analytics = DatabaseService.getOrganizerAnalytics(organizerId);
  return res.json(analytics);
});

app.get('/api/admin/overview', (_req: Request, res: Response) => {
  const totalEvents = eventsTable.length;
  const totalUsers = usersTable.length;
  const totalOrders = ordersTable.length;
  const totalRevenue = ordersTable.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeHolds = reservationsTable.filter(
    (r) => r.status === 'HELD' && new Date(r.expiresAt).getTime() > Date.now()
  );

  return res.json({
    totalEvents,
    totalUsers,
    totalOrders,
    totalRevenue,
    activeHoldsCount: activeHolds.length,
    activeHolds,
    cacheTelemetry: redisCache.getTelemetry(),
  });
});

// -------------------------------------------------------------
// 8. Deliverables Exporter Endpoints (Prisma, Postman, Docker)
// -------------------------------------------------------------

app.get('/api/deliverables/prisma', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="schema.prisma"');
  return res.send(getPrismaSchema());
});

app.get('/api/deliverables/postman', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol || 'http';
  const baseUrl = `${protocol}://${host}`;
  const collection = getPostmanCollectionJson(baseUrl);

  if (req.query.download === 'true') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="EventPulse_Ticketing_API.postman_collection.json"');
  }

  return res.json(collection);
});

app.get('/api/deliverables/docker', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="docker-compose.yml"');
  return res.send(getDockerComposeYaml());
});

// -------------------------------------------------------------
// Automatic Background Expiry Worker Scheduler (Runs every 5s)
// -------------------------------------------------------------
setInterval(async () => {
  try {
    const result = await DatabaseService.releaseExpiredHolds();
    if (result.expiredCount > 0) {
      console.log(`[ExpiryWorker] Released ${result.expiredCount} expired hold(s) totaling ${result.releasedSeatsCount} seat(s).`);
    }
  } catch (err) {
    console.error('[ExpiryWorker] Error during hold release tick:', err);
  }
}, 5000);

// -------------------------------------------------------------
// Dev & Production Serving with Vite Middlewares
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EventPulse] Server listening on port ${PORT}`);
  });
}

startServer();
