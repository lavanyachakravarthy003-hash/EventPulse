import React from 'react';
import { Event } from '../types/index.ts';
import { MapPin, Calendar, Users, ArrowUpRight } from 'lucide-react';

interface EventCardProps {
  event: Event;
  onSelectEvent: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelectEvent }) => {
  const lowestPrice = Math.min(...event.tiers.map((t) => t.price));
  const totalCapacity = event.tiers.reduce((sum, t) => sum + t.totalCapacity, 0);
  const totalSold = event.tiers.reduce((sum, t) => sum + t.soldCount, 0);
  const totalHeld = event.tiers.reduce((sum, t) => sum + t.heldCount, 0);
  const available = Math.max(0, totalCapacity - (totalSold + totalHeld));

  const startDateFormatted = new Date(event.startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onSelectEvent(event)}
      className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-400 hover:shadow-md transition-all cursor-pointer flex flex-col"
    >
      {/* Event Banner Image with Aspect Ratio and Fallback */}
      <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        
        {/* Category & Status (Clean typography, zero pill) */}
        <div className="absolute bottom-3 left-3 text-xs text-white/90 font-medium drop-shadow-sm flex items-center gap-2">
          <span>{event.category}</span>
          <span aria-hidden="true">·</span>
          <span>{event.venueName}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata line with typographic separators (Strict Anti-Pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{startDateFormatted}</span>
            <span aria-hidden="true">·</span>
            <MapPin className="w-3.5 h-3.5" />
            <span>{event.location}</span>
          </div>

          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>

          <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
            {event.description}
          </p>
        </div>

        <div>
          {/* Tier Preview Strip */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500">Tiers from </span>
              <span className="font-semibold text-slate-900 font-mono tabular-nums text-sm">
                ${lowestPrice}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500">
              <Users className="w-3.5 h-3.5" />
              <span className="font-mono tabular-nums">
                {available} / {totalCapacity} left
              </span>
            </div>
          </div>

          {/* Action CTA */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-indigo-600">
            <span>Select Seats & Hold for 10 Min</span>
            <ArrowUpRight className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
