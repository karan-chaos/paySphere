import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
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
  Fingerprint,
  Scan,
  Network,
} from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */

type TxStatus = 'CLEAN' | 'SUSPICIOUS' | 'BLOCKED' | 'UNDER_REVIEW';
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TabId = 'monitor' | 'alerts' | 'risk-scoring' | 'rule-engine';
type SimSpeed = 1 | 2 | 4;

interface SuspiciousTransaction {
  id: string;
  timestamp: string;
  senderName: string;
  senderCountry: string;
  recipientName: string;
  recipientCountry: string;
  amount: number;
  currency: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status: TxStatus;
  flagReason: string;
  deviceId: string;
  ipAddress: string;
  channel: string;
}

interface AmlAlert {
  id: string;
  alertType: string;
  severity: RiskLevel;
  description: string;
  triggeredAt: string;
  relatedTxIds: string[];
  assignedAnalyst: string;
  resolution: string;
  ruleId: string;
}

interface RiskProfile {
  id: string;
  entityName: string;
  entityType: string;
  jurisdiction: string;
  riskScore: number;
  riskLevel: RiskLevel;
  peprStatus: string;
  lastScreeningDate: string;
  sanctionsHit: boolean;
  pepMatch: boolean;
  adverseMedia: boolean;
  countryRisk: number;
  transactionRisk: number;
  behavioralRisk: number;
}

interface AmlRule {
  id: string;
  ruleName: string;
  category: string;
  description: string;
  threshold: string;
  action: string;
  enabled: boolean;
  triggeredCount: number;
  lastTriggered: string;
  falsePositiveRate: number;
}

/* ──────────────────────────── Mock Data ──────────────────────────── */

