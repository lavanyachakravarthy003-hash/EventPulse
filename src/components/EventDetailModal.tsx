import React, { useState } from 'react';
import { Event, TicketTier } from '../types/index.ts';
import {
  X,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Users,
} from 'lucide-react';

interface EventDetailModalProps {
  event: Event | null;
  onClose: () => void;
  onPlaceHold: (eventId: string, tierId: string, quantity: number) => Promise<boolean>;
  loading: boolean;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onPlaceHold,
  loading,
}) => {
  if (!event) return null;

  const [selectedTierId, setSelectedTierId] = useState<string>(event.tiers[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTier = event.tiers.find((t) => t.id === selectedTierId) || event.tiers[0];

  const handleHoldSubmit = async () => {
    setErrorMessage(null);
    if (!selectedTier) return;

    try {
      const ok = await onPlaceHold(event.id, selectedTier.id, quantity);
      if (ok) {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reserve tickets. Please try again.');
    }
  };

  const startDateFormatted = new Date(event.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const cutoffFormatted = new Date(event.salesCutoffDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header Media */}
        <div className="relative aspect-21/9 w-full bg-slate-900 shrink-0 overflow-hidden">
          <img
            src={event.imageUrl}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6 text-white">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-300 mb-1">
              <span>{event.category}</span>
              <span aria-hidden="true">·</span>
              <span>Organized by {event.organizerName}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {event.title}
            </h2>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block">Date & Time</span>
                <span>{startDateFormatted}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block">Location</span>
                <span>{event.venueName}, {event.location}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-2">About This Event</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Tier Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-900">
                Select Ticket Tier
              </h4>
              <span className="text-[11px] text-slate-500">
                Sales cut-off: {cutoffFormatted}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {event.tiers.map((tier) => {
                const available = Math.max(0, tier.totalCapacity - (tier.soldCount + tier.heldCount));
                const isSelected = selectedTierId === tier.id;
                const isSoldOut = available <= 0;

                return (
                  <button
                    key={tier.id}
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => {
                      setSelectedTierId(tier.id);
                      setErrorMessage(null);
                    }}
                    className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-600'
                        : isSoldOut
                        ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                        <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          ${tier.price}
                        </span>
                      </div>

                      {tier.description && (
                        <p className="text-[11px] text-slate-500 mb-3 line-clamp-2">
                          {tier.description}
                        </p>
                      )}

                      {/* Tier Perks */}
                      <ul className="space-y-1 mb-3">
                        {tier.perks.slice(0, 3).map((perk, i) => (
                          <li key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Inventory bar */}
                    <div className="pt-2 border-t border-slate-100 text-[11px]">
                      <div className="flex justify-between text-slate-500 mb-1">
                        <span>Availability</span>
                        <span className="font-mono tabular-nums font-semibold text-slate-700">
                          {isSoldOut ? 'Sold Out' : `${available} left`}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          className="bg-slate-700 h-full"
                          style={{ width: `${(tier.soldCount / tier.totalCapacity) * 100}%` }}
                          title={`Sold: ${tier.soldCount}`}
                        />
                        <div
                          className="bg-amber-400 h-full"
                          style={{ width: `${(tier.heldCount / tier.totalCapacity) * 100}%` }}
                          title={`Held: ${tier.heldCount}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>{tier.soldCount} sold</span>
                        <span>{tier.heldCount} currently held</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selector & Reservation Action */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-700">Quantity:</span>
              <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  -
                </button>
                <span className="px-3 py-1.5 text-xs font-mono font-bold text-slate-900 tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(6, quantity + 1))}
                  className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  +
                </button>
              </div>

              {selectedTier && (
                <div className="text-xs">
                  <span className="text-slate-500">Total: </span>
                  <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                    ${selectedTier.price * quantity}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={loading || !selectedTier}
                onClick={handleHoldSubmit}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{loading ? 'Reserving Lock...' : 'Place 10-Minute Hold'}</span>
              </button>
            </div>
          </div>

          {/* Error notice if concurrency lock rejected (e.g. 409 Conflict) */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Concurrency Lock Notice</span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Explanatory guarantee */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Transactional locking ensures zero double-booking. When you click hold, inventory is decremented atomically for 10 minutes.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
