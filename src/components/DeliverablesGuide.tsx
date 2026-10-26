import React, { useState } from 'react';
import {
  FileCode2,
  Download,
  Copy,
  Check,
  Database,
  Send,
  Terminal,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  ArrowRight,
  GitBranch,
  Cloud,
} from 'lucide-react';

export const DeliverablesGuide: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'erd' | 'postman' | 'windows-guide'>('erd');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownloadPostman = () => {
    window.location.href = '/api/deliverables/postman?download=true';
  };

  const handleDownloadPrisma = () => {
    window.location.href = '/api/deliverables/prisma';
  };

  const handleDownloadDocker = () => {
    window.location.href = '/api/deliverables/docker';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Evaluation Deliverables & Windows Setup Guide
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official evaluation requirements: ER Diagram, Postman test collection, and beginner-level Windows VS Code instructions.
          </p>
        </div>

        {/* Deliverables Quick Download Group */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadPostman}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Postman (.json)</span>
          </button>

          <button
            onClick={handleDownloadPrisma}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5" />
            <span>schema.prisma</span>
          </button>

          <button
            onClick={handleDownloadDocker}
            className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>docker-compose.yml</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation (Interactive functional buttons) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('erd')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'erd'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>1. Entity Relationship (ER) Diagram</span>
        </button>

        <button
          onClick={() => setActiveSubTab('postman')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'postman'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>2. Postman API Test Suite (Edge Cases)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('windows-guide')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'windows-guide'
              ? 'bg-slate-900 text-white font-semibold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>3. Windows & VS Code Beginner Guide</span>
        </button>
      </div>

      {/* SUB-TAB 1: ER DIAGRAM */}
      {activeSubTab === 'erd' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Relational Data Architecture (PostgreSQL Schema)
                </h3>
                <p className="text-xs text-slate-500">
                  Data model detailing 7 core entities with primary keys (PK), foreign keys (FK), and concurrency indexes.
                </p>
              </div>

              <button
                onClick={handleDownloadPrisma}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Export Prisma Schema</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Visual ER Diagram Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {/* User Entity */}
              <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden text-xs">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>USERS</span>
                  <span className="text-[10px] text-slate-400 font-mono">RBAC Root</span>
                </div>
                <div className="p-3 font-mono space-y-1 text-[11px]">
                  <div className="text-indigo-600 font-bold">PK  id : UUID</div>
                  <div>•   email : String (UNIQUE)</div>
                  <div>•   passwordHash : String</div>
                  <div>•   name : String</div>
                  <div className="text-amber-600">•   role : 'ADMIN' | 'ORGANIZER' | 'ATTENDEE'</div>
                  <div>•   organizationName : String?</div>
                  <div>•   createdAt : Timestamp</div>
                </div>
              </div>

              {/* Event Entity */}
              <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden text-xs">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>EVENTS</span>
                  <span className="text-[10px] text-slate-400 font-mono">Tenant Entity</span>
                </div>
                <div className="p-3 font-mono space-y-1 text-[11px]">
                  <div className="text-indigo-600 font-bold">PK  id : UUID</div>
                  <div className="text-emerald-600">FK  organizerId → USERS(id)</div>
                  <div>•   title : String</div>
                  <div>•   category : String</div>
                  <div>•   location : String</div>
                  <div>•   startDate : Timestamp</div>
                  <div>•   salesCutoffDate : Timestamp</div>
                  <div className="text-amber-600">•   status : 'ACTIVE' | 'DRAFT'</div>
                  <div>•   viewsCount : Int (Redis sync)</div>
                </div>
              </div>

              {/* TicketTier Entity */}
              <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden text-xs">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>TICKET_TIERS</span>
                  <span className="text-[10px] text-slate-400 font-mono">Row Lock Anchor</span>
                </div>
                <div className="p-3 font-mono space-y-1 text-[11px]">
                  <div className="text-indigo-600 font-bold">PK  id : UUID</div>
                  <div className="text-emerald-600">FK  eventId → EVENTS(id)</div>
                  <div>•   name : String (VIP, GA, Early)</div>
                  <div>•   price : Decimal(10,2)</div>
                  <div className="text-indigo-700 font-bold">•   totalCapacity : Int</div>
                  <div className="text-amber-700 font-bold">•   heldCount : Int (10-min lock)</div>
                  <div className="text-emerald-700 font-bold">•   soldCount : Int (Paid orders)</div>
                  <div>•   salesCutoffDate : Timestamp</div>
                </div>
              </div>

              {/* ReservationHold Entity */}
              <div className="bg-slate-50 rounded-lg border border-amber-300 overflow-hidden text-xs ring-1 ring-amber-400/50">
                <div className="bg-amber-600 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>RESERVATION_HOLDS</span>
                  <span className="text-[10px] text-amber-200 font-mono">10-Min Timer</span>
                </div>
                <div className="p-3 font-mono space-y-1 text-[11px]">
                  <div className="text-indigo-600 font-bold">PK  id : UUID</div>
                  <div className="text-emerald-600">FK  userId → USERS(id)</div>
                  <div className="text-emerald-600">FK  eventId → EVENTS(id)</div>
                  <div className="text-emerald-600">FK  tierId → TICKET_TIERS(id)</div>
                  <div>•   quantity : Int</div>
                  <div className="text-amber-700 font-bold">•   status : 'HELD' | 'EXPIRED'</div>
                  <div className="text-red-600 font-bold">•   expiresAt : Timestamp (now+10m)</div>
                </div>
              </div>

              {/* Order Entity */}
              <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden text-xs">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>ORDERS</span>
                  <span className="text-[10px] text-slate-400 font-mono">Committed Order</span>
                </div>
                <div className="p-3 font-mono space-y-1 text-[11px]">
                  <div className="text-indigo-600 font-bold">PK  id : UUID</div>
                  <div>•   orderNumber : String (ORD-2026-...)</div>
                  <div className="text-emerald-600">FK  userId → USERS(id)</div>
                  <div className="text-emerald-600">FK  eventId → EVENTS(id)</div>
                  <div className="text-emerald-600">FK  tierId → TICKET_TIERS(id)</div>
                  <div className="text-emerald-600">FK  reservationId → RESERVATIONS(id)</div>
                  <div>•   quantity : Int</div>
                  <div>•   totalAmount : Decimal(10,2)</div>
                  <div className="text-emerald-700 font-bold">•   status : 'PAID'</div>
                </div>
              </div>

              {/* Tickets & Transactions */}
              <div className="bg-slate-50 rounded-lg border border-slate-300 overflow-hidden text-xs">
                <div className="bg-slate-900 text-white px-3 py-2 font-bold flex items-center justify-between">
                  <span>TICKETS & TRANSACTIONS</span>
                  <span className="text-[10px] text-slate-400 font-mono">Vouchers & Ledger</span>
                </div>
                <div className="p-3 font-mono space-y-1 text-[11px]">
                  <div className="text-indigo-600 font-bold">TICKETS:</div>
                  <div className="text-emerald-600">FK  orderId → ORDERS(id)</div>
                  <div>•   ticketCode : String (UNIQUE)</div>
                  <div>•   qrCodeValue : String</div>
                  <div>•   status : 'VALID' | 'CHECKED_IN'</div>
                  <div className="text-indigo-600 font-bold pt-1 border-t border-slate-200">TRANSACTIONS:</div>
                  <div className="text-emerald-600">FK  orderId → ORDERS(id)</div>
                  <div>•   transactionRef : String</div>
                  <div>•   amount : Decimal(10,2)</div>
                  <div className="text-emerald-600">•   status : 'SUCCESS' | 'DECLINED'</div>
                </div>
              </div>
            </div>

            {/* Relationship Semantics Note */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <span className="font-semibold text-slate-900 block">Cardinality & Concurrency Mechanics:</span>
              <ul className="list-disc pl-5 space-y-1 text-slate-600">
                <li><span className="font-semibold text-slate-800">USERS (1) → (N) EVENTS</span>: Organizers manage multi-tenant event listings.</li>
                <li><span className="font-semibold text-slate-800">EVENTS (1) → (N) TICKET_TIERS</span>: Events offer tiered pricing (VIP, GA, Early Bird).</li>
                <li><span className="font-semibold text-slate-800">TICKET_TIERS (1) → (N) RESERVATION_HOLDS</span>: Protected by <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">SELECT ... FOR UPDATE</code> to ensure <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">heldCount + soldCount &le; totalCapacity</code> at all times.</li>
                <li><span className="font-semibold text-slate-800">RESERVATION_HOLDS (1) → (1) ORDERS</span>: Checkout can only occur if hold is unexpired (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">expiresAt &gt; now()</code>).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: POSTMAN TEST SUITE */}
      {activeSubTab === 'postman' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Postman API Test Collection (v2.1.0)
                </h3>
                <p className="text-xs text-slate-500">
                  12 preconfigured REST endpoints with automated JavaScript assertions testing RBAC, Redis caching, 10-minute holds, and concurrency race conditions.
                </p>
              </div>

              <button
                onClick={handleDownloadPostman}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Collection JSON</span>
              </button>
            </div>

            {/* Test Case Overview Matrix */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                  <tr>
                    <th className="p-3">Folder</th>
                    <th className="p-3">Request Name</th>
                    <th className="p-3">Method & Route</th>
                    <th className="p-3">Automated Test Assertions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-900">1. Auth</td>
                    <td className="p-3 font-sans">Login as Attendee / Organizer</td>
                    <td className="p-3 text-indigo-600 font-semibold">POST /api/auth/login</td>
                    <td className="p-3 font-sans text-slate-600">Assert status 200, sets bearer token, verifies role in payload.</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-900">2. Caching</td>
                    <td className="p-3 font-sans">Get All Active Events</td>
                    <td className="p-3 text-emerald-600 font-semibold">GET /api/events</td>
                    <td className="p-3 font-sans text-slate-600">Asserts <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">X-Cache: HIT</code> header on second request (&lt;2ms).</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-900">3. Reservation</td>
                    <td className="p-3 font-sans">Place 10-Minute Hold</td>
                    <td className="p-3 text-amber-600 font-semibold">POST /api/reservations/hold</td>
                    <td className="p-3 font-sans text-slate-600">Asserts status 201, verifies <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">expiresAt</code> is exactly now() + 10m.</td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="p-3 font-sans font-medium text-slate-900">4. Edge Case</td>
                    <td className="p-3 font-sans font-semibold text-amber-900">Concurrent Booking Race Test</td>
                    <td className="p-3 text-purple-600 font-semibold">POST /api/simulate/concurrency</td>
                    <td className="p-3 font-sans text-amber-900 font-semibold">
                      Asserts <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">doubleBookingsCount === 0</code>, asserts 409 Conflict on overselling.
                    </td>
                  </tr>
                  <tr className="bg-red-50/40">
                    <td className="p-3 font-sans font-medium text-slate-900">5. Edge Case</td>
                    <td className="p-3 font-sans font-semibold text-red-900">Expired Hold Checkout Rejection</td>
                    <td className="p-3 text-red-600 font-semibold">POST /api/checkout</td>
                    <td className="p-3 font-sans text-red-800 font-semibold">
                      Asserts status 400 Bad Request (<code className="bg-red-100 px-1 py-0.5 rounded font-mono">ERR_HOLD_EXPIRED</code>).
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-sans font-medium text-slate-900">6. Background</td>
                    <td className="p-3 font-sans">Trigger Expiry Worker</td>
                    <td className="p-3 text-slate-800 font-semibold">POST /api/worker/tick</td>
                    <td className="p-3 font-sans text-slate-600">Asserts status 200, reports released expired seat counts.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <span className="font-semibold text-slate-900 block">How to Import into Postman:</span>
              <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                <li>Click <strong>Download Postman (.json)</strong> above to save <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">EventPulse_Ticketing_API.postman_collection.json</code>.</li>
                <li>Open Postman &rarr; Click <strong>Import</strong> in the top left &rarr; Select or drop the downloaded JSON file.</li>
                <li>The collection comes with <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">baseUrl = {window.location.origin}</code> automatically preconfigured.</li>
                <li>Click <strong>Run Collection</strong> to execute all requests and view the automated test passes!</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WINDOWS & VS CODE BEGINNER GUIDE */}
      {activeSubTab === 'windows-guide' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Step-by-Step Guide: Building This Project from Scratch on Windows
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Written for beginners using Windows 10/11, VS Code, Node.js, PostgreSQL, Prisma, and Redis.
              </p>
            </div>

            {/* STEP 1: PREREQUISITES */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  1
                </span>
                <span>Install Prerequisites on Windows</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <p>Ensure you have the following installed on your Windows machine:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Node.js (v20 or v22 LTS)</strong>: Download from <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-indigo-600 underline">nodejs.org</a> (includes npm).</li>
                  <li><strong>VS Code</strong>: Download from <a href="https://code.visualstudio.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">code.visualstudio.com</a>.</li>
                  <li><strong>PostgreSQL</strong>: Install via PostgreSQL Windows Installer from <a href="https://www.postgresql.org/download/windows/" target="_blank" rel="noreferrer" className="text-indigo-600 underline">postgresql.org</a> (or use Docker Desktop).</li>
                  <li><strong>Redis</strong>: Either run via Docker Desktop (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono">docker run -d -p 6379:6379 redis:alpine</code>) or WSL2.</li>
                </ul>
              </div>
            </div>

            {/* STEP 2: PROJECT DIRECTORY SETUP */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  2
                </span>
                <span>Initialize Project in Windows Terminal (PowerShell)</span>
              </div>
              <p className="text-xs text-slate-600">
                Open <strong>PowerShell</strong> or the <strong>VS Code Terminal (Ctrl + `)</strong> and run:
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
{`# 1. Create project folder and open in VS Code
mkdir eventpulse-app
cd eventpulse-app
code .

# 2. Initialize Node.js project
npm init -y

# 3. Install core backend packages
npm install express cors dotenv @prisma/client jsonwebtoken bcryptjs ioredis
npm install -D typescript tsx @types/express @types/node @types/cors @types/jsonwebtoken @types/bcryptjs prisma

# 4. Initialize Prisma with PostgreSQL
npx prisma init`}
                </pre>
                <button
                  onClick={() =>
                    handleCopy(
                      'term1',
                      'mkdir eventpulse-app\ncd eventpulse-app\ncode .\nnpm init -y\nnpm install express cors dotenv @prisma/client jsonwebtoken bcryptjs ioredis\nnpm install -D typescript tsx @types/express @types/node @types/cors @types/jsonwebtoken @types/bcryptjs prisma\nnpx prisma init'
                    )
                  }
                  className="absolute top-3 right-3 px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded text-[11px] font-sans flex items-center gap-1"
                >
                  {copiedSection === 'term1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'term1' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* STEP 3: ENVIRONMENT VARIABLES (.env) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  3
                </span>
                <span>Configure Environment Variables (<code className="font-mono text-indigo-600">.env</code>)</span>
              </div>
              <p className="text-xs text-slate-600">
                In the root of your project, create or open <code className="font-mono text-slate-800">.env</code> and add:
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
{`# PostgreSQL Connection String (adjust user/password to your local credentials)
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/eventpulse_db?schema=public"

# Redis Connection URL
REDIS_URL="redis://localhost:6379"

# JWT Secret for RBAC Auth
JWT_SECRET="eventpulse_secure_jwt_secret_key_2026"

# Port
PORT=3000`}
                </pre>
                <button
                  onClick={() =>
                    handleCopy(
                      'env1',
                      'DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/eventpulse_db?schema=public"\nREDIS_URL="redis://localhost:6379"\nJWT_SECRET="eventpulse_secure_jwt_secret_key_2026"\nPORT=3000'
                    )
                  }
                  className="absolute top-3 right-3 px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded text-[11px] font-sans flex items-center gap-1"
                >
                  {copiedSection === 'env1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'env1' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* STEP 4: PRISMA SCHEMA */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  4
                </span>
                <span>Save Prisma Schema (<code className="font-mono text-indigo-600">prisma/schema.prisma</code>)</span>
              </div>
              <p className="text-xs text-slate-600">
                Replace <code className="font-mono">prisma/schema.prisma</code> with our complete transactional schema:
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs max-h-64 overflow-y-auto">
{`datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  ADMIN
  ORGANIZER
  ATTENDEE
}

model User {
  id               String            @id @default(uuid())
  email            String            @unique
  passwordHash     String
  name             String
  role             Role              @default(ATTENDEE)
  organizationName String?
  createdAt        DateTime          @default(now())
  events           Event[]           @relation("OrganizerEvents")
  reservations     ReservationHold[]
  orders           Order[]
}

model Event {
  id              String            @id @default(uuid())
  organizerId     String
  organizer       User              @relation("OrganizerEvents", fields: [organizerId], references: [id])
  title           String
  description     String            @db.Text
  category        String
  location        String
  venueName       String
  imageUrl        String
  startDate       DateTime
  salesCutoffDate DateTime
  status          String            @default("ACTIVE")
  tiers           TicketTier[]
  reservations    ReservationHold[]
  orders          Order[]
}

model TicketTier {
  id              String            @id @default(uuid())
  eventId         String
  event           Event             @relation(fields: [eventId], references: [id])
  name            String
  price           Decimal           @db.Decimal(10, 2)
  totalCapacity   Int
  heldCount       Int               @default(0) // incremented on 10-min hold
  soldCount       Int               @default(0) // incremented on checkout
  salesCutoffDate DateTime
  perks           String[]
  reservations    ReservationHold[]
  orders          Order[]
  tickets         Ticket[]
}

model ReservationHold {
  id             String      @id @default(uuid())
  userId         String
  user           User        @relation(fields: [userId], references: [id])
  eventId        String
  event          Event       @relation(fields: [eventId], references: [id])
  tierId         String
  tier           TicketTier  @relation(fields: [tierId], references: [id])
  quantity       Int
  status         String      @default("HELD") // HELD | EXPIRED | COMPLETED | CANCELLED
  expiresAt      DateTime    // Set to now() + 10 minutes
  createdAt      DateTime    @default(now())
  order          Order?
}

model Order {
  id              String           @id @default(uuid())
  orderNumber     String           @unique
  userId          String
  user            User             @relation(fields: [userId], references: [id])
  eventId         String
  event           Event            @relation(fields: [eventId], references: [id])
  tierId          String
  tier            TicketTier       @relation(fields: [tierId], references: [id])
  reservationId   String?          @unique
  reservation     ReservationHold? @relation(fields: [reservationId], references: [id])
  quantity        Int
  totalAmount     Decimal          @db.Decimal(10, 2)
  status          String           @default("PAID")
  createdAt       DateTime         @default(now())
  tickets         Ticket[]
  transaction     Transaction?
}

model Ticket {
  id             String       @id @default(uuid())
  orderId        String
  order          Order        @relation(fields: [orderId], references: [id])
  tierId         String
  tier           TicketTier   @relation(fields: [tierId], references: [id])
  ticketCode     String       @unique
  attendeeName   String
  qrCodeValue    String       @unique
  status         String       @default("VALID")
  createdAt      DateTime     @default(now())
}

model Transaction {
  id                 String         @id @default(uuid())
  orderId            String         @unique
  order              Order          @relation(fields: [orderId], references: [id])
  paymentGateway     String         @default("STRIPE_SIMULATOR")
  transactionRef     String         @unique
  amount             Decimal        @db.Decimal(10, 2)
  status             String         @default("SUCCESS")
  authCode           String
  simulatedLatencyMs Int
  createdAt          DateTime       @default(now())
}`}
                </pre>
                <button
                  onClick={handleDownloadPrisma}
                  className="absolute top-3 right-3 px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded text-[11px] font-sans flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download schema.prisma</span>
                </button>
              </div>
            </div>

            {/* STEP 5: RUN MIGRATIONS & SEED */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  5
                </span>
                <span>Run Database Migrations in PowerShell</span>
              </div>
              <p className="text-xs text-slate-600">
                Execute Prisma migration to create tables in PostgreSQL:
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
{`# Run initial database migration
npx prisma migrate dev --name init

# Generate TypeScript Prisma Client
npx prisma generate`}
                </pre>
                <button
                  onClick={() => handleCopy('mig1', 'npx prisma migrate dev --name init\nnpx prisma generate')}
                  className="absolute top-3 right-3 px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded text-[11px] font-sans flex items-center gap-1"
                >
                  {copiedSection === 'mig1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'mig1' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* STEP 6: DOCKER COMPOSE */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  6
                </span>
                <span>Optional: One-Click Docker Compose (Postgres + Redis)</span>
              </div>
              <p className="text-xs text-slate-600">
                If you have Docker Desktop for Windows installed, you don't need to manually configure Postgres or Redis. Just place this <code className="font-mono">docker-compose.yml</code> in your project root:
              </p>
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs overflow-x-auto">
{`# Start PostgreSQL and Redis containers with 1 command
docker compose up -d`}
                </pre>
                <button
                  onClick={handleDownloadDocker}
                  className="absolute top-3 right-3 px-2 py-1 bg-slate-800 text-slate-200 hover:bg-slate-700 rounded text-[11px] font-sans flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download docker-compose.yml</span>
                </button>
              </div>
            </div>

            {/* STEP 7: CLOUD DEPLOYMENT STEPS */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">
                  7
                </span>
                <span>Deploying to Cloud (Render / Railway)</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                <p className="font-semibold text-slate-900">Recommended: Render or Railway Deployment</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li><strong>PostgreSQL Database</strong>: Create a free PostgreSQL instance on <a href="https://render.com" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Render</a> or <a href="https://railway.app" target="_blank" rel="noreferrer" className="text-indigo-600 underline">Railway</a>. Copy the External Database URL.</li>
                  <li><strong>Redis Instance</strong>: Provision Redis on Upstash or Render.</li>
                  <li><strong>Web Service</strong>: Link your GitHub repository, set Build Command to <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">npm install && npx prisma generate && npm run build</code>, and Start Command to <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">npm run start</code>.</li>
                  <li><strong>Environment Variables</strong>: Add <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">DATABASE_URL</code>, <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">REDIS_URL</code>, and <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">JWT_SECRET</code> in the service dashboard.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
