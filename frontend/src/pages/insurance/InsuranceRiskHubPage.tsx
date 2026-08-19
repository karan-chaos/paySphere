import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  X,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Activity,
  Globe,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Ban,
  Flag,
  RefreshCw,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  Stethoscope,
  Umbrella,
  Car,
  Building2,
  ClipboardCheck,
  ThumbsDown,
  ThumbsUp,
  BadgeCheck,
  Briefcase,
} from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */

type TabId = 'plans' | 'claims' | 'risk-assessment' | 'analytics';
type PlanStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';
type ClaimStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'DENIED' | 'PAID';
type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type SimSpeed = 1 | 2 | 4;

interface InsurancePlan {
  id: string;
  planName: string;
  provider: string;
  type: 'HEALTH' | 'DENTAL' | 'VISION' | 'LIFE' | 'DISABILITY' | 'AUTO';
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  monthlyPremium: number;
  deductible: number;
  maxCoverage: number;
  enrolledCount: number;
  status: PlanStatus;
  renewalDate: string;
  satisfaction: number;
}

interface InsuranceClaim {
  id: string;
  employeeName: string;
  employeeId: string;
  planType: string;
  claimAmount: number;
  approvedAmount: number | null;
  status: ClaimStatus;
  filedDate: string;
  processedDate: string | null;
  adjuster: string;
  diagnosisCode: string;
  description: string;
  riskTier: RiskTier;
}

interface RiskAssessment {
  id: string;
  entityName: string;
  entityType: string;
  department: string;
  riskScore: number;
  riskTier: RiskTier;
  exposureUSD: number;
  claimsHistory: number;
  lossRatio: number;
  safetyRating: string;
  lastAuditDate: string;
  mitigations: number;
  openIncidents: number;
}

/* ──────────────────────────── Mock Data ──────────────────────────── */

const INITIAL_PLANS: InsurancePlan[] = [
  {
    id: 'INS-PLN-001', planName: 'Executive Health PPO Elite', provider: 'BlueCross BlueShield',
    type: 'HEALTH', tier: 'PLATINUM', monthlyPremium: 850, deductible: 250,
    maxCoverage: 2000000, enrolledCount: 234, status: 'ACTIVE',
    renewalDate: '2027-01-01', satisfaction: 94,
  },
  {
    id: 'INS-PLN-002', planName: 'Dental Premium Plus', provider: 'Delta Dental',
    type: 'DENTAL', tier: 'GOLD', monthlyPremium: 120, deductible: 50,
    maxCoverage: 75000, enrolledCount: 198, status: 'ACTIVE',
    renewalDate: '2027-01-01', satisfaction: 88,
  },
  {
    id: 'INS-PLN-003', planName: 'Vision Care Standard', provider: 'VSP Global',
    type: 'VISION', tier: 'SILVER', monthlyPremium: 45, deductible: 0,
    maxCoverage: 15000, enrolledCount: 167, status: 'ACTIVE',
    renewalDate: '2027-06-30', satisfaction: 82,
  },
  {
    id: 'INS-PLN-004', planName: 'Group Term Life 3x Salary', provider: 'MetLife',
    type: 'LIFE', tier: 'GOLD', monthlyPremium: 65, deductible: 0,
    maxCoverage: 500000, enrolledCount: 312, status: 'ACTIVE',
    renewalDate: '2027-01-01', satisfaction: 91,
  },
  {
    id: 'INS-PLN-005', planName: 'Short-Term Disability Shield', provider: 'Unum',
    type: 'DISABILITY', tier: 'PLATINUM', monthlyPremium: 95, deductible: 14,
    maxCoverage: 250000, enrolledCount: 89, status: 'ACTIVE',
    renewalDate: '2027-03-15', satisfaction: 85,
  },
  {
    id: 'INS-PLN-006', planName: 'Fleet Auto Coverage', provider: 'Progressive Commercial',
    type: 'AUTO', tier: 'GOLD', monthlyPremium: 420, deductible: 1000,
    maxCoverage: 1000000, enrolledCount: 45, status: 'PENDING',
    renewalDate: '2026-12-01', satisfaction: 78,
  },
];

