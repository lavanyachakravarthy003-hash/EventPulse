import React, { useState } from 'react';
import { ConcurrencyTestSummary } from '../types/index.ts';
import {
  Zap,
  Play,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Database,
  RefreshCw,
} from 'lucide-react';

export const ConcurrencyLab: React.FC = () => {
  const [tierId, setTierId] = useState('tier_tech_early');
  const [totalAttempts, setTotalAttempts] = useState(25);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ConcurrencyTestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch('/api/simulate/concurrency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, totalAttempts }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Test failed');
      }

      const summary: ConcurrencyTestSummary = await res.json();
      setResult(summary);
    } catch (err: any) {
      setError(err.message || 'Execution error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Concurrency & Race Condition Laboratory
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulate 10 to 50 simultaneous checkout attempts competing for the last seats to prove atomic row locking prevents double-booking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Mechanism:</span>
          <span className="px-2.5 py-1 bg-slate-900 text-white rounded text-xs font-mono font-semibold">
            PostgreSQL SELECT FOR UPDATE / Mutex Lock
          </span>
        </div>
      </div>

      {/* Control Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Ticket Tier
            </label>
            <select
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-slate-900 focus:outline-none"
            >
              <option value="tier_tech_early">Early Bird (Limited Seats · High Contest)</option>
              <option value="tier_tech_vip">VIP All-Access Pass</option>
              <option value="tier_music_backstage">Echoes VIP Backstage</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Concurrent Parallel Requests
            </label>
            <div className="flex items-center gap-2">
              {[10, 25, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalAttempts(num)}
                  className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    totalAttempts === num
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {num} reqs
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={runTest}
              disabled={testing}
              className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Firing Concurrent Race...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Launch Concurrent Booking Race</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
          <span className="font-semibold text-slate-900 block">How This Benchmark Operates:</span>
          <p>
            When you click launch, the server triggers <span className="font-mono font-semibold">{totalAttempts} asynchronous promises simultaneously</span> via <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">Promise.all</code>.
            Each request attempts to acquire the tier's transactional row lock and decrement the available capacity.
          </p>
          <p>
            Without transactional row locking, multiple threads read the same initial capacity and double-book. With our atomic locking engine, only the true remaining capacity is reserved, while all other requests receive <span className="font-mono text-red-600 font-semibold">409 Conflict</span>.
          </p>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Audit Verification Banner */}
          <div
            className={`p-6 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              result.doubleBookingsCount === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.doubleBookingsCount === 0 ? (
                <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              ) : (
                <AlertOctagon className="w-8 h-8 text-red-600 shrink-0" />
              )}
              <div>
                <h3 className="text-base font-bold">
                  {result.doubleBookingsCount === 0
                    ? 'Race Condition Test Passed: 0% Double-Booking'
                    : 'Double-Booking Detected!'}
                </h3>
                <p className="text-xs text-emerald-800">
                  {result.successfulHolds} seats were held out of {result.initialAvailable} initially available. {result.rejectedConflicts} concurrent attempts were safely rejected with 409 Conflict.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Execution Time</span>
                <span className="font-bold text-slate-900 tabular-nums">{result.executionDurationMs}ms</span>
              </div>
              <div>
                <span className="text-slate-500 block">Double Bookings</span>
                <span className="font-bold text-emerald-600 tabular-nums font-mono">{result.doubleBookingsCount}</span>
              </div>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Initial Capacity</span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {result.initialAvailable}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Total Requests Fired</span>
              <span className="text-xl font-bold font-mono tabular-nums text-slate-900">
                {result.totalAttempts}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Successful Holds (201)</span>
              <span className="text-xl font-bold font-mono tabular-nums text-emerald-600">
                {result.successfulHolds}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Rejected Sold-Out (409)</span>
              <span className="text-xl font-bold font-mono tabular-nums text-red-600">
                {result.rejectedConflicts}
              </span>
            </div>
          </div>

          {/* Request Waterfall Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Atomic Execution Waterfall Log
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Order of lock resolution
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-2">Req #</th>
                    <th className="py-2">Client Thread</th>
                    <th className="py-2">Lock Status</th>
                    <th className="py-2 text-right">HTTP Code</th>
                    <th className="py-2 text-right">Duration</th>
                    <th className="py-2">Audit Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.attempts.map((attempt) => (
                    <tr
                      key={attempt.requestId}
                      className={attempt.status === 'SUCCESS_RESERVED' ? 'bg-emerald-50/40' : ''}
                    >
                      <td className="py-2 font-semibold text-slate-800">#{attempt.requestId}</td>
                      <td className="py-2 text-slate-600">{attempt.attendeeEmail}</td>
                      <td className="py-2">
                        {attempt.status === 'SUCCESS_RESERVED' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Lock Acquired & Reserved
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600">
                            <XCircle className="w-3.5 h-3.5" />
                            Lock Checked & Rejected
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right tabular-nums font-semibold">
                        {attempt.statusCode}
                      </td>
                      <td className="py-2 text-right text-slate-500 tabular-nums">
                        {attempt.durationMs}ms
                      </td>
                      <td className="py-2 text-[11px] text-slate-600 font-sans max-w-xs truncate">
                        {attempt.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
