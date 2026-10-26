import React, { useState, useEffect } from 'react';
import { User, Event, ReservationHold, Order } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { ActiveHoldBanner } from './components/ActiveHoldBanner.tsx';
import { EventCard } from './components/EventCard.tsx';
import { EventDetailModal } from './components/EventDetailModal.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { TicketSuccessModal } from './components/TicketSuccessModal.tsx';
import { OrganizerDashboard } from './components/OrganizerDashboard.tsx';
import { AdminConsole } from './components/AdminConsole.tsx';
import { ConcurrencyLab } from './components/ConcurrencyLab.tsx';
import { DeliverablesGuide } from './components/DeliverablesGuide.tsx';
import {
  Calendar,
  Search,
  Filter,
  Zap,
  Shield,
  Layers,
  Database,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_att_01',
    email: 'alice@gmail.com',
    name: 'Alice Reynolds',
    role: 'ATTENDEE',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80',
  });

  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [cachedEvents, setCachedEvents] = useState<boolean>(false);
  const [activeHolds, setActiveHolds] = useState<ReservationHold[]>([]);
  const [activeTab, setActiveTab] = useState<
    'events' | 'organizer' | 'admin' | 'concurrency' | 'deliverables'
  >('events');

  // Modals
  const [selectedEventModal, setSelectedEventModal] = useState<Event | null>(null);
  const [activeCheckoutHold, setActiveCheckoutHold] = useState<ReservationHold | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [holdingInProgress, setHoldingInProgress] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch demo users
  const fetchDemoUsers = async () => {
    try {
      const res = await fetch('/api/auth/demo-users');
      if (res.ok) {
        const data = await res.json();
        setDemoUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load demo users:', err);
    }
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setCachedEvents(data.cached);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  // Fetch active holds
  const fetchActiveHolds = async () => {
    try {
      const res = await fetch('/api/reservations/active', {
        headers: {
          Authorization: `Bearer mock_token_for_${currentUser.id}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveHolds(data.holds || []);
      }
    } catch (err) {
      console.error('Failed to load active holds:', err);
    }
  };

  useEffect(() => {
    fetchDemoUsers();
    fetchEvents();
    fetchActiveHolds();

    const interval = setInterval(() => {
      fetchActiveHolds();
    }, 4000);

    return () => clearInterval(interval);
  }, [currentUser.id]);

  // Handle Place 10-Minute Hold
  const handlePlaceHold = async (eventId: string, tierId: string, quantity: number): Promise<boolean> => {
    setHoldingInProgress(true);
    try {
      const res = await fetch('/api/reservations/hold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock_token_for_${currentUser.id}`,
        },
        body: JSON.stringify({
          userId: currentUser.id,
          attendeeEmail: currentUser.email,
          attendeeName: currentUser.name,
          eventId,
          tierId,
          quantity,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place reservation hold.');
      }

      showToast(`Reserved ${quantity} ticket(s) on a 10-minute hold!`, 'success');
      await fetchActiveHolds();
      await fetchEvents();

      // Open checkout modal directly for smooth flow
      setActiveCheckoutHold(data.reservation);
      return true;
    } catch (err: any) {
      throw err;
    } finally {
      setHoldingInProgress(false);
    }
  };

  // Handle Release Hold
  const handleReleaseHold = async (holdId: string) => {
    try {
      const res = await fetch(`/api/reservations/${holdId}/release`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer mock_token_for_${currentUser.id}`,
        },
      });
      if (res.ok) {
        showToast('Reservation hold released. Seats returned to inventory.', 'success');
        fetchActiveHolds();
        fetchEvents();
      }
    } catch (err) {
      console.error('Failed to release hold:', err);
    }
  };

  // Filter events
  const filteredEvents = events.filter((e) => {
    const matchesCategory = selectedCategory === 'All' || e.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.venueName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['All', 'Technology', 'Music', 'Design & Art'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Bar Navigation */}
      <Navbar
        currentUser={currentUser}
        onSelectUser={(u) => {
          setCurrentUser(u);
          showToast(`Switched active persona to ${u.name} (${u.role})`, 'success');
          // If switching to organizer or admin, route appropriately
          if (u.role === 'ORGANIZER') setActiveTab('organizer');
          if (u.role === 'ADMIN') setActiveTab('admin');
        }}
        demoUsers={demoUsers}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeHolds={activeHolds}
        onOpenCheckout={(hold) => setActiveCheckoutHold(hold)}
      />

      {/* 10-Minute Hold Persistent Alert Banner */}
      <ActiveHoldBanner
        holds={activeHolds}
        onOpenCheckout={(hold) => setActiveCheckoutHold(hold)}
        onReleaseHold={handleReleaseHold}
      />

      {/* Floating Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-xs font-semibold text-white transition-all bg-slate-900 border border-slate-800">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1">
        {/* VIEW 1: BROWSE EVENTS (ATTENDEE DISCOVERY & HOLD FLOW) */}
        {activeTab === 'events' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Hero Banner Section */}
            <div className="relative rounded-2xl bg-slate-900 text-white overflow-hidden p-8 sm:p-12 border border-slate-800">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <Clock className="w-4 h-4" />
                  <span>10-Minute Reservation Protection</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
                  Live Event Tickets with Zero Double-Booking
                </h1>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Select your seats with confidence. Our transactional reservation engine places an atomic 10-minute hold on your tickets while you complete payment, guaranteeing your seats are never poached.
                </p>

                {/* Sub-strip with technical assurances */}
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span>PostgreSQL Row Locking</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-red-400" />
                    <span>Redis Cache Acceleration ({cachedEvents ? 'Cache HIT' : 'DB Read'})</span>
                  </div>
                  <span aria-hidden="true">·</span>
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Multi-Tenant RBAC</span>
                  </div>
                </div>
              </div>

              {/* Background ambient lighting */}
              <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="absolute bottom-0 right-32 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
              {/* Category Segmented Buttons */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search events, city, venue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs bg-white rounded-xl border border-slate-200">
                No events match your current search query.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((evt) => (
                  <EventCard
                    key={evt.id}
                    event={evt}
                    onSelectEvent={(e) => setSelectedEventModal(e)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: ORGANIZER STUDIO */}
        {activeTab === 'organizer' && (
          <OrganizerDashboard
            currentUser={currentUser}
            onRefreshEvents={fetchEvents}
          />
        )}

        {/* VIEW 3: ADMIN CONSOLE */}
        {activeTab === 'admin' && <AdminConsole />}

        {/* VIEW 4: CONCURRENCY STRESS-TEST LAB */}
        {activeTab === 'concurrency' && <ConcurrencyLab />}

        {/* VIEW 5: DELIVERABLES & WINDOWS GUIDE */}
        {activeTab === 'deliverables' && <DeliverablesGuide />}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">EventPulse</span>
            <span>· Multi-Tenant Event & Ticket Reservation System</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>10-Minute Holds Active</span>
            <span aria-hidden="true">·</span>
            <span>PostgreSQL SELECT FOR UPDATE Simulation</span>
            <span aria-hidden="true">·</span>
            <span>Redis Caching</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* Event Details & Tier Hold Selection Modal */}
      {selectedEventModal && (
        <EventDetailModal
          event={selectedEventModal}
          onClose={() => setSelectedEventModal(null)}
          onPlaceHold={handlePlaceHold}
          loading={holdingInProgress}
        />
      )}

      {/* Checkout & Mock Payment Gateway Modal */}
      {activeCheckoutHold && (
        <CheckoutModal
          hold={activeCheckoutHold}
          onClose={() => setActiveCheckoutHold(null)}
          onCheckoutSuccess={(order) => {
            setSuccessOrder(order);
            fetchActiveHolds();
            fetchEvents();
          }}
          onReleaseHold={handleReleaseHold}
        />
      )}

      {/* Ticket Success & QR Code Voucher Modal */}
      {successOrder && (
        <TicketSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
        />
      )}
    </div>
  );
}