const INITIAL_CLAIMS: InsuranceClaim[] = [
  {
    id: 'CLM-001', employeeName: 'Sarah Mitchell', employeeId: 'EMP-1042',
    planType: 'HEALTH', claimAmount: 18500, approvedAmount: 17200,
    status: 'PAID', filedDate: '2026-08-10', processedDate: '2026-08-15',
    adjuster: 'James Park', diagnosisCode: 'M54.5', description: 'Lumbar disc herniation — surgical intervention',
    riskTier: 'MEDIUM',
  },
  {
    id: 'CLM-002', employeeName: 'David Okafor', employeeId: 'EMP-2201',
    planType: 'HEALTH', claimAmount: 45000, approvedAmount: null,
    status: 'UNDER_REVIEW', filedDate: '2026-08-17', processedDate: null,
    adjuster: 'Maria Santos', diagnosisCode: 'C34.1', description: 'Pulmonary nodule — biopsy and oncology consult pending',
    riskTier: 'HIGH',
  },
  {
    id: 'CLM-003', employeeName: 'Anika Patel', employeeId: 'EMP-0876',
    planType: 'DENTAL', claimAmount: 3200, approvedAmount: 3200,
    status: 'APPROVED', filedDate: '2026-08-12', processedDate: '2026-08-14',
    adjuster: 'Tom Bradley', diagnosisCode: 'K08.1', description: 'Implant-supported bridge — lower right quadrant',
    riskTier: 'LOW',
  },
  {
    id: 'CLM-004', employeeName: 'Marcus Chen', employeeId: 'EMP-3305',
    planType: 'DISABILITY', claimAmount: 8500, approvedAmount: null,
    status: 'SUBMITTED', filedDate: '2026-08-19', processedDate: null,
    adjuster: 'Unassigned', diagnosisCode: 'S82.0', description: 'Tibial fracture — 6-week recovery, short-term disability',
    riskTier: 'MEDIUM',
  },
  {
    id: 'CLM-005', employeeName: 'Elena Vasquez', employeeId: 'EMP-1567',
    planType: 'AUTO', claimAmount: 12800, approvedAmount: 0,
    status: 'DENIED', filedDate: '2026-08-05', processedDate: '2026-08-11',
    adjuster: 'James Park', diagnosisCode: 'N/A', description: 'Vehicle collision during personal use — policy excludes non-commute',
    riskTier: 'LOW',
  },
  {
    id: 'CLM-006', employeeName: 'Tomoko Sato', employeeId: 'EMP-4102',
    planType: 'HEALTH', claimAmount: 9200, approvedAmount: 8400,
    status: 'PAID', filedDate: '2026-08-01', processedDate: '2026-08-08',
    adjuster: 'Maria Santos', diagnosisCode: 'J06.9', description: 'Acute respiratory infection — ER visit and follow-up',
    riskTier: 'LOW',
  },
  {
    id: 'CLM-007', employeeName: 'Robert Kimani', employeeId: 'EMP-5589',
    planType: 'LIFE', claimAmount: 500000, approvedAmount: null,
    status: 'UNDER_REVIEW', filedDate: '2026-08-18', processedDate: null,
    adjuster: 'Tom Bradley', diagnosisCode: 'I21.0', description: 'Group term life claim — acute myocardial infarction',
    riskTier: 'CRITICAL',
  },
];

