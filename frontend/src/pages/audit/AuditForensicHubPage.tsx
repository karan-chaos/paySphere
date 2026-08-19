import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Filter, Download, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  Eye, X, Play, Pause, RotateCcw, Zap, Activity, Globe, DollarSign, Users,
  Clock, TrendingUp, TrendingDown, BarChart3, FileText, Ban, Flag, RefreshCw,
  Layers, ArrowUpRight, ArrowDownRight, Shield, ShieldCheck, ShieldAlert,
  Fingerprint, Scan, Lock, Unlock, KeyRound, Database, ServerCrash,
  History, GitBranch, GitCommit, AlertCircle, BadgeCheck,
} from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */

type TabId = 'trail' | 'forensic' | 'compliance' | 'analytics';
type SimSpeed = 1 | 2 | 4;
type Severity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
type AuditAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'APPROVE' | 'DENY' | 'TRANSFER';

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  sessionId: string;
  severity: Severity;
  department: string;
  previousValue: string | null;
  newValue: string | null;
}

interface ForensicCase {
  id: string;
  title: string;
  severity: Severity;
  status: 'OPEN' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'CLOSED';
  assignee: string;
  createdDate: string;
  lastUpdated: string;
  relatedEntries: string[];
  evidenceCount: number;
  riskScore: number;
  description: string;
  category: string;
}

interface ComplianceRule {
  id: string;
  ruleName: string;
  framework: string;
  description: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL' | 'UNDER_REVIEW';
  lastAuditDate: string;
  nextAuditDate: string;
  findings: number;
  riskLevel: Severity;
  owner: string;
}

/* ──────────────────────────── Mock Data ──────────────────────────── */

const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2026-08-19T14:32:15Z', userId: 'USR-101', userName: 'Sarah Chen', action: 'TRANSFER', resource: 'Wire Transfer', resourceId: 'TXN-88421', details: 'Initiated $284,750 wire to BVI entity — flagged by AML rule RULE-001', ipAddress: '10.0.42.15', sessionId: 'SES-9A2F', severity: 'CRITICAL', department: 'Treasury', previousValue: null, newValue: '$284,750 → Shell Corp BVI' },
  { id: 'AUD-002', timestamp: '2026-08-19T14:28:03Z', userId: 'USR-205', userName: 'Marcus Webb', action: 'APPROVE', resource: 'Purchase Order', resourceId: 'PO-2026-001', details: 'Approved AWS reserved instances PO for $480,000', ipAddress: '10.0.42.22', sessionId: 'SES-7B1D', severity: 'INFO', department: 'Engineering', previousValue: 'PENDING_APPROVAL', newValue: 'APPROVED' },
  { id: 'AUD-003', timestamp: '2026-08-19T14:15:44Z', userId: 'USR-089', userName: 'Elena Vasquez', action: 'EXPORT', resource: 'Payroll Report', resourceId: 'RPT-Q3-2026', details: 'Exported full Q3 payroll data including SSNs — bulk download flagged', ipAddress: '10.0.42.8', sessionId: 'SES-4C3E', severity: 'WARNING', department: 'HR', previousValue: null, newValue: '452 records exported' },
  { id: 'AUD-004', timestamp: '2026-08-19T13:55:21Z', userId: 'USR-312', userName: 'David Okafor', action: 'UPDATE', resource: 'Employee Record', resourceId: 'EMP-3201', details: 'Modified salary structure — increased base from $85,000 to $95,000', ipAddress: '10.0.42.31', sessionId: 'SES-2A8F', severity: 'INFO', department: 'Sales', previousValue: '$85,000 base', newValue: '$95,000 base' },
  { id: 'AUD-005', timestamp: '2026-08-19T13:42:09Z', userId: 'USR-401', userName: 'Tom Bradley', action: 'DENY', resource: 'Vendor Payment', resourceId: 'VND-PAY-7741', details: 'Denied $125,000 payment to Sahara Logistics — compliance hold', ipAddress: '10.0.42.44', sessionId: 'SES-6D5A', severity: 'WARNING', department: 'Finance', previousValue: 'PENDING', newValue: 'DENIED — compliance hold' },
  { id: 'AUD-006', timestamp: '2026-08-19T13:30:00Z', userId: 'USR-502', userName: 'Wei Zhang', action: 'LOGIN', resource: 'System', resourceId: 'AUTH', details: 'Successful login from new device — MFA verified', ipAddress: '203.45.122.8', sessionId: 'SES-1E7C', severity: 'INFO', department: 'Product', previousValue: null, newValue: 'Device: MacBook Pro M4' },
  { id: 'AUD-007', timestamp: '2026-08-19T12:58:33Z', userId: 'USR-101', userName: 'Sarah Chen', action: 'DELETE', resource: 'Vendor Record', resourceId: 'VND-006', details: 'Soft-deleted Shenzhen Electronics — suspended due to risk score 95', ipAddress: '10.0.42.15', sessionId: 'SES-9A2F', severity: 'CRITICAL', department: 'Treasury', previousValue: 'ACTIVE', newValue: 'TERMINATED' },
  { id: 'AUD-008', timestamp: '2026-08-19T12:15:11Z', userId: 'USR-089', userName: 'Elena Vasquez', action: 'CREATE', resource: 'Benefit Enrollment', resourceId: 'BEN-9901', details: 'Enrolled in Executive Health PPO Elite — $850/mo deduction', ipAddress: '10.0.42.8', sessionId: 'SES-4C3E', severity: 'INFO', department: 'HR', previousValue: null, newValue: 'PLATINUM Health PPO' },
];