const INITIAL_TXNS: SuspiciousTransaction[] = [
  {
    id: 'TXN-AML-001',
    timestamp: '2026-08-19T14:23:01Z',
    senderName: 'Volkov Enterprises LLC',
    senderCountry: '🇷🇺 Russia',
    recipientName: 'Shell Corp BVI',
    recipientCountry: '🇻🇬 British Virgin Islands',
    amount: 2847500,
    currency: 'USD',
    riskScore: 94,
    riskLevel: 'CRITICAL',
    status: 'BLOCKED',
    flagReason: 'Structuring pattern detected — 12 sub-threshold transfers within 48h',
    deviceId: 'DEV-99A1',
    ipAddress: '185.220.101.xx',
    channel: 'Wire Transfer',
  },
  {
    id: 'TXN-AML-002',
    timestamp: '2026-08-19T13:45:12Z',
    senderName: 'Nakamura Holdings',
    senderCountry: '🇯🇵 Japan',
    recipientName: 'Pacific Trade FZCO',
    recipientCountry: '🇦🇪 UAE',
    amount: 875000,
    currency: 'USD',
    riskScore: 78,
    riskLevel: 'HIGH',
    status: 'UNDER_REVIEW',
    flagReason: 'High-risk jurisdiction recipient + unusual time-of-day pattern',
    deviceId: 'DEV-33B7',
    ipAddress: '202.214.45.xx',
    channel: 'SWIFT MT103',
  },
  {
    id: 'TXN-AML-003',
    timestamp: '2026-08-19T12:11:55Z',
    senderName: 'Okonkwo Family Trust',
    senderCountry: '🇳🇬 Nigeria',
    recipientName: 'European Settlement Ltd',
    recipientCountry: '🇱🇮 Liechtenstein',
    amount: 425000,
    currency: 'EUR',
    riskScore: 65,
    riskLevel: 'MEDIUM',
    status: 'SUSPICIOUS',
    flagReason: 'Layering pattern — rapid fund movement through 3 jurisdictions',
    deviceId: 'DEV-77C2',
    ipAddress: '41.204.88.xx',
    channel: 'SEPA Credit',
  },
  {
    id: 'TXN-AML-004',
    timestamp: '2026-08-19T11:02:33Z',
    senderName: 'Meridian Payroll Inc',
    senderCountry: '🇺🇸 United States',
    recipientName: 'Employee Pool - batch #4412',
    recipientCountry: '🇺🇸 United States',
    amount: 128350,
    currency: 'USD',
    riskScore: 12,
    riskLevel: 'LOW',
    status: 'CLEAN',
    flagReason: 'None — standard payroll disbursement batch',
    deviceId: 'DEV-11D0',
    ipAddress: '10.0.42.xx',
    channel: 'ACH Direct Deposit',
  },
  {
    id: 'TXN-AML-005',
    timestamp: '2026-08-19T10:33:07Z',
    senderName: 'Chen Wei Trading Co',
    senderCountry: '🇨🇳 China',
    recipientName: 'Cambodia Import S.A.',
    recipientCountry: '🇰🇭 Cambodia',
    amount: 1560000,
    currency: 'USD',
    riskScore: 88,
    riskLevel: 'CRITICAL',
    status: 'BLOCKED',
    flagReason: 'Trade-based ML indicator — over-invoiced goods vs. customs data',
    deviceId: 'DEV-88E5',
    ipAddress: '116.228.111.xx',
    channel: 'Trade Finance LC',
  },
  {
    id: 'TXN-AML-006',
    timestamp: '2026-08-19T09:17:44Z',
    senderName: 'Al-Rashid Investment Group',
    senderCountry: '🇸🇦 Saudi Arabia',
    recipientName: 'London Property SPV',
    recipientCountry: '🇬🇧 United Kingdom',
    amount: 3200000,
    currency: 'GBP',
    riskScore: 72,
    riskLevel: 'HIGH',
    status: 'UNDER_REVIEW',
    flagReason: 'Beneficial ownership obscuration via nominee directors',
    deviceId: 'DEV-44F1',
    ipAddress: '86.96.202.xx',
    channel: 'CHAPS',
  },
  {
    id: 'TXN-AML-007',
    timestamp: '2026-08-19T08:45:21Z',
    senderName: 'Patel Pharma Exports',
    senderCountry: '🇮🇳 India',
    recipientName: 'HealthBridge Distribution',
    recipientCountry: '🇲🇽 Mexico',
    amount: 290000,
    currency: 'USD',
    riskScore: 45,
    riskLevel: 'MEDIUM',
    status: 'SUSPICIOUS',
    flagReason: 'Circular trade pattern detected across 3 related entities',
    deviceId: 'DEV-55G3',
    ipAddress: '103.21.58.xx',
    channel: 'SWIFT MT202',
  },
  {
    id: 'TXN-AML-008',
    timestamp: '2026-08-19T07:12:09Z',
    senderName: 'Dubai Gold Trading LLC',
    senderCountry: '🇦🇪 UAE',
    recipientName: 'Istanbul Bullion FZCO',
    recipientCountry: '🇹🇷 Turkey',
    amount: 4850000,
    currency: 'USD',
    riskScore: 91,
    riskLevel: 'CRITICAL',
    status: 'BLOCKED',
    flagReason: 'Cash-intensive business + gold smurfing pattern identified',
    deviceId: 'DEV-66H8',
    ipAddress: '94.200.167.xx',
    channel: 'RTGS',
  },
];

