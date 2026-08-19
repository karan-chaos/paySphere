import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Filter, Download, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  Eye, X, Play, Pause, RotateCcw, Zap, Activity, Globe, DollarSign, Users,
  Clock, TrendingUp, TrendingDown, BarChart3, FileText, Ban, Flag, RefreshCw,
  Layers, ArrowUpRight, ArrowDownRight, Truck, Building2, ClipboardCheck,
  Package, ShoppingCart, CreditCard, CalendarDays, BadgeCheck, Briefcase,
  ShieldCheck, CircleDollarSign, CircleDot,
} from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */

type TabId = 'vendors' | 'purchase-orders' | 'contracts' | 'analytics';
type VendorStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'TERMINATED';
type PoStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'PAID' | 'CANCELLED';
type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type SimSpeed = 1 | 2 | 4;

interface Vendor {
  id: string;
  companyName: string;
  category: string;
  country: string;
  contactName: string;
  contactEmail: string;
  totalSpend: number;
  activeContracts: number;
  onTimeDelivery: number;
  qualityScore: number;
  riskTier: RiskTier;
  status: VendorStatus;
  paymentTerms: string;
  lastAudit: string;
}

interface PurchaseOrder {
  id: string;
  vendorName: string;
  vendorId: string;
  description: string;
  category: string;
  amount: number;
  currency: string;
  status: PoStatus;
  requestedBy: string;
  requestDate: string;
  approvalDate: string | null;
  deliveryDate: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

interface Contract {
  id: string;
  vendorName: string;
  title: string;
  type: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'UNDER_REVIEW';
  autoRenew: boolean;
  signedBy: string;
  sla: number;
}

/* ──────────────────────────── Mock Data ──────────────────────────── */

const INITIAL_VENDORS: Vendor[] = [
  { id: 'VND-001', companyName: 'CloudScale Infrastructure', category: 'IT Infrastructure', country: '🇺🇸 United States', contactName: 'Jason Lee', contactEmail: 'jlee@cloudscale.io', totalSpend: 2450000, activeContracts: 3, onTimeDelivery: 98.2, qualityScore: 95, riskTier: 'LOW', status: 'ACTIVE', paymentTerms: 'Net 30', lastAudit: '2026-07-15' },
  { id: 'VND-002', companyName: 'Nordic Paper & Packaging', category: 'Office Supplies', country: '🇸🇪 Sweden', contactName: 'Erik Johansson', contactEmail: 'erik@nordicpaper.se', totalSpend: 340000, activeContracts: 1, onTimeDelivery: 94.5, qualityScore: 88, riskTier: 'LOW', status: 'ACTIVE', paymentTerms: 'Net 45', lastAudit: '2026-06-20' },
  { id: 'VND-003', companyName: 'Sahara Logistics FZCO', category: 'Logistics', country: '🇦🇪 UAE', contactName: 'Ahmed Al-Rashid', contactEmail: 'ahmed@sahara-log.ae', totalSpend: 1870000, activeContracts: 2, onTimeDelivery: 82.1, qualityScore: 71, riskTier: 'HIGH', status: 'ACTIVE', paymentTerms: 'Net 60', lastAudit: '2026-05-10' },
  { id: 'VND-004', companyName: 'Vertex Consulting Group', category: 'Professional Services', country: '🇬🇧 United Kingdom', contactName: 'Olivia Hartley', contactEmail: 'o.hartley@vertexcg.co.uk', totalSpend: 920000, activeContracts: 1, onTimeDelivery: 99.1, qualityScore: 97, riskTier: 'LOW', status: 'ACTIVE', paymentTerms: 'Net 30', lastAudit: '2026-08-01' },
  { id: 'VND-005', companyName: 'Mumbai Tech Solutions Pvt', category: 'IT Outsourcing', country: '🇮🇳 India', contactName: 'Priya Nair', contactEmail: 'priya@mumbaitech.in', totalSpend: 1240000, activeContracts: 2, onTimeDelivery: 89.3, qualityScore: 82, riskTier: 'MEDIUM', status: 'PENDING_APPROVAL', paymentTerms: 'Net 45', lastAudit: '2026-04-18' },
  { id: 'VND-006', companyName: 'Shenzhen Electronics Co', category: 'Hardware', country: '🇨🇳 China', contactName: 'Wei Liu', contactEmail: 'wei@sz-electronics.cn', totalSpend: 3100000, activeContracts: 4, onTimeDelivery: 76.4, qualityScore: 65, riskTier: 'CRITICAL', status: 'SUSPENDED', paymentTerms: 'Net 90', lastAudit: '2026-03-05' },
];

const INITIAL_POS: PurchaseOrder[] = [
  { id: 'PO-2026-001', vendorName: 'CloudScale Infrastructure', vendorId: 'VND-001', description: 'AWS reserved instances — 12 month commitment', category: 'IT Infrastructure', amount: 480000, currency: 'USD', status: 'APPROVED', requestedBy: 'CTO Office', requestDate: '2026-08-15', approvalDate: '2026-08-17', deliveryDate: '2026-09-01', priority: 'HIGH' },
  { id: 'PO-2026-002', vendorName: 'Sahara Logistics FZCO', vendorId: 'VND-003', description: 'Q3 warehouse-to-DC freight contract', category: 'Logistics', amount: 215000, currency: 'USD', status: 'PENDING_APPROVAL', requestedBy: 'Supply Chain', requestDate: '2026-08-18', approvalDate: null, deliveryDate: null, priority: 'URGENT' },
  { id: 'PO-2026-003', vendorName: 'Vertex Consulting Group', vendorId: 'VND-004', description: 'SOC-2 Type II audit engagement', category: 'Professional Services', amount: 85000, currency: 'USD', status: 'ORDERED', requestedBy: 'Compliance', requestDate: '2026-08-10', approvalDate: '2026-08-12', deliveryDate: '2026-08-25', priority: 'MEDIUM' },
  { id: 'PO-2026-004', vendorName: 'Nordic Paper & Packaging', vendorId: 'VND-002', description: 'Annual office supplies bulk order', category: 'Office Supplies', amount: 12500, currency: 'USD', status: 'RECEIVED', requestedBy: 'Facilities', requestDate: '2026-08-01', approvalDate: '2026-08-02', deliveryDate: '2026-08-14', priority: 'LOW' },
  { id: 'PO-2026-005', vendorName: 'Mumbai Tech Solutions Pvt', vendorId: 'VND-005', description: 'Mobile app sprint 14 development', category: 'IT Outsourcing', amount: 95000, currency: 'USD', status: 'DRAFT', requestedBy: 'Engineering', requestDate: '2026-08-19', approvalDate: null, deliveryDate: null, priority: 'MEDIUM' },
  { id: 'PO-2026-006', vendorName: 'CloudScale Infrastructure', vendorId: 'VND-001', description: 'Disaster recovery failover testing', category: 'IT Infrastructure', amount: 32000, currency: 'USD', status: 'PAID', requestedBy: 'SRE Team', requestDate: '2026-07-28', approvalDate: '2026-07-29', deliveryDate: '2026-08-10', priority: 'HIGH' },
];

const INITIAL_CONTRACTS: Contract[] = [
  { id: 'CTR-001', vendorName: 'CloudScale Infrastructure', title: 'Cloud Infrastructure Services Agreement', type: 'MSA', value: 2450000, startDate: '2025-01-01', endDate: '2027-12-31', status: 'ACTIVE', autoRenew: true, signedBy: 'CFO', sla: 99.95 },
  { id: 'CTR-002', vendorName: 'Sahara Logistics FZCO', title: 'Freight & Warehousing Master Service', type: 'SOW', value: 1870000, startDate: '2025-06-01', endDate: '2026-12-31', status: 'EXPIRING_SOON', autoRenew: false, signedBy: 'VP Supply Chain', sla: 95.0 },
  { id: 'CTR-003', vendorName: 'Vertex Consulting Group', title: 'Advisory & Compliance Engagement', type: 'SOW', value: 920000, startDate: '2026-01-01', endDate: '2026-12-31', status: 'ACTIVE', autoRenew: true, signedBy: 'CISO', sla: 99.0 },
  { id: 'CTR-004', vendorName: 'Mumbai Tech Solutions Pvt', title: 'Offshore Development Team Retainer', type: 'MSA', value: 1240000, startDate: '2025-09-01', endDate: '2026-08-31', status: 'EXPIRED', autoRenew: false, signedBy: 'VP Engineering', sla: 92.0 },
  { id: 'CTR-005', vendorName: 'Shenzhen Electronics Co', title: 'Hardware Procurement Agreement', type: 'Framework', value: 3100000, startDate: '2024-04-01', endDate: '2027-03-31', status: 'UNDER_REVIEW', autoRenew: true, signedBy: 'COO', sla: 88.0 },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtUSD = (n: number) => `$${fmt(n)}`;

function riskColor(t: RiskTier) {
  switch (t) { case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30'; case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'; case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; }
}
function poStatusColor(s: PoStatus) {
  switch (s) { case 'PAID': case 'RECEIVED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'APPROVED': case 'ORDERED': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; case 'CANCELLED': return 'bg-red-500/20 text-red-300 border-red-500/30'; case 'PENDING_APPROVAL': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function vendorStatusColor(s: VendorStatus) {
  switch (s) { case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'PENDING_APPROVAL': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; case 'SUSPENDED': return 'bg-red-500/20 text-red-300 border-red-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function priorityColor(p: string) {
  switch (p) { case 'URGENT': return 'bg-red-500/20 text-red-300 border-red-500/30'; case 'HIGH': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'; case 'MEDIUM': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function contractStatusColor(s: string) {
  switch (s) { case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'EXPIRING_SOON': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; case 'EXPIRED': return 'bg-red-500/20 text-red-300 border-red-500/30'; default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; }
}
function toCsvPo(rows: PurchaseOrder[]) {
  const h = 'ID,Vendor,Description,Category,Amount,Currency,Status,Priority,RequestedBy,RequestDate';
  const lines = rows.map(r => [r.id, r.vendorName, `"${r.description}"`, r.category, r.amount, r.currency, r.status, r.priority, r.requestedBy, r.requestDate].join(','));
  return [h, ...lines].join('\n');
}
function downloadCsv(csv: string, name: string) {
  const b = new Blob([csv], { type: 'text/csv' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u);
}
function generateRandomPo(): PurchaseOrder {
  const vendors = ['CloudScale Infrastructure', 'Nordic Paper & Packaging', 'Sahara Logistics FZCO', 'Vertex Consulting Group', 'Mumbai Tech Solutions Pvt'];
  const descs = ['Cloud compute reservation', 'Office supply reorder', 'Freight contract extension', 'Security audit engagement', 'Dev team retainer', 'Hardware procurement batch'];
  const statuses: PoStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'RECEIVED', 'PAID'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  return {
    id: `PO-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    vendorName: vendors[Math.floor(Math.random() * vendors.length)],
    vendorId: `VND-00${Math.floor(Math.random() * 6) + 1}`,
    description: descs[Math.floor(Math.random() * descs.length)],
    category: ['IT Infrastructure', 'Logistics', 'Office Supplies', 'Professional Services'][Math.floor(Math.random() * 4)],
    amount: Math.floor(Math.random() * 500000) + 5000,
    currency: 'USD',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    requestedBy: ['Engineering', 'Finance', 'Supply Chain', 'CTO Office'][Math.floor(Math.random() * 4)],
    requestDate: new Date().toISOString().slice(0, 10),
    approvalDate: Math.random() > 0.4 ? new Date().toISOString().slice(0, 10) : null,
    deliveryDate: Math.random() > 0.5 ? new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10) : null,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
  };
}

interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info'; }
let toastSeq = 0;

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function VendorProcurementHubPage() {
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [pos, setPos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [contracts] = useState<Contract[]>(INITIAL_CONTRACTS);
  const [activeTab, setActiveTab] = useState<TabId>('vendors');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [simTick, setSimTick] = useState(0);
  const [simTotalValue, setSimTotalValue] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const simulationTick = useCallback(() => {
    const po = generateRandomPo();
    setPos(prev => [po, ...prev].slice(0, 40));
    setSimTick(prev => prev + 1);
    setSimTotalValue(prev => prev + po.amount);
    if (po.status === 'APPROVED') addToast(`✅ PO APPROVED: ${fmtUSD(po.amount)} — ${po.description}`, 'success');
    else if (po.status === 'CANCELLED') addToast(`🚫 PO CANCELLED: ${po.id}`, 'error');
    else addToast(`📋 PO CREATED: ${po.id} — ${po.vendorName}`, 'info');
  }, [addToast]);

  useEffect(() => {
    if (simRunning) {
      const ms = simSpeed === 1 ? 2000 : simSpeed === 2 ? 1000 : 500;
      intervalRef.current = setInterval(simulationTick, ms);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simRunning, simSpeed, simulationTick]);

  const toggleSim = () => setSimRunning(prev => !prev);
  const resetSim = () => {
    setSimRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSimTick(0); setSimTotalValue(0); setPos(INITIAL_POS);
    addToast('🔄 Simulation reset', 'info');
  };

  const handleExport = () => {
    downloadCsv(toCsvPo(filteredPos), `po-report-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast(`📥 Exported ${filteredPos.length} POs to CSV`, 'success');
  };

  const filteredVendors = vendors.filter(v => {
    const mSearch = searchQuery === '' || v.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || v.category.toLowerCase().includes(searchQuery.toLowerCase());
    const mStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return mSearch && mStatus;
  });
  const filteredPos = pos.filter(p => {
    const mSearch = searchQuery === '' || p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const mStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return mSearch && mStatus;
  });

  const totalSpend = vendors.reduce((s, v) => s + v.totalSpend, 0);
  const totalPoValue = pos.reduce((s, p) => s + p.amount, 0);
  const activeContractsCount = contracts.filter(c => c.status === 'ACTIVE').length;

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'vendors', label: 'Vendors', icon: <Truck className="w-4 h-4" /> },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'contracts', label: 'Contracts', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium animate-[slideIn_0.3s_ease-out] ${
            t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : t.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-200' : t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' : 'bg-slate-800/90 border-slate-700 text-slate-200'
          }`}>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-orange-950 via-slate-900 to-amber-950 border border-orange-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-orange-500/20 text-orange-300 text-xs px-3 py-1 rounded-full font-semibold border border-orange-500/30 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> PaySphere Procurement Command
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> ISO 27001 & SOC-2 Aligned
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-orange-200 bg-clip-text text-transparent">
              Vendor Management & Procurement Hub
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Vendor lifecycle management, purchase order orchestration, contract administration, spend analytics, and automated procurement compliance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-orange-600/30 transition flex items-center gap-2 border border-orange-400/20 text-sm">
              <Download className="w-4 h-4" /> Export PO Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Vendor Spend</span>
              <DollarSign className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{(totalSpend / 1000000).toFixed(1)}M</div>
            <div className="text-orange-400 text-xs mt-2 flex items-center gap-1 font-medium"><Truck className="w-3.5 h-3.5" /> {vendors.length} registered vendors</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Open PO Value</span>
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{fmtUSD(totalPoValue)}</div>
            <div className="text-blue-400 text-xs mt-2 font-medium">{pos.filter(p => !['PAID', 'CANCELLED'].includes(p.status)).length} active POs</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Contracts</span>
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{activeContractsCount}</div>
            <div className="text-emerald-400 text-xs mt-2 font-medium">{contracts.filter(c => c.status === 'EXPIRING_SOON').length} expiring soon</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Avg On-Time Delivery</span>
              <ClipboardCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{(vendors.reduce((s, v) => s + v.onTimeDelivery, 0) / vendors.length).toFixed(1)}%</div>
            <div className="text-indigo-400 text-xs mt-2 font-medium">Across all active vendors</div>
          </div>
        </div>

        {/* Simulation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Live PO Simulator
              </span>
              <span className="text-slate-500 text-xs">Tick: {simTick} | Total: {fmtUSD(simTotalValue)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSim} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${simRunning ? 'bg-amber-600/20 text-amber-300 border-amber-500/30' : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'}`}>
                {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {simRunning ? 'Pause' : 'Start'}
              </button>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {([1, 2, 4] as SimSpeed[]).map(s => (
                  <button key={s} onClick={() => setSimSpeed(s)} className={`px-3 py-2 text-xs font-bold transition ${simSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{s}x</button>
                ))}
              </div>
              <button onClick={resetSim} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition">
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-none px-4 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search vendors, POs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-orange-500 transition" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none">
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PAID">Paid</option>
            </select>
          </div>
        </div>

        {/* ═══════ TAB: Vendors ═══════ */}
        {activeTab === 'vendors' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map(v => (
              <div key={v.id} onClick={() => setSelectedVendor(v)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono text-slate-500">{v.id}</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${vendorStatusColor(v.status)}`}>{v.status.replace(/_/g, ' ')}</span>
                </div>
                <h3 className="text-white font-bold text-base mb-1">{v.companyName}</h3>
                <p className="text-xs text-slate-400 mb-3">{v.category} · {v.country}</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500">Total Spend</div>
                    <div className="text-sm font-black text-white font-mono">{fmtUSD(v.totalSpend)}</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500">OTD Rate</div>
                    <div className={`text-sm font-black font-mono ${v.onTimeDelivery > 95 ? 'text-emerald-400' : v.onTimeDelivery > 85 ? 'text-amber-400' : 'text-red-400'}`}>{v.onTimeDelivery}%</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Contracts: {v.activeContracts}</span>
                  <span className={`px-2 py-0.5 rounded-full border font-semibold ${riskColor(v.riskTier)}`}>{v.riskTier}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Purchase Orders ═══════ */}
        {activeTab === 'purchase-orders' && (
          <div className="space-y-3">
            {filteredPos.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
                <h3 className="text-slate-300 font-semibold text-lg">No POs match filters</h3>
              </div>
            ) : filteredPos.map(po => (
              <div key={po.id} onClick={() => setSelectedPo(po)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{po.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${poStatusColor(po.status)}`}>{po.status.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${priorityColor(po.priority)}`}>{po.priority}</span>
                    </div>
                    <div className="text-sm text-white font-semibold">{po.vendorName}</div>
                    <div className="text-xs text-slate-500 mt-1">{po.description} · {po.category}</div>
                    <div className="text-xs text-slate-500 mt-1">By: {po.requestedBy} · {po.requestDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white font-mono">{fmtUSD(po.amount)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Contracts ═══════ */}
        {activeTab === 'contracts' && (
          <div className="space-y-3">
            {contracts.map(c => (
              <div key={c.id} onClick={() => setSelectedContract(c)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{c.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${contractStatusColor(c.status)}`}>{c.status.replace(/_/g, ' ')}</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">{c.type}</span>
                    </div>
                    <div className="text-sm text-white font-semibold">{c.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{c.vendorName} · Signed by {c.signedBy}</div>
                    <div className="text-xs text-slate-500 mt-1">{c.startDate} → {c.endDate} · SLA: {c.sla}% · Auto-renew: {c.autoRenew ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white font-mono">{fmtUSD(c.value)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Analytics ═══════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-400" /> Spend by Vendor</h3>
              <div className="space-y-3">
                {vendors.filter(v => v.status === 'ACTIVE').sort((a, b) => b.totalSpend - a.totalSpend).map(v => (
                  <div key={v.id} className="flex items-center gap-4">
                    <span className="text-sm text-slate-300 w-48 truncate">{v.companyName}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-6 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-amber-500 rounded-full flex items-center px-3" style={{ width: `${(v.totalSpend / totalSpend) * 100}%` }}>
                        <span className="text-xs font-bold text-white whitespace-nowrap">{fmtUSD(v.totalSpend)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500 w-12 text-right">{((v.totalSpend / totalSpend) * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'RECEIVED', 'PAID', 'CANCELLED'].map(s => {
                const count = pos.filter(p => p.status === s).length;
                return (
                  <div key={s} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${poStatusColor(s as PoStatus)}`}>{s.replace(/_/g, ' ')}</span>
                    <div className="text-3xl font-black text-white mt-3">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ MODAL: Vendor Detail ═══════════════ */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedVendor(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedVendor(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedVendor.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${vendorStatusColor(selectedVendor.status)}`}>{selectedVendor.status.replace(/_/g, ' ')}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskColor(selectedVendor.riskTier)}`}>{selectedVendor.riskTier}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedVendor.companyName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedVendor.category} · {selectedVendor.country} · {selectedVendor.contactName} ({selectedVendor.contactEmail})</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Total Spend</span><span className="text-white font-bold text-sm">{fmtUSD(selectedVendor.totalSpend)}</span></div>
              <div><span className="text-slate-500 block">Active Contracts</span><span className="text-white font-bold text-sm">{selectedVendor.activeContracts}</span></div>
              <div><span className="text-slate-500 block">On-Time Delivery</span><span className={`font-bold text-sm ${selectedVendor.onTimeDelivery > 95 ? 'text-emerald-400' : 'text-amber-400'}`}>{selectedVendor.onTimeDelivery}%</span></div>
              <div><span className="text-slate-500 block">Quality Score</span><span className="text-white font-bold text-sm">{selectedVendor.qualityScore}/100</span></div>
              <div><span className="text-slate-500 block">Payment Terms</span><span className="text-white font-bold text-sm">{selectedVendor.paymentTerms}</span></div>
              <div><span className="text-slate-500 block">Last Audit</span><span className="text-white font-bold text-sm">{selectedVendor.lastAudit}</span></div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedVendor(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: PO Detail ═══════════════ */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedPo(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPo(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedPo.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${poStatusColor(selectedPo.status)}`}>{selectedPo.status.replace(/_/g, ' ')}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${priorityColor(selectedPo.priority)}`}>{selectedPo.priority}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedPo.vendorName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedPo.description} · {selectedPo.category}</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Amount</span><span className="text-white font-bold text-sm">{fmtUSD(selectedPo.amount)}</span></div>
              <div><span className="text-slate-500 block">Requested By</span><span className="text-white font-bold text-sm">{selectedPo.requestedBy}</span></div>
              <div><span className="text-slate-500 block">Request Date</span><span className="text-white font-bold text-sm">{selectedPo.requestDate}</span></div>
              <div><span className="text-slate-500 block">Approval Date</span><span className="text-white font-bold text-sm">{selectedPo.approvalDate ?? 'Pending'}</span></div>
              <div><span className="text-slate-500 block">Delivery Date</span><span className="text-white font-bold text-sm">{selectedPo.deliveryDate ?? 'TBD'}</span></div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedPo(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Contract Detail ═══════════════ */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedContract(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedContract(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedContract.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${contractStatusColor(selectedContract.status)}`}>{selectedContract.status.replace(/_/g, ' ')}</span>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">{selectedContract.type}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedContract.title}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedContract.vendorName} · Signed by {selectedContract.signedBy}</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Contract Value</span><span className="text-white font-bold text-sm">{fmtUSD(selectedContract.value)}</span></div>
              <div><span className="text-slate-500 block">SLA Target</span><span className="text-emerald-400 font-bold text-sm">{selectedContract.sla}%</span></div>
              <div><span className="text-slate-500 block">Start Date</span><span className="text-white font-bold text-sm">{selectedContract.startDate}</span></div>
              <div><span className="text-slate-500 block">End Date</span><span className="text-white font-bold text-sm">{selectedContract.endDate}</span></div>
              <div><span className="text-slate-500 block">Auto-Renew</span><span className={`font-bold text-sm ${selectedContract.autoRenew ? 'text-emerald-400' : 'text-red-400'}`}>{selectedContract.autoRenew ? 'Yes' : 'No'}</span></div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedContract(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
