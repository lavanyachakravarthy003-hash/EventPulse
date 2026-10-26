import React, { useState, useEffect } from 'react';
import { ReservationHold, Order } from '../types/index.ts';
import {
  X,
  CreditCard,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';

interface CheckoutModalProps {
  hold: ReservationHold | null;
  onClose: () => void;
  onCheckoutSuccess: (order: Order) => void;
  onReleaseHold: (holdId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  hold,
  onClose,
  onCheckoutSuccess,
  onReleaseHold,
}) => {
  if (!hold) return null;

  const [customerName, setCustomerName] = useState(hold.attendeeName || 'Alice Reynolds');
  const [customerEmail, setCustomerEmail] = useState(hold.attendeeEmail || 'alice@gmail.com');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('789');
  const [simulationMode, setSimulationMode] = useState<'SUCCESS' | 'DECLINED' | 'TIMEOUT'>('SUCCESS');

  const [checkoutStep, setCheckoutStep] = useState<
    'idle' | 'validating' | 'locking' | 'gateway' | 'minting' | 'failed'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer calculation
  const calculateRemaining = () => {
    const diff = Math.max(0, new Date(hold.expiresAt).getTime() - Date.now());
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
  }, [hold.expiresAt]);

  const minutes = Math.floor(remainingSec / 60);
  const seconds = remainingSec % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalAmount = hold.tierPrice * hold.quantity;

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (remainingSec <= 0) {
      setErrorMessage('Hold has expired. Please re-select your seats.');
      return;
    }

    setErrorMessage(null);
    setCheckoutStep('validating');

    try {
      // Step 1: Validating
      await new Promise((r) => setTimeout(r, 400));
      setCheckoutStep('locking');

      // Step 2: Locking database row
      await new Promise((r) => setTimeout(r, 400));
      setCheckoutStep('gateway');

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reservationId: hold.id,
          customerName,
          customerEmail,
          paymentSimulationMode: simulationMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed during gateway processing.');
      }

      setCheckoutStep('minting');
      await new Promise((r) => setTimeout(r, 400));

      onCheckoutSuccess(data.order);
      onClose();
    } catch (err: any) {
      setCheckoutStep('failed');
      setErrorMessage(err.message || 'Transaction failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Secure Checkout</h3>
              <p className="text-xs text-slate-500">Atomic Reservation Finalization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 10-Minute Hold Status Strip */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-900">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Seats held on reserve</span>
          </div>
          <div className="font-mono font-bold text-amber-900 text-sm tabular-nums">
            {formattedTime} remaining
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 space-y-5">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-semibold text-slate-900">{hold.eventTitle}</div>
            <div className="flex justify-between text-slate-600">
              <span>{hold.quantity}x {hold.tierName} (${hold.tierPrice} ea)</span>
              <span className="font-mono tabular-nums font-semibold">${totalAmount}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform & Processing Fee</span>
              <span className="font-mono tabular-nums text-emerald-600 font-semibold">$0.00 (Waived)</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Total Due:</span>
              <span className="font-mono tabular-nums">${totalAmount}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handlePayNow} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email for Tickets
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Mock Payment Simulation Outcome Selector */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                  Mock Gateway Simulation Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Choose how the asynchronous payment gateway simulates this transaction:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSimulationMode('SUCCESS')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    simulationMode === 'SUCCESS'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Approve (200 OK)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMode('DECLINED')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    simulationMode === 'DECLINED'
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Decline (402)
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationMode('TIMEOUT')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    simulationMode === 'TIMEOUT'
                      ? 'border-red-600 bg-red-50 text-red-900'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Timeout (504)
                </button>
              </div>
            </div>

            {/* Mock Card Inputs */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Card Details (Simulation)
              </label>
              <div className="border border-slate-300 rounded-lg p-2.5 bg-white space-y-2">
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full text-xs font-mono text-slate-800 focus:outline-none"
                  placeholder="Card Number"
                />
                <div className="flex gap-2 pt-1 border-t border-slate-100 text-xs font-mono">
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-16 text-slate-700 focus:outline-none"
                    placeholder="MM/YY"
                  />
                  <span className="text-slate-300">/</span>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    className="w-16 text-slate-700 focus:outline-none"
                    placeholder="CVC"
                  />
                </div>
              </div>
            </div>

            {/* Live Progress indicator when checking out */}
            {checkoutStep !== 'idle' && checkoutStep !== 'failed' && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-indigo-900">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Processing Asynchronous Transaction...</span>
                </div>
                <div className="space-y-1 text-[11px] text-indigo-800">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verifying 10-minute hold window</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checkoutStep === 'validating' ? (
                      <span className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin inline-block" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>Acquiring PostgreSQL SELECT FOR UPDATE row lock</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checkoutStep === 'locking' || checkoutStep === 'validating' ? (
                      <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                    ) : checkoutStep === 'gateway' ? (
                      <span className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin inline-block" />
                    ) : (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>Simulating async payment gateway webhook</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checkoutStep === 'minting' ? (
                      <span className="w-3 h-3 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin inline-block" />
                    ) : (
                      <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
                    )}
                    <span>Minting tickets with secure QR codes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Checkout Failed</span>
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onReleaseHold(hold.id);
                  onClose();
                }}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Cancel & Release Hold
              </button>

              <button
                type="submit"
                disabled={checkoutStep !== 'idle' && checkoutStep !== 'failed'}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>Authorize & Pay ${totalAmount}</span>
              </button>
            </div>
          </form>

          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>256-bit TLS encrypted transaction · Atomic rollback safety</span>
          </div>
        </div>
      </div>
    </div>
  );
};