const INITIAL_ALERTS: AmlAlert[] = [
  {
    id: 'AML-ALT-001',
    alertType: 'Structuring / Smurfing',
    severity: 'CRITICAL',
    description: 'Multiple sub-threshold transactions detected from Volkov Enterprises to BVI shell entity. Pattern matches known smurfing methodology.',
    triggeredAt: '2026-08-19T14:23:01Z',
    relatedTxIds: ['TXN-AML-001'],
    assignedAnalyst: 'Sarah Chen',
    resolution: 'PENDING',
    ruleId: 'RULE-001',
  },
  {
    id: 'AML-ALT-002',
    alertType: 'Trade-Based ML',
    severity: 'CRITICAL',
    description: 'Over-invoicing detected in Chen Wei → Cambodia trade corridor. Invoice value exceeds customs data by 340%.',
    triggeredAt: '2026-08-19T10:33:07Z',
    relatedTxIds: ['TXN-AML-005'],
    assignedAnalyst: 'Marcus Webb',
    resolution: 'PENDING',
    ruleId: 'RULE-004',
  },
  {
    id: 'AML-ALT-003',
    alertType: 'High-Risk Jurisdiction',
    severity: 'HIGH',
    description: 'SWIFT payment routed to UAE entity with nexus to FATF grey-list jurisdiction. Enhanced due diligence required.',
    triggeredAt: '2026-08-19T13:45:12Z',
    relatedTxIds: ['TXN-AML-002'],
    assignedAnalyst: 'Sarah Chen',
    resolution: 'UNDER_INVESTIGATION',
    ruleId: 'RULE-002',
  },
  {
    id: 'AML-ALT-004',
    alertType: 'Beneficial Ownership Obscuration',
    severity: 'HIGH',
    description: 'Nominee director chain identified in London Property SPV. UBO cannot be verified through standard KYC layer.',
    triggeredAt: '2026-08-19T09:17:44Z',
    relatedTxIds: ['TXN-AML-006'],
    assignedAnalyst: 'Raj Patel',
    resolution: 'ESCALATED_TO_COMPLIANCE',
    ruleId: 'RULE-005',
  },
  {
    id: 'AML-ALT-005',
    alertType: 'Circular Trade',
    severity: 'MEDIUM',
    description: 'Funds routed through 3 related entities in India → Mexico → India loop within 72-hour window.',
    triggeredAt: '2026-08-19T08:45:21Z',
    relatedTxIds: ['TXN-AML-007'],
    assignedAnalyst: 'Marcus Webb',
    resolution: 'FALSE_POSITIVE',
    ruleId: 'RULE-003',
  },
];

const INITIAL_RISK_PROFILES: RiskProfile[] = [
  {
    id: 'RP-001',
    entityName: 'Volkov Enterprises LLC',
    entityType: 'Corporate',
    jurisdiction: '🇷🇺 Russia',
    riskScore: 95,
    riskLevel: 'CRITICAL',
    peprStatus: 'SANCTIONED',
    lastScreeningDate: '2026-08-18',
    sanctionsHit: true,
    pepMatch: true,
    adverseMedia: true,
    countryRisk: 92,
    transactionRisk: 88,
    behavioralRisk: 94,
  },
  {
    id: 'RP-002',
    entityName: 'Dubai Gold Trading LLC',
    entityType: 'Corporate',
    jurisdiction: '🇦🇪 UAE',
    riskScore: 87,
    riskLevel: 'HIGH',
    peprStatus: 'ENHANCED_DUE_DILIGENCE',
    lastScreeningDate: '2026-08-17',
    sanctionsHit: false,
    pepMatch: false,
    adverseMedia: true,
    countryRisk: 70,
    transactionRisk: 91,
    behavioralRisk: 82,
  },
  {
    id: 'RP-003',
    entityName: 'Nakamura Holdings',
    entityType: 'Corporate',
    jurisdiction: '🇯🇵 Japan',
    riskScore: 55,
    riskLevel: 'MEDIUM',
    peprStatus: 'STANDARD',
    lastScreeningDate: '2026-08-15',
    sanctionsHit: false,
    pepMatch: false,
    adverseMedia: false,
    countryRisk: 25,
    transactionRisk: 72,
    behavioralRisk: 48,
  },
  {
    id: 'RP-004',
    entityName: 'Meridian Payroll Inc',
    entityType: 'Corporate',
    jurisdiction: '🇺🇸 United States',
    riskScore: 8,
    riskLevel: 'LOW',
    peprStatus: 'STANDARD',
    lastScreeningDate: '2026-08-19',
    sanctionsHit: false,
    pepMatch: false,
    adverseMedia: false,
    countryRisk: 10,
    transactionRisk: 5,
    behavioralRisk: 12,
  },
];

