import React, { useEffect, useState } from 'react';
import { ReservationHold } from '../types/index.ts';
import { Clock, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface ActiveHoldBannerProps {
  holds: ReservationHold[];
  onOpenCheckout: (hold: ReservationHold) => void;
  onReleaseHold: (holdId: string) => void;
}

export const ActiveHoldBanner: React.FC<ActiveHoldBannerProps> = ({
  holds,
  onOpenCheckout,
  onReleaseHold,
}) => {
  if (holds.length === 0) return null;

  const currentHold = holds[0];

  const calculateRemaining = () => {
    const diff = Math.max(0, new Date(currentHold.expiresAt).getTime() - Date.now());
    return Math.floor(diff / 1000);
  };

  const [remainingSec, setRemainingSec] = useState<number>(calculateRemaining);

  useEffect(() => {
    setRemainingSec(calculateRemaining());
    const interval = setInterval(() => {
      const sec = calculateRemaining();
      setRemainingSec(sec);
      if (sec <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentHold.id, currentHold.expiresAt]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isUrgent = remainingSec <= 120; // under 2 minutes

  if (remainingSec <= 0) {
    return (
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              Your 10-minute reservation hold has expired. The seats have been released back to general inventory.
            </span>
          </div>
          <button
            onClick={() => onReleaseHold(currentHold.id)}
            className="text-red-700 hover:text-red-900 underline font-medium"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border-b transition-colors px-4 py-3 ${
        isUrgent
          ? 'bg-amber-500 text-slate-900 border-amber-600'
          : 'bg-slate-900 text-white border-slate-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-mono font-semibold tracking-wider text-sm tabular-nums ${
              isUrgent ? 'bg-amber-600 text-white' : 'bg-slate-800 text-amber-400 border border-slate-700'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formattedTime}</span>
          </div>
          <div>
            <span className="font-semibold">{currentHold.quantity}x {currentHold.tierName}</span>
            <span className="opacity-75"> reserved for </span>
            <span className="font-medium underline decoration-slate-400">{currentHold.eventTitle}</span>
            <span className="opacity-75"> · Temporary hold guarantees no double-booking while you checkout.</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCheckout(currentHold)}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isUrgent
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
            }`}
          >
            <span>Complete Checkout (${currentHold.tierPrice * currentHold.quantity})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onReleaseHold(currentHold.id)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Release hold now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
