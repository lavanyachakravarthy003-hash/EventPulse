import React, { useState, useEffect } from 'react';
import { User, OrganizerAnalytics, Event } from '../types/index.ts';
import {
  DollarSign,
  Ticket,
  Clock,
  TrendingUp,
  Plus,
  Calendar,
  X,
  Layers,
  CheckCircle2,
  AlertCircle,
  Download,
} from 'lucide-react';

interface OrganizerDashboardProps {
  currentUser: User;
  onRefreshEvents: () => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  currentUser,
  onRefreshEvents,
}) => {
  const [analytics, setAnalytics] = useState<OrganizerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Technology' | 'Music' | 'Design & Art' | 'Business' | 'Science'>('Technology');
  const [location, setLocation] = useState('San Francisco, CA');
  const [venueName, setVenueName] = useState('Tech Convention Center');
  const [startDate, setStartDate] = useState('2026-11-20T10:00');
  const [salesCutoffDate, setSalesCutoffDate] = useState('2026-11-19T23:59');
  const [tiers, setTiers] = useState<
    Array<{ name: string; price: number; totalCapacity: number; perks: string }>
  >([
    { name: 'General Admission', price: 99, totalCapacity: 200, perks: 'Keynote Stage, Expo Hall' },
    { name: 'VIP All-Access', price: 299, totalCapacity: 50, perks: 'VIP Lounge, Fast Track, Dinner' },
  ]);

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/analytics/organizer?organizerId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load organizer analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 6000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleAddTier = () => {
    setTiers([...tiers, { name: 'Tier ' + (tiers.length + 1), price: 150, totalCapacity: 50, perks: 'Entry pass' }]);
  };

  const handleRemoveTier = (idx: number) => {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      const formattedTiers = tiers.map((t) => ({
        name: t.name,
        price: Number(t.price),
        totalCapacity: Number(t.totalCapacity),
        salesCutoffDate: new Date(salesCutoffDate).toISOString(),
        perks: t.perks.split(',').map((p) => p.trim()).filter(Boolean),
      }));

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer mock_token_for_${currentUser.id}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          location,
          venueName,
          startDate: new Date(startDate).toISOString(),
          salesCutoffDate: new Date(salesCutoffDate).toISOString(),
          tiers: formattedTiers,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create event');
      }

      setShowCreateModal(false);
      onRefreshEvents();
      fetchAnalytics();
      // Reset
      setTitle('');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Error creating event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-xs">
        Loading real-time organizer telemetry...
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalTicketsSold = 0,
    totalActiveHolds = 0,
    overallConversionRate = 0,
    tierPerformance = [],
    funnel = { views: 0, holdsPlaced: 0, completedOrders: 0, conversionRate: 0 },
    recentOrders = [],
  } = analytics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with Title and Create Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Organizer Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue metrics, tier capacity tracking, and ticket conversion analytics.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Gross Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Processed via atomic checkout transactions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Confirmed Tickets Sold</span>
            <Ticket className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalTicketsSold}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Issued with unique anti-tamper QR codes
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Active 10-Min Holds</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {totalActiveHolds}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Temporarily locked against double booking
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
            <span>Hold-to-Order Conversion</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {overallConversionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Attendees completing checkout before expiration
          </div>
        </div>
      </div>

      {/* Analytics Grid: Tier Performance + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Performance Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">
              Ticket Tier Breakdown & Occupancy
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Live DB state
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-semibold">Tier / Event</th>
                  <th className="py-2.5 font-semibold text-right">Sold</th>
                  <th className="py-2.5 font-semibold text-right">Active Hold</th>
                  <th className="py-2.5 font-semibold text-right">Capacity</th>
                  <th className="py-2.5 font-semibold text-right">Occupancy</th>
                  <th className="py-2.5 font-semibold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tierPerformance.map((tp) => (
                  <tr key={tp.tierId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-medium text-slate-900 max-w-[200px] truncate">
                      {tp.tierName}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-700">
                      {tp.sold}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-amber-600 font-semibold">
                      {tp.held}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums text-slate-500">
                      {tp.capacity}
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums">
                      <div className="flex items-center justify-end gap-2">
                        <span>{tp.occupancyPercent}%</span>
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${Math.min(100, tp.occupancyPercent)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                      ${tp.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Checkout Funnel & Drop-off
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Track flow from initial event discovery to completed payment.
            </p>

            <div className="space-y-4 text-xs">
              {/* Stage 1: Views */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-700">1. Event Page Views</span>
                  <span className="font-mono tabular-nums font-bold text-slate-900">
                    {funnel.views}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-slate-800 h-full w-full" />
                </div>
              </div>

              {/* Stage 2: Holds */}
              <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-indigo-900">2. 10-Minute Holds Placed</span>
                  <span className="font-mono tabular-nums font-bold text-indigo-900">
                    {funnel.holdsPlaced}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full"
                    style={{
                      width: `${funnel.views > 0 ? (funnel.holdsPlaced / funnel.views) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-indigo-600 block mt-1 font-mono">
                  {funnel.views > 0
                    ? ((funnel.holdsPlaced / funnel.views) * 100).toFixed(1)
                    : 0}
                  % of visitors reserved a seat
                </span>
              </div>

              {/* Stage 3: Orders */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-emerald-900">3. Completed Checkouts</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-900">
                    {funnel.completedOrders}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{
                      width: `${funnel.holdsPlaced > 0 ? (funnel.completedOrders / funnel.holdsPlaced) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-emerald-700 block mt-1 font-mono">
                  {funnel.conversionRate}% hold-to-purchase completion
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
            Uncompleted holds are automatically released by the background cron worker after 10 minutes.
          </div>
        </div>
      </div>

      {/* Recent Orders Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500">
              Confirmed ticket transactions with gateway authorization codes
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders</span>
          </button>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No orders placed yet for this organizer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-semibold">Order Number</th>
                  <th className="py-2.5 font-semibold">Customer</th>
                  <th className="py-2.5 font-semibold">Event & Tier</th>
                  <th className="py-2.5 font-semibold text-right">Quantity</th>
                  <th className="py-2.5 font-semibold text-right">Amount</th>
                  <th className="py-2.5 font-semibold">Gateway Ref</th>
                  <th className="py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 font-semibold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 font-sans font-medium text-slate-800">
                      <div>{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                    </td>
                    <td className="py-3 font-sans text-slate-700">
                      <div>{order.eventTitle}</div>
                      <div className="text-[11px] text-slate-400">{order.tierName}</div>
                    </td>
                    <td className="py-3 text-right tabular-nums text-slate-700">{order.quantity}</td>
                    <td className="py-3 text-right tabular-nums font-semibold text-slate-900">
                      ${order.totalAmount}
                    </td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {order.transaction?.transactionRef || 'N/A'}
                    </td>
                    <td className="py-3 font-sans">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        PAID
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Host New Event</h3>
                <p className="text-xs text-slate-500">Configure tiered ticketing, capacity, and sales cutoff dates</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Cloud & Distributed Systems Summit 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide an overview of the event schedule, keynotes, and what attendees will experience..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Music">Music</option>
                    <option value="Design & Art">Design & Art</option>
                    <option value="Business">Business</option>
                    <option value="Science">Science</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue Name</label>
                  <input
                    type="text"
                    required
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g., Moscone West Hall"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Event Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Cut-Off Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={salesCutoffDate}
                    onChange={(e) => setSalesCutoffDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                  />
                </div>
              </div>

              {/* Ticket Tiers Section */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-900">
                    Ticket Tiers & Capacity Quotas
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTier}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Tier</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {tiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          required
                          value={tier.name}
                          onChange={(e) => {
                            const updated = [...tiers];
                            updated[idx].name = e.target.value;
                            setTiers(updated);
                          }}
                          placeholder="Tier Name (e.g., VIP, GA)"
                          className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs font-semibold"
                        />

                        {tiers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Price (USD)</span>
                          <input
                            type="number"
                            required
                            min={0}
                            value={tier.price}
                            onChange={(e) => {
                              const updated = [...tiers];
                              updated[idx].price = Number(e.target.value);
                              setTiers(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs"
                          />
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block">Total Seat Capacity</span>
                          <input
                            type="number"
                            required
                            min={1}
                            value={tier.totalCapacity}
                            onChange={(e) => {
                              const updated = [...tiers];
                              updated[idx].totalCapacity = Number(e.target.value);
                              setTiers(updated);
                            }}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block">Included Perks (comma-separated)</span>
                        <input
                          type="text"
                          value={tier.perks}
                          onChange={(e) => {
                            const updated = [...tiers];
                            updated[idx].perks = e.target.value;
                            setTiers(updated);
                          }}
                          placeholder="Front row seating, Free drink voucher, Swag kit"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{submitting ? 'Publishing Event...' : 'Publish Event'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