const INITIAL_RISK: RiskAssessment[] = [
  {
    id: 'RA-001', entityName: 'Engineering Division', entityType: 'Department',
    department: 'Engineering', riskScore: 25, riskTier: 'LOW',
    exposureUSD: 4500000, claimsHistory: 3, lossRatio: 0.42,
    safetyRating: 'A+', lastAuditDate: '2026-07-15', mitigations: 12, openIncidents: 0,
  },
  {
    id: 'RA-002', entityName: 'Warehouse Operations', entityType: 'Department',
    department: 'Operations', riskScore: 72, riskTier: 'HIGH',
    exposureUSD: 8200000, claimsHistory: 14, lossRatio: 0.89,
    safetyRating: 'C+', lastAuditDate: '2026-06-20', mitigations: 5, openIncidents: 3,
  },
  {
    id: 'RA-003', entityName: 'Sales & Client Relations', entityType: 'Department',
    department: 'Sales', riskScore: 38, riskTier: 'MEDIUM',
    exposureUSD: 2100000, claimsHistory: 5, lossRatio: 0.55,
    safetyRating: 'B+', lastAuditDate: '2026-07-01', mitigations: 8, openIncidents: 1,
  },
  {
    id: 'RA-004', entityName: 'Executive Leadership', entityType: 'Department',
    department: 'C-Suite', riskScore: 15, riskTier: 'LOW',
    exposureUSD: 15000000, claimsHistory: 1, lossRatio: 0.12,
    safetyRating: 'A++', lastAuditDate: '2026-08-01', mitigations: 18, openIncidents: 0,
  },
  {
    id: 'RA-005', entityName: 'Fleet & Logistics', entityType: 'Unit',
    department: 'Operations', riskScore: 85, riskTier: 'CRITICAL',
    exposureUSD: 12000000, claimsHistory: 22, lossRatio: 1.15,
    safetyRating: 'D', lastAuditDate: '2026-05-10', mitigations: 3, openIncidents: 7,
  },
  {
    id: 'RA-006', entityName: 'Manufacturing Floor', entityType: 'Department',
    department: 'Production', riskScore: 68, riskTier: 'HIGH',
    exposureUSD: 9800000, claimsHistory: 18, lossRatio: 0.95,
    safetyRating: 'C', lastAuditDate: '2026-06-01', mitigations: 6, openIncidents: 4,
  },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtUSD = (n: number) => `$${fmt(n)}`;

function riskBadgeColor(tier: RiskTier) {
  switch (tier) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'HIGH':     return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'MEDIUM':   return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default:         return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}

function claimStatusColor(s: ClaimStatus) {
  switch (s) {
    case 'PAID':         return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'APPROVED':     return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'DENIED':       return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'UNDER_REVIEW': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default:             return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

function planStatusColor(s: PlanStatus) {
  switch (s) {
    case 'ACTIVE':    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'PENDING':   return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'EXPIRED':   return 'bg-red-500/20 text-red-300 border-red-500/30';
    default:          return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  }
}

function planIcon(type: string) {
  switch (type) {
    case 'HEALTH':    return <Heart className="w-5 h-5 text-rose-400" />;
    case 'DENTAL':    return <Stethoscope className="w-5 h-5 text-cyan-400" />;
    case 'VISION':    return <Eye className="w-5 h-5 text-purple-400" />;
    case 'LIFE':      return <Umbrella className="w-5 h-5 text-blue-400" />;
    case 'DISABILITY': return <Shield className="w-5 h-5 text-amber-400" />;
    case 'AUTO':      return <Car className="w-5 h-5 text-slate-400" />;
    default:          return <Briefcase className="w-5 h-5 text-slate-400" />;
  }
}

function toCsvClaims(rows: InsuranceClaim[]) {
  const h = 'ID,Employee,Plan,Amount,Approved,Status,Risk,Filed,Adjuster,Diagnosis,Description';
  const lines = rows.map(r =>
    [r.id, r.employeeName, r.planType, r.claimAmount, r.approvedAmount ?? 'N/A',
     r.status, r.riskTier, r.filedDate, r.adjuster, r.diagnosisCode, `"${r.description}"`].join(',')
  );
  return [h, ...lines].join('\n');
}

function downloadCsv(csv: string, name: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function generateRandomClaim(): InsuranceClaim {
  const names = ['Alex Rivera', 'Priya Sharma', 'John O\'Brien', 'Wei Zhang', 'Fatima Al-Hassan', 'Carlos Mendez'];
  const plans = ['HEALTH', 'DENTAL', 'VISION', 'LIFE', 'DISABILITY', 'AUTO'];
  const statuses: ClaimStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'PAID'];
  const tiers: RiskTier[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const tier = tiers[Math.floor(Math.random() * tiers.length)];
  const amt = Math.floor(Math.random() * 50000) + 500;
  return {
    id: `CLM-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    employeeName: names[Math.floor(Math.random() * names.length)],
    employeeId: `EMP-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    planType: plans[Math.floor(Math.random() * plans.length)],
    claimAmount: amt,
    approvedAmount: Math.random() > 0.4 ? Math.floor(amt * (0.7 + Math.random() * 0.3)) : null,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    filedDate: new Date().toISOString().slice(0, 10),
    processedDate: Math.random() > 0.3 ? new Date().toISOString().slice(0, 10) : null,
    adjuster: ['James Park', 'Maria Santos', 'Tom Bradley'][Math.floor(Math.random() * 3)],
    diagnosisCode: `D${String(Math.floor(Math.random() * 999)).padStart(3, '.')}`,
    description: 'Automated simulation — claim generated by tick engine',
    riskTier: tier,
  };
}

/* ──────────────────────────── Toast System ──────────────────────────── */

interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info'; }
let toastSeq = 0;

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function InsuranceRiskHubPage() {
  const [plans, setPlans] = useState<InsurancePlan[]>(INITIAL_PLANS);
  const [claims, setClaims] = useState<InsuranceClaim[]>(INITIAL_CLAIMS);
  const [risks] = useState<RiskAssessment[]>(INITIAL_RISK);
  const [activeTab, setActiveTab] = useState<TabId>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedPlan, setSelectedPlan] = useState<InsurancePlan | null>(null);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* Simulation */
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [simTick, setSimTick] = useState(0);
  const [simPaid, setSimPaid] = useState(0);
  const [simDenied, setSimDenied] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const simulationTick = useCallback(() => {
    const c = generateRandomClaim();
    setClaims(prev => [c, ...prev].slice(0, 30));
    setSimTick(prev => prev + 1);
    if (c.status === 'DENIED') {
      setSimDenied(prev => prev + 1);
      addToast(`🚫 DENIED: ${c.employeeName} — ${c.planType} claim ${fmtUSD(c.claimAmount)}`, 'error');
    } else if (c.status === 'PAID') {
      setSimPaid(prev => prev + 1);
      addToast(`✅ PAID: ${c.employeeName} — ${fmtUSD(c.approvedAmount ?? 0)} disbursed`, 'success');
    }
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
    setSimTick(0); setSimPaid(0); setSimDenied(0);
    setClaims(INITIAL_CLAIMS);
    addToast('🔄 Simulation reset', 'info');
  };

  const handleExport = () => {
    const csv = toCsvClaims(filteredClaims);
    downloadCsv(csv, `insurance-claims-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast(`📥 Exported ${filteredClaims.length} claims to CSV`, 'success');
  };

  /* Filtered data */
  const filteredPlans = plans.filter(p => {
    const matchSearch = searchQuery === '' || p.planName.toLowerCase().includes(searchQuery.toLowerCase()) || p.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const filteredClaims = claims.filter(c => {
    const matchSearch = searchQuery === '' || c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRisk = riskFilter === 'ALL' || c.riskTier === riskFilter;
    return matchSearch && matchRisk;
  });

  /* KPIs */
  const totalEnrolled = plans.reduce((s, p) => s + p.enrolledCount, 0);
  const totalPremium = plans.reduce((s, p) => s + p.monthlyPremium * p.enrolledCount, 0);
  const pendingClaims = claims.filter(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW');
  const totalClaimValue = claims.reduce((s, c) => s + c.claimAmount, 0);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'plans', label: 'Insurance Plans', icon: <Shield className="w-4 h-4" /> },
    { id: 'claims', label: 'Claims Processing', icon: <FileText className="w-4 h-4" /> },
    { id: 'risk-assessment', label: 'Risk Assessment', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  /* ══════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">

      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium animate-[slideIn_0.3s_ease-out] ${
            t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' :
            t.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-200' :
            t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' :
            'bg-slate-800/90 border-slate-700 text-slate-200'
          }`}>
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-cyan-950 via-slate-900 to-teal-950 border border-cyan-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-cyan-500/20 text-cyan-300 text-xs px-3 py-1 rounded-full font-semibold border border-cyan-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> PaySphere Insurance Command
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> HIPAA & ERISA Compliant
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-200 bg-clip-text text-transparent">
              Insurance & Risk Management Hub
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Employee insurance plan administration, claims lifecycle processing, departmental risk assessment, and loss-ratio analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-cyan-600/30 transition flex items-center gap-2 border border-cyan-400/20 text-sm">
              <Download className="w-4 h-4" /> Export Claims Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Enrollees</span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{fmt(totalEnrolled)}</div>
            <div className="text-cyan-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Across {plans.filter(p => p.status === 'ACTIVE').length} active plans
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Monthly Premium Pool</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{fmtUSD(totalPremium)}</div>
            <div className="text-emerald-400 text-xs mt-2 font-medium">Employer + employee combined</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Pending Claims</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{pendingClaims.length}</div>
            <div className="text-amber-400 text-xs mt-2 font-medium">
              {fmtUSD(pendingClaims.reduce((s, c) => s + c.claimAmount, 0))} total value
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Total Claim Volume</span>
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{fmtUSD(totalClaimValue)}</div>
            <div className="text-indigo-400 text-xs mt-2 font-medium">{claims.length} claims filed this period</div>
          </div>
        </div>

        {/* Simulation Sandbox */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Live Claims Simulator
              </span>
              <span className="text-slate-500 text-xs">Tick: {simTick} | Paid: {simPaid} | Denied: {simDenied}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSim} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${
                simRunning ? 'bg-amber-600/20 text-amber-300 border-amber-500/30' : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {simRunning ? 'Pause' : 'Start'}
              </button>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {([1, 2, 4] as SimSpeed[]).map(s => (
                  <button key={s} onClick={() => setSimSpeed(s)} className={`px-3 py-2 text-xs font-bold transition ${simSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                    {s}x
                  </button>
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
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-none px-4 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search plans, employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition" />
            </div>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none">
              <option value="ALL">All Types</option>
              <option value="HEALTH">Health</option>
              <option value="DENTAL">Dental</option>
              <option value="VISION">Vision</option>
              <option value="LIFE">Life</option>
              <option value="DISABILITY">Disability</option>
              <option value="AUTO">Auto</option>
            </select>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none">
              <option value="ALL">All Risk</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* ═══════ TAB: Plans ═══════ */}
        {activeTab === 'plans' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map(p => (
              <div key={p.id} onClick={() => setSelectedPlan(p)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {planIcon(p.type)}
                    <div>
                      <h3 className="text-white font-bold text-sm">{p.planName}</h3>
                      <p className="text-xs text-slate-400">{p.provider}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${planStatusColor(p.status)}`}>{p.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500">Premium/Mo</div>
                    <div className="text-lg font-black text-white font-mono">{fmtUSD(p.monthlyPremium)}</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500">Max Coverage</div>
                    <div className="text-lg font-black text-emerald-400 font-mono">{fmtUSD(p.maxCoverage)}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {p.enrolledCount} enrolled</span>
                  <span className={`px-2 py-0.5 rounded-full border font-semibold text-xs ${
                    p.tier === 'PLATINUM' ? 'bg-slate-200/10 text-slate-200 border-slate-400/30' :
                    p.tier === 'GOLD' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                    p.tier === 'SILVER' ? 'bg-slate-400/20 text-slate-300 border-slate-400/30' :
                    'bg-orange-700/20 text-orange-300 border-orange-700/30'
                  }`}>{p.tier}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Claims ═══════ */}
        {activeTab === 'claims' && (
          <div className="space-y-3">
            {filteredClaims.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
                <h3 className="text-slate-300 font-semibold text-lg">No claims match filters</h3>
              </div>
            ) : filteredClaims.map(c => (
              <div key={c.id} onClick={() => setSelectedClaim(c)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{c.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${claimStatusColor(c.status)}`}>{c.status.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(c.riskTier)}`}>{c.riskTier}</span>
                    </div>
                    <div className="text-sm text-white font-semibold">{c.employeeName} <span className="text-slate-400 font-normal">({c.employeeId})</span></div>
                    <div className="text-xs text-slate-500 mt-1">{c.planType} · {c.diagnosisCode} · {c.description}</div>
                    <div className="text-xs text-slate-500 mt-1">Adjuster: {c.adjuster} · Filed: {c.filedDate}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-white font-mono">{fmtUSD(c.claimAmount)}</div>
                    {c.approvedAmount !== null && (
                      <div className={`text-xs font-semibold ${c.status === 'DENIED' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {c.status === 'DENIED' ? 'Denied' : `Approved: ${fmtUSD(c.approvedAmount)}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Risk Assessment ═══════ */}
        {activeTab === 'risk-assessment' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {risks.map(r => (
              <div key={r.id} onClick={() => setSelectedRisk(r)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold">{r.entityName}</h3>
                    <p className="text-xs text-slate-400">{r.entityType} · {r.department}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold ${riskBadgeColor(r.riskTier)}`}>{r.riskScore}/100</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center mb-4">
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Exposure</div>
                    <div className="text-sm font-black text-white font-mono">{(r.exposureUSD / 1000000).toFixed(1)}M</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Loss Ratio</div>
                    <div className={`text-sm font-black font-mono ${r.lossRatio > 1 ? 'text-red-400' : r.lossRatio > 0.7 ? 'text-amber-400' : 'text-emerald-400'}`}>{(r.lossRatio * 100).toFixed(0)}%</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Safety</div>
                    <div className="text-sm font-black text-white">{r.safetyRating}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Claims: {r.claimsHistory} | Open: {r.openIncidents} | Mitigations: {r.mitigations}</span>
                  <span>Last audit: {r.lastAuditDate}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Analytics ═══════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-cyan-400" /> Claims Distribution by Plan Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['HEALTH', 'DENTAL', 'VISION', 'LIFE', 'DISABILITY', 'AUTO'].map(type => {
                  const count = claims.filter(c => c.planType === type).length;
                  const total = claims.filter(c => c.planType === type).reduce((s, c) => s + c.claimAmount, 0);
                  return (
                    <div key={type} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center">
                      {planIcon(type)}
                      <div className="text-xs text-slate-500 mt-2 mb-1">{type}</div>
                      <div className="text-xl font-black text-white">{count}</div>
                      <div className="text-xs text-slate-400">{fmtUSD(total)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-amber-400" /> Claims Status Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DENIED', 'PAID'] as ClaimStatus[]).map(s => {
                  const count = claims.filter(c => c.status === s).length;
                  return (
                    <div key={s} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${claimStatusColor(s)}`}>{s.replace(/_/g, ' ')}</span>
                      <div className="text-3xl font-black text-white mt-3">{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-red-400" /> Risk Tier Distribution (Departments)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as RiskTier[]).map(tier => {
                  const depts = risks.filter(r => r.riskTier === tier);
                  return (
                    <div key={tier} className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${riskBadgeColor(tier)}`}>{tier}</span>
                      <div className="text-3xl font-black text-white mt-3">{depts.length}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {depts.map(d => d.entityName).join(', ') || 'None'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ MODAL: Plan Detail ═══════════════ */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedPlan(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPlan(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              {planIcon(selectedPlan.type)}
              <span className="text-xs font-mono text-slate-500">{selectedPlan.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${planStatusColor(selectedPlan.status)}`}>{selectedPlan.status}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedPlan.planName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedPlan.provider} · {selectedPlan.tier} Tier</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Monthly Premium</span><span className="text-white font-bold text-sm">{fmtUSD(selectedPlan.monthlyPremium)}/employee</span></div>
              <div><span className="text-slate-500 block">Deductible</span><span className="text-amber-400 font-bold text-sm">{fmtUSD(selectedPlan.deductible)}</span></div>
              <div><span className="text-slate-500 block">Max Coverage</span><span className="text-emerald-400 font-bold text-sm">{fmtUSD(selectedPlan.maxCoverage)}</span></div>
              <div><span className="text-slate-500 block">Enrollees</span><span className="text-white font-bold text-sm">{selectedPlan.enrolledCount}</span></div>
              <div><span className="text-slate-500 block">Renewal Date</span><span className="text-white font-bold text-sm">{selectedPlan.renewalDate}</span></div>
              <div><span className="text-slate-500 block">Satisfaction</span><span className="text-cyan-400 font-bold text-sm">{selectedPlan.satisfaction}%</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedPlan(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Claim Detail ═══════════════ */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedClaim(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedClaim(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedClaim.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${claimStatusColor(selectedClaim.status)}`}>{selectedClaim.status.replace(/_/g, ' ')}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(selectedClaim.riskTier)}`}>{selectedClaim.riskTier}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedClaim.employeeName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedClaim.employeeId} · {selectedClaim.planType} · {selectedClaim.diagnosisCode}</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-sm text-slate-300 leading-relaxed">{selectedClaim.description}</div>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Claim Amount</span><span className="text-white font-bold text-sm">{fmtUSD(selectedClaim.claimAmount)}</span></div>
              <div><span className="text-slate-500 block">Approved Amount</span><span className={`font-bold text-sm ${selectedClaim.status === 'DENIED' ? 'text-red-400' : 'text-emerald-400'}`}>{selectedClaim.approvedAmount !== null ? fmtUSD(selectedClaim.approvedAmount) : 'Pending'}</span></div>
              <div><span className="text-slate-500 block">Filed Date</span><span className="text-white font-bold text-sm">{selectedClaim.filedDate}</span></div>
              <div><span className="text-slate-500 block">Adjuster</span><span className="text-white font-bold text-sm">{selectedClaim.adjuster}</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedClaim(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Risk Detail ═══════════════ */}
      {selectedRisk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedRisk(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedRisk(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedRisk.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(selectedRisk.riskTier)}`}>{selectedRisk.riskTier}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedRisk.entityName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedRisk.entityType} · {selectedRisk.department} · Safety: {selectedRisk.safetyRating}</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Risk Score</span><span className="text-red-400 font-bold text-sm">{selectedRisk.riskScore}/100</span></div>
              <div><span className="text-slate-500 block">Total Exposure</span><span className="text-white font-bold text-sm">{fmtUSD(selectedRisk.exposureUSD)}</span></div>
              <div><span className="text-slate-500 block">Loss Ratio</span><span className={`font-bold text-sm ${selectedRisk.lossRatio > 1 ? 'text-red-400' : 'text-emerald-400'}`}>{(selectedRisk.lossRatio * 100).toFixed(0)}%</span></div>
              <div><span className="text-slate-500 block">Claims History</span><span className="text-white font-bold text-sm">{selectedRisk.claimsHistory}</span></div>
              <div><span className="text-slate-500 block">Open Incidents</span><span className={`font-bold text-sm ${selectedRisk.openIncidents > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{selectedRisk.openIncidents}</span></div>
              <div><span className="text-slate-500 block">Mitigations Active</span><span className="text-white font-bold text-sm">{selectedRisk.mitigations}</span></div>
              <div><span className="text-slate-500 block">Last Audit</span><span className="text-white font-bold text-sm">{selectedRisk.lastAuditDate}</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedRisk(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
