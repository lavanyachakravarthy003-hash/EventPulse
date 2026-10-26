import React from 'react';
import { User, ReservationHold } from '../types/index.ts';
import {
  Calendar,
  Layers,
  BarChart3,
  Shield,
  Zap,
  FileCode2,
  Clock,
  ChevronDown,
  UserCheck,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSelectUser: (user: User) => void;
  demoUsers: User[];
  activeTab: 'events' | 'organizer' | 'admin' | 'concurrency' | 'deliverables';
  onSelectTab: (tab: 'events' | 'organizer' | 'admin' | 'concurrency' | 'deliverables') => void;
  activeHolds: ReservationHold[];
  onOpenCheckout: (hold: ReservationHold) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSelectUser,
  demoUsers,
  activeTab,
  onSelectTab,
  activeHolds,
  onOpenCheckout,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const primaryHold = activeHolds.length > 0 ? activeHolds[0] : null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('events')}
              className="flex items-center gap-2 text-left focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
                EP
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                  EventPulse
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Navigation Links (Clean single-line prose) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onSelectTab('events')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'events'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Browse Events</span>
            </button>

            <button
              onClick={() => onSelectTab('organizer')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'organizer'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span>Organizer Studio</span>
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'admin'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Admin Console</span>
            </button>

            <button
              onClick={() => onSelectTab('concurrency')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'concurrency'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Concurrency Lab</span>
            </button>

            <button
              onClick={() => onSelectTab('deliverables')}
              className={`flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'deliverables'
                  ? 'text-slate-900 font-semibold border-b-2 border-slate-900'
                  : 'hover:text-slate-900'
              }`}
            >
              <FileCode2 className="w-4 h-4 text-indigo-500" />
              <span>ERD & Windows Guide</span>
            </button>
          </nav>

          {/* Zone 3: Active Hold Indicator & Role Switcher */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Active Hold Quick Pill if attendee has a reservation */}
            {primaryHold && (
              <button
                onClick={() => onOpenCheckout(primaryHold)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-xs font-medium hover:bg-amber-100 transition-colors"
                title="Click to view hold and checkout"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
                <span>
                  Hold Active: <span className="font-mono tabular-nums font-semibold">{primaryHold.remainingSeconds ?? 600}s</span>
                </span>
              </button>
            )}

            {/* Quick Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-semibold">{currentUser.role}</span>: {currentUser.name}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Test Persona (RBAC)
                  </div>
                  {demoUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        onSelectUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        u.id === currentUser.id ? 'bg-slate-50 font-semibold text-slate-900' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-500">{u.email}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 font-mono text-slate-700">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