const INITIAL_RULES: AmlRule[] = [
  {
    id: 'RULE-001',
    ruleName: 'Structuring Detection',
    category: 'Transaction Monitoring',
    description: 'Flags multiple transactions just below regulatory reporting thresholds within a 48-hour window from the same entity.',
    threshold: '≥5 txns below $10K within 48h',
    action: 'BLOCK + SAR FILING',
    enabled: true,
    triggeredCount: 347,
    lastTriggered: '2026-08-19T14:23:01Z',
    falsePositiveRate: 12.4,
  },
  {
    id: 'RULE-002',
    ruleName: 'High-Risk Jurisdiction Routing',
    category: 'Sanctions & Geography',
    description: 'Flags inbound/outbound transfers involving FATF grey-list or OFAC-sanctioned jurisdictions.',
    threshold: 'Any txn involving listed jurisdiction',
    action: 'HOLD + REVIEW',
    enabled: true,
    triggeredCount: 892,
    lastTriggered: '2026-08-19T13:45:12Z',
    falsePositiveRate: 28.7,
  },
  {
    id: 'RULE-003',
    ruleName: 'Circular Fund Flow',
    category: 'Network Analysis',
    description: 'Identifies funds returning to originator through intermediate entities within a 7-day rolling window.',
    threshold: '≥3 hops in 7 days',
    action: 'ALERT + INVESTIGATE',
    enabled: true,
    triggeredCount: 156,
    lastTriggered: '2026-08-19T08:45:21Z',
    falsePositiveRate: 34.2,
  },
  {
    id: 'RULE-004',
    ruleName: 'Trade-Based ML Indicator',
    category: 'Trade Finance',
    description: 'Cross-references LC/guarantee values against customs declaration data to detect over/under-invoicing.',
    threshold: 'Invoice variance > 50% of customs value',
    action: 'BLOCK + ESCALATE',
    enabled: true,
    triggeredCount: 89,
    lastTriggered: '2026-08-19T10:33:07Z',
    falsePositiveRate: 8.1,
  },
  {
    id: 'RULE-005',
    ruleName: 'Beneficial Ownership Obfuscation',
    category: 'KYC / CDD',
    description: 'Detects nominee director chains or trust structures that obscure UBO identity beyond 2 layers.',
    threshold: 'Nominee chain > 2 layers',
    action: 'ESCALATE TO COMPLIANCE',
    enabled: true,
    triggeredCount: 234,
    lastTriggered: '2026-08-19T09:17:44Z',
    falsePositiveRate: 15.9,
  },
  {
    id: 'RULE-006',
    ruleName: 'Anomalous Velocity',
    category: 'Behavioral Analytics',
    description: 'Flags transaction velocity exceeding 3 standard deviations from the entity\u2019s 90-day rolling baseline.',
    threshold: '> 3σ deviation from baseline',
    action: 'ALERT + PAUSE',
    enabled: false,
    triggeredCount: 0,
    lastTriggered: 'N/A',
    falsePositiveRate: 0,
  },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtUSD = (n: number) => `$${fmt(n)}`;

function riskBadgeColor(level: RiskLevel) {
  switch (level) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'HIGH':     return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'MEDIUM':   return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    default:         return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}

function statusBadgeColor(status: TxStatus) {
  switch (status) {
    case 'BLOCKED':      return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'SUSPICIOUS':   return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'UNDER_REVIEW': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    default:             return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  }
}

function toCsv(rows: SuspiciousTransaction[]) {
  const header = 'ID,Timestamp,Sender,SenderCountry,Recipient,RecipientCountry,Amount,Currency,RiskScore,RiskLevel,Status,FlagReason,Channel';
  const lines = rows.map(r =>
    [r.id, r.timestamp, r.senderName, r.senderCountry, r.recipientName, r.recipientCountry,
     r.amount, r.currency, r.riskScore, r.riskLevel, r.status, `"${r.flagReason}"`, r.channel].join(',')
  );
  return [header, ...lines].join('\n');
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function generateRandomTxn(): SuspiciousTransaction {
  const countries = ['🇺🇸 US', '🇬🇧 UK', '🇩🇪 Germany', '🇯🇵 Japan', '🇦🇪 UAE', '🇸🇬 Singapore', '🇨🇭 Switzerland'];
  const names = ['Apex Global Ltd', 'Horizon Holdings', 'Sterling Ventures', 'Atlas Corp', 'Zenith Group', 'Pinnacle Finance'];
  const channels = ['Wire Transfer', 'SWIFT MT103', 'SEPA Credit', 'ACH', 'CHAPS', 'RTGS'];
  const riskLevel: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const statuses: TxStatus[] = ['CLEAN', 'SUSPICIOUS', 'BLOCKED', 'UNDER_REVIEW'];
  const rl = riskLevel[Math.floor(Math.random() * riskLevel.length)];
  return {
    id: `TXN-AML-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    timestamp: new Date().toISOString(),
    senderName: names[Math.floor(Math.random() * names.length)],
    senderCountry: countries[Math.floor(Math.random() * countries.length)],
    recipientName: names[Math.floor(Math.random() * names.length)],
    recipientCountry: countries[Math.floor(Math.random() * countries.length)],
    amount: Math.floor(Math.random() * 5000000) + 50000,
    currency: 'USD',
    riskScore: rl === 'CRITICAL' ? 85 + Math.floor(Math.random() * 16) : rl === 'HIGH' ? 65 + Math.floor(Math.random() * 20) : rl === 'MEDIUM' ? 35 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 35),
    riskLevel: rl,
    status: statuses[Math.floor(Math.random() * statuses.length)],
    flagReason: 'Automated simulation — heuristic anomaly detection triggered',
    deviceId: `DEV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    ipAddress: `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.xx`,
    channel: channels[Math.floor(Math.random() * channels.length)],
  };
}

/* ──────────────────────────── Toast System ──────────────────────────── */

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

let toastIdSeq = 0;

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function FraudDetectionAmlHubPage() {
  /* ── State ── */
  const [txns, setTxns] = useState<SuspiciousTransaction[]>(INITIAL_TXNS);
  const [alerts, setAlerts] = useState<AmlAlert[]>(INITIAL_ALERTS);
  const [riskProfiles] = useState<RiskProfile[]>(INITIAL_RISK_PROFILES);
  const [rules, setRules] = useState<AmlRule[]>(INITIAL_RULES);

  const [activeTab, setActiveTab] = useState<TabId>('monitor');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [selectedTxn, setSelectedTxn] = useState<SuspiciousTransaction | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AmlAlert | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  /* ── Simulation State ── */
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [simTick, setSimTick] = useState(0);
  const [simBlocked, setSimBlocked] = useState(0);
  const [simFlagged, setSimFlagged] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Toast helpers ── */
  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastIdSeq;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  /* ── Simulation tick loop ── */
  const simulationTick = useCallback(() => {
    const newTxn = generateRandomTxn();
    setTxns(prev => [newTxn, ...prev].slice(0, 50));
    setSimTick(prev => prev + 1);
    if (newTxn.status === 'BLOCKED') {
      setSimBlocked(prev => prev + 1);
      addToast(`🚫 BLOCKED: ${fmtUSD(newTxn.amount)} — ${newTxn.flagReason}`, 'error');
    } else if (newTxn.status === 'SUSPICIOUS') {
      setSimFlagged(prev => prev + 1);
      addToast(`⚠️ FLAGGED: ${newTxn.senderName} — Risk Score ${newTxn.riskScore}`, 'warning');
    }
  }, [addToast]);

  useEffect(() => {
    if (simRunning) {
      const ms = simSpeed === 1 ? 2000 : simSpeed === 2 ? 1000 : 500;
      intervalRef.current = setInterval(simulationTick, ms);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [simRunning, simSpeed, simulationTick]);

  const toggleSim = () => setSimRunning(prev => !prev);
  const resetSim = () => {
    setSimRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSimTick(0);
    setSimBlocked(0);
    setSimFlagged(0);
    setTxns(INITIAL_TXNS);
    addToast('🔄 Simulation reset to baseline', 'info');
  };

  /* ── Rule toggle ── */
  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r));
    const rule = rules.find(r => r.id === ruleId);
    if (rule) addToast(`${rule.enabled ? '🔴 Disabled' : '🟢 Enabled'} rule: ${rule.ruleName}`, rule.enabled ? 'warning' : 'success');
  };

  /* ── CSV Export ── */
  const handleExport = () => {
    const csv = toCsv(filteredTxns);
    downloadCsv(csv, `aml-transaction-report-${new Date().toISOString().slice(0, 10)}.csv`);
    addToast(`📥 Exported ${filteredTxns.length} transactions to CSV`, 'success');
  };

  /* ── Filtered data ── */
  const filteredTxns = txns.filter(t => {
    const matchesSearch = searchQuery === '' ||
      t.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.channel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesRisk = riskFilter === 'ALL' || t.riskLevel === riskFilter;
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const filteredAlerts = alerts.filter(a => {
    const matchesSearch = searchQuery === '' ||
      a.alertType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk = riskFilter === 'ALL' || a.severity === riskFilter;
    return matchesSearch && matchesRisk;
  });

  /* ── Aggregate KPIs ── */
  const totalBlocked = txns.filter(t => t.status === 'BLOCKED').reduce((s, t) => s + t.amount, 0);
  const totalSuspicious = txns.filter(t => t.status === 'SUSPICIOUS' || t.status === 'UNDER_REVIEW').length;
  const criticalCount = txns.filter(t => t.riskLevel === 'CRITICAL').length;
  const avgRisk = txns.length ? Math.round(txns.reduce((s, t) => s + t.riskScore, 0) / txns.length) : 0;

  /* ── Tab configs ── */
  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'monitor', label: 'Transaction Monitor', icon: <Activity className="w-4 h-4" /> },
    { id: 'alerts', label: 'AML Alerts', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'risk-scoring', label: 'Risk Profiles', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'rule-engine', label: 'Rule Engine', icon: <Scan className="w-4 h-4" /> },
  ];

  /* ══════════════════════════════ RENDER ══════════════════════════════ */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">

      {/* ── Toast Container ── */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium animate-[slideIn_0.3s_ease-out] ${
              t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' :
              t.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-200' :
              t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' :
              'bg-slate-800/90 border-slate-700 text-slate-200'
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Executive Header ── */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-red-950 via-slate-900 to-rose-950 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full font-semibold border border-red-500/30 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> PaySphere AML Command Center
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> BSA/AML & FATF Compliant
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-red-200 bg-clip-text text-transparent">
              Fraud Detection & AML Intelligence
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              Real-time transaction monitoring, suspicious activity detection, sanctions screening, risk scoring engine, and automated SAR filing orchestration.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-red-600/30 transition flex items-center gap-2 border border-red-400/20 text-sm"
            >
              <Download className="w-4 h-4" /> Export SAR Report
            </button>
          </div>
        </div>
      </header>

      {/* ── KPI Stats ── */}
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Blocked Amount (24h)</span>
              <Ban className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{fmtUSD(totalBlocked)}</div>
            <div className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <ArrowDownRight className="w-3.5 h-3.5" /> {txns.filter(t => t.status === 'BLOCKED').length} transactions halted
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Active Alerts</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{alerts.filter(a => a.resolution === 'PENDING').length}</div>
            <div className="text-amber-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" /> {totalSuspicious} suspicious txns under review
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Critical Entities</span>
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{criticalCount}</div>
            <div className="text-red-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <Flag className="w-3.5 h-3.5" /> Requires immediate escalation
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Avg Risk Score</span>
              <BarChart3 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">{avgRisk}<span className="text-lg text-slate-500">/100</span></div>
            <div className="text-indigo-400 text-xs mt-2 flex items-center gap-1 font-medium">
              <Activity className="w-3.5 h-3.5" /> Across {txns.length} monitored transactions
            </div>
          </div>
        </div>

        {/* ── Simulation Sandbox ── */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Live Simulation Sandbox
              </span>
              <span className="text-slate-500 text-xs">Tick: {simTick} | Blocked: {simBlocked} | Flagged: {simFlagged}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSim}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${
                  simRunning
                    ? 'bg-amber-600/20 text-amber-300 border-amber-500/30 hover:bg-amber-600/30'
                    : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                }`}
              >
                {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {simRunning ? 'Pause' : 'Start'} Simulation
              </button>

              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {([1, 2, 4] as SimSpeed[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSimSpeed(s)}
                    className={`px-3 py-2 text-xs font-bold transition ${
                      simSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                onClick={resetSim}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation + Search/Filter ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-none px-4 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search entities, channels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-red-500 transition"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Status</option>
              <option value="CLEAN">Clean</option>
              <option value="SUSPICIOUS">Suspicious</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">All Risk</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>

        {/* ═══════════════ TAB: Transaction Monitor ═══════════════ */}
        {activeTab === 'monitor' && (
          <div className="space-y-3">
            {filteredTxns.length === 0 ? (
              <div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800">
                <ShieldCheck className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
                <h3 className="text-slate-300 font-semibold text-lg">No transactions match filters</h3>
                <p className="text-slate-500 text-sm mt-1">Adjust your search or filter criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTxns.map(txn => (
                  <div
                    key={txn.id}
                    onClick={() => setSelectedTxn(txn)}
                    className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-mono text-slate-500">{txn.id}</span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusBadgeColor(txn.status)}`}>
                            {txn.status.replace('_', ' ')}
                          </span>
                          <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(txn.riskLevel)}`}>
                            {txn.riskLevel} — {txn.riskScore}/100
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-white font-semibold truncate">{txn.senderName}</span>
                          <span className="text-slate-500">{txn.senderCountry}</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-white font-semibold truncate">{txn.recipientName}</span>
                          <span className="text-slate-500">{txn.recipientCountry}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1.5 line-clamp-1">
                          <AlertTriangle className="w-3 h-3 inline mr-1 text-amber-400" />
                          {txn.flagReason}
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-lg font-black text-white font-mono">{fmtUSD(txn.amount)}</div>
                          <div className="text-xs text-slate-500">{txn.channel}</div>
                        </div>
                        <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════ TAB: AML Alerts ═══════════════ */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {filteredAlerts.map(alt => (
              <div
                key={alt.id}
                onClick={() => setSelectedAlert(alt)}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{alt.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(alt.severity)}`}>
                        {alt.severity}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">{alt.alertType}</span>
                    </div>
                    <p className="text-sm text-slate-300 line-clamp-2">{alt.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span><Clock className="w-3 h-3 inline mr-1" />{new Date(alt.triggeredAt).toLocaleString()}</span>
                      <span><Users className="w-3 h-3 inline mr-1" />{alt.assignedAnalyst}</span>
                      <span className={`font-semibold ${alt.resolution === 'PENDING' ? 'text-amber-400' : alt.resolution === 'FALSE_POSITIVE' ? 'text-slate-500' : alt.resolution === 'ESCALATED_TO_COMPLIANCE' ? 'text-red-400' : 'text-blue-400'}`}>
                        {alt.resolution.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-none" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ TAB: Risk Profiles ═══════════════ */}
        {activeTab === 'risk-scoring' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {riskProfiles.map(rp => (
              <div
                key={rp.id}
                onClick={() => setSelectedProfile(rp)}
                className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-bold text-base">{rp.entityName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{rp.entityType} · {rp.jurisdiction}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full border font-bold ${riskBadgeColor(rp.riskLevel)}`}>
                    {rp.riskScore}/100
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Country</div>
                    <div className={`text-lg font-black ${rp.countryRisk > 70 ? 'text-red-400' : rp.countryRisk > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{rp.countryRisk}</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Transaction</div>
                    <div className={`text-lg font-black ${rp.transactionRisk > 70 ? 'text-red-400' : rp.transactionRisk > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{rp.transactionRisk}</div>
                  </div>
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-800">
                    <div className="text-xs text-slate-500 mb-1">Behavioral</div>
                    <div className={`text-lg font-black ${rp.behavioralRisk > 70 ? 'text-red-400' : rp.behavioralRisk > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{rp.behavioralRisk}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 text-xs">
                  {rp.sanctionsHit && <span className="bg-red-500/20 text-red-300 px-2.5 py-1 rounded-lg border border-red-500/30 font-semibold">Sanctions Hit</span>}
                  {rp.pepMatch && <span className="bg-orange-500/20 text-orange-300 px-2.5 py-1 rounded-lg border border-orange-500/30 font-semibold">PEP Match</span>}
                  {rp.adverseMedia && <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30 font-semibold">Adverse Media</span>}
                  {!rp.sanctionsHit && !rp.pepMatch && !rp.adverseMedia && <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30 font-semibold">Clean Screening</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════════════ TAB: Rule Engine ═══════════════ */}
        {activeTab === 'rule-engine' && (
          <div className="space-y-4">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`bg-slate-900/70 border rounded-2xl p-6 transition ${rule.enabled ? 'border-slate-800/80' : 'border-slate-800/40 opacity-60'}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{rule.id}</span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">{rule.category}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${rule.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600'}`}>
                        {rule.enabled ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-1">{rule.ruleName}</h3>
                    <p className="text-sm text-slate-400 mb-2">{rule.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Threshold: <span className="text-slate-300 font-medium">{rule.threshold}</span></span>
                      <span>Action: <span className="text-red-400 font-semibold">{rule.action}</span></span>
                      <span>Triggered: <span className="text-white font-bold">{fmt(rule.triggeredCount)}</span>×</span>
                      <span>FP Rate: <span className={rule.falsePositiveRate > 25 ? 'text-amber-400' : 'text-emerald-400'}>{rule.falsePositiveRate}%</span></span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`flex-none px-5 py-2.5 rounded-xl text-sm font-bold border transition ${
                      rule.enabled
                        ? 'bg-red-600/20 text-red-300 border-red-500/30 hover:bg-red-600/30'
                        : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-600/30'
                    }`}
                  >
                    {rule.enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ═══════════════ MODAL: Transaction Detail ═══════════════ */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedTxn(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTxn(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedTxn.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusBadgeColor(selectedTxn.status)}`}>{selectedTxn.status.replace('_', ' ')}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(selectedTxn.riskLevel)}`}>{selectedTxn.riskLevel}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedTxn.senderName} → {selectedTxn.recipientName}</h2>
            <p className="text-xs text-slate-500 mb-4">{new Date(selectedTxn.timestamp).toLocaleString()} · {selectedTxn.channel}</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Amount</span>
                <span className="text-white font-bold text-sm">{fmtUSD(selectedTxn.amount)} {selectedTxn.currency}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Risk Score</span>
                <span className="text-red-400 font-bold text-sm">{selectedTxn.riskScore}/100</span>
              </div>
              <div>
                <span className="text-slate-500 block">Sender Country</span>
                <span className="text-white font-bold text-sm">{selectedTxn.senderCountry}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Recipient Country</span>
                <span className="text-white font-bold text-sm">{selectedTxn.recipientCountry}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Device ID</span>
                <span className="text-blue-400 font-bold text-sm">{selectedTxn.deviceId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">IP Address</span>
                <span className="text-blue-400 font-bold text-sm">{selectedTxn.ipAddress}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Flag Reason</span>
                <span className="text-amber-400 font-bold text-sm">{selectedTxn.flagReason}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedTxn(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close Audit View</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Alert Detail ═══════════════ */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedAlert(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedAlert(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedAlert.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(selectedAlert.severity)}`}>{selectedAlert.severity}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedAlert.alertType}</h2>
            <p className="text-xs text-slate-500 mb-4">Rule: {selectedAlert.ruleId} · Analyst: {selectedAlert.assignedAnalyst}</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-sm text-slate-300 leading-relaxed">
              {selectedAlert.description}
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Triggered At</span>
                <span className="text-white font-bold text-sm">{new Date(selectedAlert.triggeredAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Resolution</span>
                <span className="text-amber-400 font-bold text-sm">{selectedAlert.resolution.replace(/_/g, ' ')}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Related Transaction IDs</span>
                <span className="text-blue-400 font-bold text-sm">{selectedAlert.relatedTxIds.join(', ')}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedAlert(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Risk Profile Detail ═══════════════ */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedProfile(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProfile(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono text-slate-500">{selectedProfile.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${riskBadgeColor(selectedProfile.riskLevel)}`}>{selectedProfile.riskLevel}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedProfile.entityName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedProfile.entityType} · {selectedProfile.jurisdiction} · PEPR: {selectedProfile.peprStatus}</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Overall Risk Score</span>
                <span className="text-red-400 font-bold text-sm">{selectedProfile.riskScore}/100</span>
              </div>
              <div>
                <span className="text-slate-500 block">Last Screening</span>
                <span className="text-white font-bold text-sm">{selectedProfile.lastScreeningDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Country Risk</span>
                <span className="text-white font-bold text-sm">{selectedProfile.countryRisk}/100</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transaction Risk</span>
                <span className="text-white font-bold text-sm">{selectedProfile.transactionRisk}/100</span>
              </div>
              <div>
                <span className="text-slate-500 block">Behavioral Risk</span>
                <span className="text-white font-bold text-sm">{selectedProfile.behavioralRisk}/100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Flags:</span>
                {selectedProfile.sanctionsHit && <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded border border-red-500/30 text-xs">Sanctions</span>}
                {selectedProfile.pepMatch && <span className="bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30 text-xs">PEP</span>}
                {selectedProfile.adverseMedia && <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 text-xs">Media</span>}
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedProfile(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close Profile</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Animation Keyframes (inline) ── */}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