const INITIAL_CASES: ForensicCase[] = [
  { id: 'FC-001', title: 'Suspected Payroll Padding Scheme', severity: 'CRITICAL', status: 'INVESTIGATING', assignee: 'Sarah Chen', createdDate: '2026-08-15', lastUpdated: '2026-08-19', relatedEntries: ['AUD-004', 'AUD-007'], evidenceCount: 12, riskScore: 92, description: 'Multiple unauthorized salary modifications detected in Sales department. Pattern suggests collusion between manager and payroll admin.', category: 'Internal Fraud' },
  { id: 'FC-002', title: 'Vendor Kickback Investigation', severity: 'HIGH', status: 'OPEN', assignee: 'Marcus Webb', createdDate: '2026-08-12', lastUpdated: '2026-08-18', relatedEntries: ['AUD-005'], evidenceCount: 8, riskScore: 78, description: 'Irregular payment patterns to Sahara Logistics FZCO. Payment amounts exceed quoted services by 340%.', category: 'Procurement Fraud' },
  { id: 'FC-003', title: 'Data Exfiltration Attempt', severity: 'EMERGENCY', status: 'ESCALATED', assignee: 'Tom Bradley', createdDate: '2026-08-18', lastUpdated: '2026-08-19', relatedEntries: ['AUD-003', 'AUD-006'], evidenceCount: 24, riskScore: 98, description: 'Bulk export of payroll data including PII. Export flagged by DLP system. Employee accessed from new device outside normal pattern.', category: 'Data Breach' },
  { id: 'FC-004', title: 'Ghost Employee Audit', severity: 'MEDIUM', status: 'RESOLVED', assignee: 'Elena Vasquez', createdDate: '2026-08-01', lastUpdated: '2026-08-15', relatedEntries: [], evidenceCount: 6, riskScore: 45, description: 'Investigation into potentially fictitious employees receiving payroll. concluded — 2 phantom records found and removed.', category: 'Payroll Integrity' },
];

