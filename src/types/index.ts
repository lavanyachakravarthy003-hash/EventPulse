export type UserRole = 'ADMIN' | 'ORGANIZER' | 'ATTENDEE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationName?: string;
  avatarUrl?: string;
}

export type EventStatus = 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED';

export interface TicketTier {
  id: string;
  eventId: string;
  name: string; // e.g., 'VIP All-Access', 'General Admission', 'Early Bird'
  description?: string;
  price: number;
  totalCapacity: number;
  heldCount: number; // currently held in 10-min temporary reservations
  soldCount: number; // confirmed purchased
  salesCutoffDate: string; // ISO date string
  perks: string[];
}

export interface Event {
  id: string;
  organizerId: string;
  organizerName: string;
  title: string;
  description: string;
  category: 'Technology' | 'Music' | 'Design & Art' | 'Business' | 'Science';
  location: string;
  venueName: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  salesCutoffDate: string;
  status: EventStatus;
  createdAt: string;
  tiers: TicketTier[];
  viewsCount: number;
}

export type ReservationStatus = 'HELD' | 'EXPIRED' | 'COMPLETED' | 'CANCELLED';

export interface ReservationHold {
  id: string;
  userId: string;
  attendeeEmail: string;
  attendeeName: string;
  eventId: string;
  eventTitle: string;
  tierId: string;
  tierName: string;
  tierPrice: number;
  quantity: number;
  status: ReservationStatus;
  createdAt: string;
  expiresAt: string; // 10 minutes from creation
  remainingSeconds?: number;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  eventId: string;
  eventTitle: string;
  tierId: string;
  tierName: string;
  quantity: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
  tickets: Ticket[];
  transaction?: Transaction;
}

export interface Ticket {
  id: string;
  orderId: string;
  ticketCode: string; // e.g. TKT-EVP-84920
  attendeeName: string;
  tierName: string;
  qrCodeValue: string;
  status: 'VALID' | 'CHECKED_IN' | 'REFUNDED';
}

export type TransactionStatus = 'SUCCESS' | 'DECLINED' | 'TIMEOUT';

export interface Transaction {
  id: string;
  orderId: string;
  paymentGateway: 'STRIPE_SIMULATOR' | 'MOCK_GATEWAY';
  transactionRef: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  authCode: string;
  paymentMethod: string;
  simulatedLatencyMs: number;
  createdAt: string;
}

export interface OrganizerAnalytics {
  totalRevenue: number;
  totalTicketsSold: number;
  totalActiveHolds: number;
  overallConversionRate: number; // percentage (orders / (views or holds))
  tierPerformance: {
    tierId: string;
    tierName: string;
    sold: number;
    held: number;
    capacity: number;
    revenue: number;
    occupancyPercent: number;
  }[];
  funnel: {
    views: number;
    holdsPlaced: number;
    completedOrders: number;
    conversionRate: number;
  };
  recentOrders: Order[];
}

export interface ConcurrencyTestAttempt {
  requestId: number;
  attendeeEmail: string;
  timestamp: string;
  status: 'SUCCESS_RESERVED' | 'CONFLICT_SOLD_OUT' | 'ERROR';
  statusCode: number;
  durationMs: number;
  message: string;
  reservationId?: string;
}

export interface ConcurrencyTestSummary {
  tierId: string;
  tierName: string;
  initialAvailable: number;
  totalAttempts: number;
  successfulHolds: number;
  rejectedConflicts: number;
  doubleBookingsCount: number;
  executionDurationMs: number;
  attempts: ConcurrencyTestAttempt[];
}

export interface CacheTelemetry {
  hits: number;
  misses: number;
  hitRatio: number;
  totalKeys: number;
  lastInvalidation: string;
}
