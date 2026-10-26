import React, { useState, useEffect } from 'react';
import { ReservationHold, CacheTelemetry } from '../types/index.ts';
import {
  Shield,
  Clock,
  Database,
  RefreshCw,
  Zap,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
} from 'lucide-react';

export const AdminConsole: React.FC = () => {
  const [data, setData] = useState<{
    totalEvents: number;
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    activeHoldsCount: number;
    activeHolds: ReservationHold[];
    cacheTelemetry: CacheTelemetry;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [triggeringWorker, setTriggeringWorker] = useState(false);
  const [workerResult, setWorkerResult] = useState<string | null>(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerWorker = async () => {
    setTriggeringWorker(true);
    setWorkerResult(null);
    try {
      const res = await fetch('/api/worker/tick', { method: 'POST' });
      const json = await res.json();
      setWorkerResult(
        `Worker tick executed: Released ${json.result.expiredCount} hold(s) (${json.result.releasedSeatsCount} seat(s)).`
      );
      fetchAdminData();
    } catch (err: any) {
      setWorkerResult(`Worker error: ${err.message}`);
    } finally {
      setTriggeringWorker(false);
    }
  };

  const handleForceExpire = async (holdId: string) => {
    try {
      const res = await fetch(`/api/worker/expire-now/${holdId}`, { method: 'POST' });
      if (res.ok) {
        setWorkerResult(`Hold ${holdId} was forcefully expired. Inventory restored!`);
        fetchAdminData();
      }
    } catch (err: any) {
      setWorkerResult(`Error expiring hold: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center text-slate-500 text-xs">
        Loading admin telemetry...
      </div>
    );
  }

  const {
    totalEvents = 0,
    totalUsers = 0,
    totalOrders = 0,
    totalRevenue = 0,
    activeHolds = [],
    cacheTelemetry = { hits: 0, misses: 0, hitRatio: 0, totalKeys: 0, lastInvalidation: '' },
  } = data || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Admin Governance Console
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide multi-tenant monitoring, Redis cache telemetry, and background hold expiration workers.
          </p>
        </div>

        <button
          onClick={handleTriggerWorker}
          disabled={triggeringWorker}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${triggeringWorker ? 'animate-spin' : ''}`} />
          <span>Trigger Background Cron Worker Now</span>
        </button>
      </div>

      {workerResult && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{workerResult}</span>
        </div>
      )}

      {/* Platform Multi-Tenant Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Platform GMV</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            ${totalRevenue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all organizer tenants</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Published Events</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalEvents}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active event listings</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Total Confirmed Orders</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalOrders}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Completed checkouts</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Active 10-Min Holds</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 mt-1">
            {activeHolds.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Seats currently reserved</span>
        </div>
      </div>

      {/* Redis Cache Telemetry Panel */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-bold tracking-tight">
              Redis Caching Layer Telemetry
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">TTL: 30s Key Expiry</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Cache Hits</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {cacheTelemetry.hits}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Cache Misses</span>
            <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
              {cacheTelemetry.misses}
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Cache Hit Ratio</span>
            <span className="text-xl font-bold font-mono text-sky-400 tabular-nums">
              {cacheTelemetry.hitRatio}%
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60">
            <span className="text-[11px] text-slate-400 block">Active Cache Keys</span>
            <span className="text-xl font-bold font-mono text-indigo-300 tabular-nums">
              {cacheTelemetry.totalKeys}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Heavy read traffic for active event listings is absorbed by Redis with ~1.2ms latency, reducing PostgreSQL load while cache invalidation guarantees fresh inventory when seats are reserved.
        </p>
      </div>

      {/* Real-time Hold Expiry Watcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live 10-Minute Hold Expiry Watcher
            </h3>
            <p className="text-xs text-slate-500">
              Background cron worker runs automatically every 5s to release expired seats back to inventory
            </p>
          </div>
        </div>

        {activeHolds.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No active reservation holds currently in progress across the system.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 font-semibold">Hold ID</th>
                  <th className="py-2.5 font-semibold">Attendee</th>
                  <th className="py-2.5 font-semibold">Event & Tier</th>
                  <th className="py-2.5 font-semibold text-right">Quantity</th>
                  <th className="py-2.5 font-semibold text-right">Expires At</th>
                  <th className="py-2.5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeHolds.map((hold) => {
                  const remainingSec = Math.max(
                    0,
                    Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 1000)
                  );
                  const min = Math.floor(remainingSec / 60);
                  const sec = remainingSec % 60;
                  const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;

                  return (
                    <tr key={hold.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 font-semibold text-slate-900">{hold.id}</td>
                      <td className="py-3 font-sans">
                        <div>{hold.attendeeName}</div>
                        <div className="text-[11px] text-slate-400">{hold.attendeeEmail}</div>
                      </td>
                      <td className="py-3 font-sans">
                        <div>{hold.eventTitle}</div>
                        <div className="text-[11px] text-slate-400">{hold.tierName}</div>
                      </td>
                      <td className="py-3 text-right tabular-nums font-bold text-slate-800">
                        {hold.quantity}
                      </td>
                      <td className="py-3 text-right">
                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold tabular-nums">
                          {timeStr} left
                        </span>
                      </td>
                      <td className="py-3 text-right font-sans">
                        <button
                          onClick={() => handleForceExpire(hold.id)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-200 transition-colors"
                          title="Simulate 10-minute timeout immediately"
                        >
                          Force Expire
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
