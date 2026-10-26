import React from 'react';
import { Order } from '../types/index.ts';
import {
  CheckCircle2,
  X,
  QrCode,
  Calendar,
  MapPin,
  Download,
  Share2,
  Check,
} from 'lucide-react';

interface TicketSuccessModalProps {
  order: Order | null;
  onClose: () => void;
}

export const TicketSuccessModal: React.FC<TicketSuccessModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  const handleCopyOrder = () => {
    navigator.clipboard.writeText(order.orderNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Top Celebration */}
        <div className="bg-emerald-600 text-white p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-100">
              Booking Confirmed
            </span>
          </div>

          <h3 className="text-xl font-bold tracking-tight text-white mb-1">
            You're Going!
          </h3>
          <p className="text-xs text-emerald-100">
            Order <span className="font-mono font-semibold">{order.orderNumber}</span> has been processed. Tickets are generated below.
          </p>
        </div>

        {/* Tickets Body */}
        <div className="p-6 space-y-6">
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="p-4 bg-white border-b border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Event</span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">{order.eventTitle}</h4>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
                <span className="font-semibold">{order.tierName}</span>
                <span aria-hidden="true">·</span>
                <span>{order.quantity} Ticket(s)</span>
              </div>
            </div>

            {/* Generated Tickets with QR */}
            <div className="p-4 divide-y divide-slate-200 space-y-4">
              {order.tickets.map((ticket, index) => (
                <div key={ticket.id} className={`${index > 0 ? 'pt-4' : ''} flex items-center justify-between gap-4`}>
                  <div>
                    <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                      Attendee {index + 1}
                    </div>
                    <div className="text-xs font-bold text-slate-900">{ticket.attendeeName}</div>
                    <div className="text-xs font-mono font-medium text-indigo-600 mt-0.5">
                      {ticket.ticketCode}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">Status: VALID FOR ENTRY</div>
                  </div>

                  {/* QR Code SVG */}
                  <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
                      {/* Geometric simulated QR code matrix */}
                      <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                      <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                      <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                      {/* Random data pattern */}
                      <rect x="40" y="10" width="10" height="10" fill="currentColor" />
                      <rect x="55" y="15" width="8" height="8" fill="currentColor" />
                      <rect x="45" y="35" width="12" height="12" fill="currentColor" />
                      <rect x="65" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="25" y="45" width="10" height="10" fill="currentColor" />
                      <rect x="40" y="65" width="10" height="10" fill="currentColor" />
                      <rect x="55" y="75" width="15" height="10" fill="currentColor" />
                      <rect x="75" y="70" width="10" height="15" fill="currentColor" />
                    </svg>
                    <span className="text-[8px] font-mono text-slate-400 mt-0.5">SCAN AT GATE</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Details */}
            {order.transaction && (
              <div className="p-3 bg-slate-100 border-t border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Transaction Reference:</span>
                  <span className="font-mono">{order.transaction.transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span>Authorization Code:</span>
                  <span className="font-mono text-slate-800">{order.transaction.authCode}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span className="font-mono tabular-nums">${order.totalAmount} USD</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyOrder}
              className="flex-1 px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-600" />}
              <span>{copied ? 'Copied Order ID' : 'Copy Order ID'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Print / Save Tickets</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