const INITIAL_COMPLIANCE: ComplianceRule[] = [
  { id: 'CMP-001', ruleName: 'SOX Section 404 — Internal Controls', framework: 'SOX', description: 'Maintain documented internal controls over financial reporting with segregation of duties', status: 'COMPLIANT', lastAuditDate: '2026-07-01', nextAuditDate: '2026-10-01', findings: 0, riskLevel: 'INFO', owner: 'CFO Office' },
  { id: 'CMP-002', ruleName: 'GDPR Article 30 — Records of Processing', framework: 'GDPR', description: 'Maintain records of all personal data processing activities with lawful basis documentation', status: 'PARTIAL', lastAuditDate: '2026-06-15', nextAuditDate: '2026-09-15', findings: 3, riskLevel: 'WARNING', owner: 'DPO' },
  { id: 'CMP-003', ruleName: 'PCI DSS 3.2 — Access Control', framework: 'PCI DSS', description: 'Restrict access to cardholder data by business need-to-know with role-based access', status: 'COMPLIANT', lastAuditDate: '2026-08-01', nextAuditDate: '2026-11-01', findings: 0, riskLevel: 'INFO', owner: 'Security Team' },
  { id: 'CMP-004', ruleName: 'SOC 2 CC6.1 — Logical Access', framework: 'SOC 2', description: 'Implement logical access security controls including MFA and session management', status: 'NON_COMPLIANT', lastAuditDate: '2026-07-20', nextAuditDate: '2026-08-20', findings: 5, riskLevel: 'CRITICAL', owner: 'CISO' },
  { id: 'CMP-005', ruleName: 'BSA/AML — Suspicious Activity Reporting', framework: 'BSA', description: 'File SARs within 30 days of detecting suspicious transactions above threshold', status: 'COMPLIANT', lastAuditDate: '2026-08-15', nextAuditDate: '2026-11-15', findings: 0, riskLevel: 'INFO', owner: 'Compliance Officer' },
  { id: 'CMP-006', ruleName: 'HIPAA §164.312 — Technical Safeguards', framework: 'HIPAA', description: 'Implement encryption, access controls, and audit controls for ePHI', status: 'UNDER_REVIEW', lastAuditDate: '2026-08-10', nextAuditDate: '2026-09-10', findings: 2, riskLevel: 'WARNING', owner: 'Privacy Officer' },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

function severityColor(s: Severity) {
  switch (s) { case 'EMERGENCY': return 'bg-rose-600/20 text-rose-300 border-rose-500/30'; case 'CRITICAL': return 'bg-red-500/20 text-red-300 border-red-500/30'; case 'WARNING': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function actionColor(a: AuditAction) {
  switch (a) { case 'DELETE': case 'DENY': return 'bg-red-500/20 text-red-300 border-red-500/30'; case 'TRANSFER': case 'APPROVE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'UPDATE': case 'CREATE': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; case 'EXPORT': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function caseStatusColor(s: string) {
  switch (s) { case 'RESOLVED': case 'CLOSED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'INVESTIGATING': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; case 'ESCALATED': return 'bg-red-500/20 text-red-300 border-red-500/30'; default: return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; }
}
function complianceColor(s: string) {
  switch (s) { case 'COMPLIANT': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'NON_COMPLIANT': return 'bg-red-500/20 text-red-300 border-red-500/30'; case 'PARTIAL': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; }
}
function fmtTime(ts: string) { return new Date(ts).toLocaleString(); }
function toCsv(rows: AuditEntry[]) {
  const h = 'ID,Timestamp,User,Action,Resource,ResourceID,Severity,Department,IP,Details';
  const lines = rows.map(r => [r.id, r.timestamp, r.userName, r.action, r.resource, r.resourceId, r.severity, r.department, r.ipAddress, `"${r.details}"`].join(','));
  return [h, ...lines].join('\n');
}
function dlCsv(csv: string, n: string) { const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = n; a.click(); URL.revokeObjectURL(u); }
function genEntry(): AuditEntry {
  const users = ['Sarah Chen', 'Marcus Webb', 'Tom Bradley', 'Elena Vasquez', 'David Okafor', 'Priya Nair'];
  const actions: AuditAction[] = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'APPROVE', 'DENY', 'TRANSFER'];
  const resources = ['Payroll Record', 'Wire Transfer', 'Vendor Payment', 'Employee Record', 'Benefit Enrollment', 'Purchase Order', 'Tax Filing'];
  const sevs: Severity[] = ['INFO', 'INFO', 'INFO', 'WARNING', 'CRITICAL'];
  const depts = ['Treasury', 'HR', 'Finance', 'Engineering', 'Sales', 'Product'];
  const action = actions[Math.floor(Math.random() * actions.length)];
  const sev = sevs[Math.floor(Math.random() * sevs.length)];
  return {
    id: `AUD-${String(Math.floor(Math.random() * 9000) + 1000)}`, timestamp: new Date().toISOString(),
    userId: `USR-${String(Math.floor(Math.random() * 900))}`, userName: users[Math.floor(Math.random() * users.length)],
    action, resource: resources[Math.floor(Math.random() * resources.length)], resourceId: `RES-${Math.floor(Math.random() * 99999)}`,
    details: `Automated simulation — ${action.toLowerCase()} event generated by tick engine`,
    ipAddress: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    sessionId: `SES-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    severity: sev, department: depts[Math.floor(Math.random() * depts.length)],
    previousValue: Math.random() > 0.5 ? 'Previous state' : null,
    newValue: Math.random() > 0.5 ? 'New state' : null,
  };
}

interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info'; }
let toastSeq = 0;

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function AuditForensicHubPage() {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT);
  const [cases] = useState<ForensicCase[]>(INITIAL_CASES);
  const [compliance] = useState<ComplianceRule[]>(INITIAL_COMPLIANCE);
  const [activeTab, setActiveTab] = useState<TabId>('trail');
  const [searchQuery, setSearchQuery] = useState('');
  const [sevFilter, setSevFilter] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);
  const [selectedCase, setSelectedCase] = useState<ForensicCase | null>(null);
  const [selectedCompliance, setSelectedCompliance] = useState<ComplianceRule | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [simTick, setSimTick] = useState(0);
  const [simCriticals, setSimCriticals] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToast = useCallback((m: string, t: Toast['type'] = 'info') => { const id = ++toastSeq; setToasts(p => [...p, { id, message: m, type: t }]); setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000); }, []);
  const dismissToast = (id: number) => setToasts(p => p.filter(t => t.id !== id));

  const tick = useCallback(() => {
    const e = genEntry();
    setAuditLog(p => [e, ...p].slice(0, 50));
    setSimTick(p => p + 1);
    if (e.severity === 'CRITICAL' || e.severity === 'EMERGENCY') { setSimCriticals(p => p + 1); addToast(`🚨 ${e.severity}: ${e.action} on ${e.resource} by ${e.userName}`, 'error'); }
    else addToast(`📋 ${e.action}: ${e.resource} — ${e.resourceId}`, 'info');
  }, [addToast]);

  useEffect(() => {
    if (simRunning) { const ms = simSpeed === 1 ? 2000 : simSpeed === 2 ? 1000 : 500; intervalRef.current = setInterval(tick, ms); }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simRunning, simSpeed, tick]);

  const toggleSim = () => setSimRunning(p => !p);
  const resetSim = () => { setSimRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); setSimTick(0); setSimCriticals(0); setAuditLog(INITIAL_AUDIT); addToast('🔄 Reset', 'info'); };
  const handleExport = () => { dlCsv(toCsv(filtered), `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`); addToast(`📥 Exported ${filtered.length} entries`, 'success'); };

  const filtered = auditLog.filter(e => {
    const mS = searchQuery === '' || e.userName.toLowerCase().includes(searchQuery.toLowerCase()) || e.resource.toLowerCase().includes(searchQuery.toLowerCase()) || e.details.toLowerCase().includes(searchQuery.toLowerCase());
    const mSev = sevFilter === 'ALL' || e.severity === sevFilter;
    return mS && mSev;
  });

  const critCount = auditLog.filter(e => e.severity === 'CRITICAL' || e.severity === 'EMERGENCY').length;
  const openCases = cases.filter(c => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;
  const compIssues = compliance.reduce((s, c) => s + c.findings, 0);

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'trail', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
    { id: 'forensic', label: 'Forensic Cases', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'compliance', label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (<div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl text-sm font-medium animate-[slideIn_0.3s_ease-out] ${t.type === 'error' ? 'bg-red-950/90 border-red-500/30 text-red-200' : t.type === 'warning' ? 'bg-amber-950/90 border-amber-500/30 text-amber-200' : t.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200' : 'bg-slate-800/90 border-slate-700 text-slate-200'}`}><span className="flex-1">{t.message}</span><button onClick={() => dismissToast(t.id)} className="text-slate-400 hover:text-white"><X className="w-3.5 h-3.5" /></button></div>))}
      </div>

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-violet-950 via-slate-900 to-purple-950 border border-violet-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-violet-500/20 text-violet-300 text-xs px-3 py-1 rounded-full font-semibold border border-violet-500/30 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> PaySphere Forensic Command</span>
              <span className="text-slate-400 text-xs flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-400" /> Tamper-Proof Immutable Ledger</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-violet-200 bg-clip-text text-transparent">Audit Trail & Forensic Accounting Hub</h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">Immutable audit ledger, forensic investigation management, multi-framework compliance tracking, and organizational analytics.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-violet-600/30 transition flex items-center gap-2 border border-violet-400/20 text-sm"><Download className="w-4 h-4" /> Export Audit Log</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Audit Entries (24h)</span><History className="w-4 h-4 text-violet-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{auditLog.length}</div>
            <div className="text-violet-400 text-xs mt-2 font-medium">{critCount} critical/emergency</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Open Forensic Cases</span><Fingerprint className="w-4 h-4 text-red-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{openCases}</div>
            <div className="text-red-400 text-xs mt-2 font-medium">{cases.filter(c => c.status === 'ESCALATED').length} escalated</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Compliance Frameworks</span><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{compliance.length}</div>
            <div className="text-emerald-400 text-xs mt-2 font-medium">{compliance.filter(c => c.status === 'COMPLIANT').length} fully compliant</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Open Findings</span><AlertCircle className="w-4 h-4 text-amber-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{compIssues}</div>
            <div className="text-amber-400 text-xs mt-2 font-medium">Across {compliance.filter(c => c.findings > 0).length} frameworks</div>
          </div>
        </div>

        {/* Simulation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Live Audit Stream</span>
              <span className="text-slate-500 text-xs">Tick: {simTick} | Critical: {simCriticals}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSim} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${simRunning ? 'bg-amber-600/20 text-amber-300 border-amber-500/30' : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'}`}>{simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{simRunning ? 'Pause' : 'Start'}</button>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">{([1, 2, 4] as SimSpeed[]).map(s => (<button key={s} onClick={() => setSimSpeed(s)} className={`px-3 py-2 text-xs font-bold transition ${simSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{s}x</button>))}</div>
              <button onClick={resetSim} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"><RotateCcw className="w-4 h-4" /> Reset</button>
            </div>
          </div>
        </div>

        {/* Tabs + Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {TABS.map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-none px-4 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>{tab.icon} {tab.label}</button>))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" placeholder="Search users, resources..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-violet-500 transition" /></div>
            <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)} className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none"><option value="ALL">All Severity</option><option value="INFO">Info</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option><option value="EMERGENCY">Emergency</option></select>
          </div>
        </div>

        {/* ═══════ TAB: Audit Trail ═══════ */}
        {activeTab === 'trail' && (
          <div className="space-y-3">
            {filtered.length === 0 ? (<div className="bg-slate-900/60 rounded-2xl p-12 text-center border border-slate-800"><CheckCircle2 className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" /><h3 className="text-slate-300 font-semibold text-lg">No audit entries match</h3></div>) : filtered.map(e => (
              <div key={e.id} onClick={() => setSelectedEntry(e)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{e.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${severityColor(e.severity)}`}>{e.severity}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${actionColor(e.action)}`}>{e.action}</span>
                    </div>
                    <div className="text-sm text-white font-semibold">{e.userName} <span className="text-slate-400 font-normal">· {e.resource} ({e.resourceId})</span></div>
                    <div className="text-xs text-slate-500 mt-1 line-clamp-1">{e.details}</div>
                    <div className="text-xs text-slate-500 mt-1"><Clock className="w-3 h-3 inline mr-1" />{fmtTime(e.timestamp)} · {e.department} · {e.ipAddress}</div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-none" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Forensic Cases ═══════ */}
        {activeTab === 'forensic' && (
          <div className="space-y-3">
            {cases.map(c => (
              <div key={c.id} onClick={() => setSelectedCase(c)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{c.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${severityColor(c.severity)}`}>{c.severity}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${caseStatusColor(c.status)}`}>{c.status}</span>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">{c.category}</span>
                    </div>
                    <h3 className="text-white font-bold text-base mb-1">{c.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                    <div className="text-xs text-slate-500 mt-2">Assignee: {c.assignee} · Evidence: {c.evidenceCount} items · Risk: {c.riskScore}/100 · Updated: {c.lastUpdated}</div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-none" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Compliance ═══════ */}
        {activeTab === 'compliance' && (
          <div className="space-y-3">
            {compliance.map(c => (
              <div key={c.id} onClick={() => setSelectedCompliance(c)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{c.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${complianceColor(c.status)}`}>{c.status.replace(/_/g, ' ')}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${severityColor(c.riskLevel)}`}>{c.riskLevel}</span>
                      <span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-500/30 font-semibold">{c.framework}</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">{c.ruleName}</h3>
                    <p className="text-xs text-slate-500 mb-1">{c.description}</p>
                    <div className="text-xs text-slate-500">Owner: {c.owner} · Findings: {c.findings} · Last: {c.lastAuditDate} · Next: {c.nextAuditDate}</div>
                  </div>
                  <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition flex-none" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Analytics ═══════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-violet-400" /> Actions by Type</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(['CREATE', 'READ', 'UPDATE', 'DELETE', 'TRANSFER', 'APPROVE', 'DENY', 'EXPORT', 'LOGIN', 'LOGOUT'] as AuditAction[]).map(a => {
                  const count = auditLog.filter(e => e.action === a).length;
                  return (<div key={a} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center"><span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${actionColor(a)}`}>{a}</span><div className="text-3xl font-black text-white mt-3">{count}</div></div>);
                })}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Compliance Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {compliance.map(c => (<div key={c.id} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center"><span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${complianceColor(c.status)}`}>{c.status.replace(/_/g, ' ')}</span><div className="text-xs text-slate-500 mt-2">{c.framework}</div><div className="text-xl font-black text-white mt-1">{c.findings}</div><div className="text-xs text-slate-400">findings</div></div>))}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Fingerprint className="w-5 h-5 text-red-400" /> Forensic Case Risk Matrix</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cases.map(c => (<div key={c.id} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center"><span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${caseStatusColor(c.status)}`}>{c.status}</span><div className="text-xs text-slate-500 mt-2">{c.category}</div><div className={`text-3xl font-black font-mono mt-1 ${c.riskScore > 80 ? 'text-red-400' : c.riskScore > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{c.riskScore}</div><div className="text-xs text-slate-400">risk score</div></div>))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ MODALS ═══════════════ */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedEntry(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEntry(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1"><span className="text-xs font-mono text-slate-500">{selectedEntry.id}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${severityColor(selectedEntry.severity)}`}>{selectedEntry.severity}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${actionColor(selectedEntry.action)}`}>{selectedEntry.action}</span></div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedEntry.userName}</h2>
            <p className="text-xs text-slate-500 mb-4">{fmtTime(selectedEntry.timestamp)} · {selectedEntry.department} · {selectedEntry.sessionId}</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-sm text-slate-300">{selectedEntry.details}</div>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Resource</span><span className="text-white font-bold text-sm">{selectedEntry.resource} ({selectedEntry.resourceId})</span></div>
              <div><span className="text-slate-500 block">IP Address</span><span className="text-blue-400 font-bold text-sm">{selectedEntry.ipAddress}</span></div>
              {selectedEntry.previousValue && <div><span className="text-slate-500 block">Previous</span><span className="text-amber-400 font-bold text-sm">{selectedEntry.previousValue}</span></div>}
              {selectedEntry.newValue && <div><span className="text-slate-500 block">New Value</span><span className="text-emerald-400 font-bold text-sm">{selectedEntry.newValue}</span></div>}
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedEntry(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}
      {selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedCase(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedCase(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1"><span className="text-xs font-mono text-slate-500">{selectedCase.id}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${severityColor(selectedCase.severity)}`}>{selectedCase.severity}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${caseStatusColor(selectedCase.status)}`}>{selectedCase.status}</span></div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedCase.title}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedCase.category} · Assignee: {selectedCase.assignee}</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-sm text-slate-300 leading-relaxed">{selectedCase.description}</div>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Risk Score</span><span className={`font-bold text-sm ${selectedCase.riskScore > 80 ? 'text-red-400' : 'text-amber-400'}`}>{selectedCase.riskScore}/100</span></div>
              <div><span className="text-slate-500 block">Evidence Items</span><span className="text-white font-bold text-sm">{selectedCase.evidenceCount}</span></div>
              <div><span className="text-slate-500 block">Created</span><span className="text-white font-bold text-sm">{selectedCase.createdDate}</span></div>
              <div><span className="text-slate-500 block">Last Updated</span><span className="text-white font-bold text-sm">{selectedCase.lastUpdated}</span></div>
              <div className="col-span-2"><span className="text-slate-500 block">Related Audit Entries</span><span className="text-violet-400 font-bold text-sm">{selectedCase.relatedEntries.join(', ') || 'None'}</span></div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedCase(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}
      {selectedCompliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedCompliance(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedCompliance(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1"><span className="text-xs font-mono text-slate-500">{selectedCompliance.id}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${complianceColor(selectedCompliance.status)}`}>{selectedCompliance.status.replace(/_/g, ' ')}</span><span className="text-xs bg-violet-500/20 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-500/30 font-semibold">{selectedCompliance.framework}</span></div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedCompliance.ruleName}</h2>
            <p className="text-xs text-slate-500 mb-4">Owner: {selectedCompliance.owner}</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-sm text-slate-300 leading-relaxed">{selectedCompliance.description}</div>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-xs font-mono">
              <div><span className="text-slate-500 block">Findings</span><span className={`font-bold text-sm ${selectedCompliance.findings > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{selectedCompliance.findings}</span></div>
              <div><span className="text-slate-500 block">Risk Level</span><span className={`font-bold text-sm ${selectedCompliance.riskLevel === 'CRITICAL' ? 'text-red-400' : selectedCompliance.riskLevel === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'}`}>{selectedCompliance.riskLevel}</span></div>
              <div><span className="text-slate-500 block">Last Audit</span><span className="text-white font-bold text-sm">{selectedCompliance.lastAuditDate}</span></div>
              <div><span className="text-slate-500 block">Next Audit</span><span className="text-white font-bold text-sm">{selectedCompliance.nextAuditDate}</span></div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedCompliance(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
