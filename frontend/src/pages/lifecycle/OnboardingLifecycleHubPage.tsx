import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Filter, Download, Sparkles, CheckCircle2, XCircle, AlertTriangle,
  Eye, X, Play, Pause, RotateCcw, Zap, Activity, Globe, DollarSign, Users,
  Clock, TrendingUp, TrendingDown, BarChart3, FileText, Ban, Flag, RefreshCw,
  Layers, ArrowUpRight, ArrowDownRight, UserPlus, ClipboardCheck, BadgeCheck,
  Briefcase, GraduationCap, ShieldCheck, CalendarDays, Mail, Phone,
  MapPin, BookOpen, FolderOpen, PenTool, HeartPulse, Timer, PartyPopper,
  FileCheck, FileClock, UserCheck, UserX, Building2,
} from 'lucide-react';

/* ──────────────────────────── Types ──────────────────────────── */

type TabId = 'onboarding' | 'offboarding' | 'lifecycle' | 'analytics';
type SimSpeed = 1 | 2 | 4;
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
type EmployeeLifecycleStage = 'PRE_BOARDING' | 'ONBOARDING' | 'ACTIVE' | 'TRANSFER' | 'OFFBOARDING' | 'ALUMNI';

interface OnboardingTask {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  role: string;
  startDate: string;
  tasks: { name: string; status: TaskStatus; dueDate: string; assignee: string }[];
  progress: number;
  stage: EmployeeLifecycleStage;
  buddy: string;
  manager: string;
}

interface OffboardingRequest {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  role: string;
  lastDay: string;
  reason: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  exitInterview: boolean;
  assetsReturned: number;
  assetsTotal: number;
  knowledgeTransfer: number;
  clearance: { it: boolean; finance: boolean; hr: boolean; manager: boolean };
}

interface LifecycleEvent {
  id: string;
  employeeName: string;
  event: string;
  date: string;
  department: string;
  details: string;
}

/* ──────────────────────────── Mock Data ──────────────────────────── */

const INITIAL_ONBOARDING: OnboardingTask[] = [
  {
    id: 'ONB-001', employeeName: 'Aisha Patel', employeeId: 'EMP-5601', department: 'Engineering', role: 'Senior Frontend Engineer',
    startDate: '2026-08-25', buddy: 'Marcus Chen', manager: 'Sarah Kim',
    progress: 65, stage: 'ONBOARDING',
    tasks: [
      { name: 'Send welcome kit & laptop', status: 'COMPLETED', dueDate: '2026-08-22', assignee: 'IT Ops' },
      { name: 'Create accounts (Gmail, Slack, GitHub)', status: 'COMPLETED', dueDate: '2026-08-23', assignee: 'IT Ops' },
      { name: 'Complete I-9 & W-4 forms', status: 'IN_PROGRESS', dueDate: '2026-08-25', assignee: 'HR' },
      { name: 'Schedule 1:1 with manager', status: 'PENDING', dueDate: '2026-08-26', assignee: 'Manager' },
      { name: 'Security awareness training', status: 'PENDING', dueDate: '2026-08-28', assignee: 'Compliance' },
      { name: 'Team lunch introduction', status: 'PENDING', dueDate: '2026-08-29', assignee: 'Buddy' },
    ],
  },
  {
    id: 'ONB-002', employeeName: 'James Rivera', employeeId: 'EMP-5602', department: 'Sales', role: 'Enterprise Account Executive',
    startDate: '2026-08-20', buddy: 'Olivia Hartley', manager: 'David Okafor',
    progress: 90, stage: 'ONBOARDING',
    tasks: [
      { name: 'Send welcome kit & laptop', status: 'COMPLETED', dueDate: '2026-08-18', assignee: 'IT Ops' },
      { name: 'Create accounts', status: 'COMPLETED', dueDate: '2026-08-18', assignee: 'IT Ops' },
      { name: 'Complete I-9 & W-4', status: 'COMPLETED', dueDate: '2026-08-19', assignee: 'HR' },
      { name: 'Sales enablement bootcamp', status: 'IN_PROGRESS', dueDate: '2026-08-22', assignee: 'Sales Ops' },
      { name: 'CRM setup & territory assignment', status: 'PENDING', dueDate: '2026-08-23', assignee: 'Manager' },
    ],
  },
  {
    id: 'ONB-003', employeeName: 'Priya Sharma', employeeId: 'EMP-5603', department: 'Finance', role: 'Financial Analyst',
    startDate: '2026-09-01', buddy: 'Tom Bradley', manager: 'Raj Patel',
    progress: 20, stage: 'PRE_BOARDING',
    tasks: [
      { name: 'Background check verification', status: 'COMPLETED', dueDate: '2026-08-15', assignee: 'HR' },
      { name: 'Equipment procurement', status: 'IN_PROGRESS', dueDate: '2026-08-28', assignee: 'IT Ops' },
      { name: 'Offer letter acceptance', status: 'COMPLETED', dueDate: '2026-08-10', assignee: 'HR' },
      { name: 'Pre-boarding portal setup', status: 'PENDING', dueDate: '2026-08-30', assignee: 'HR' },
    ],
  },
  {
    id: 'ONB-004', employeeName: 'Wei Zhang', employeeId: 'EMP-5604', department: 'Product', role: 'Product Manager',
    startDate: '2026-08-18', buddy: 'Anika Patel', manager: 'Sarah Kim',
    progress: 100, stage: 'ACTIVE',
    tasks: [
      { name: 'Send welcome kit & laptop', status: 'COMPLETED', dueDate: '2026-08-16', assignee: 'IT Ops' },
      { name: 'Create accounts', status: 'COMPLETED', dueDate: '2026-08-16', assignee: 'IT Ops' },
      { name: 'Complete I-9 & W-4', status: 'COMPLETED', dueDate: '2026-08-17', assignee: 'HR' },
      { name: 'Product deep-dive sessions', status: 'COMPLETED', dueDate: '2026-08-20', assignee: 'Manager' },
      { name: '30-day check-in survey', status: 'COMPLETED', dueDate: '2026-09-17', assignee: 'HR' },
    ],
  },
];

const INITIAL_OFFBOARDING: OffboardingRequest[] = [
  {
    id: 'OFB-001', employeeName: 'Carlos Mendez', employeeId: 'EMP-3201', department: 'Operations', role: 'Warehouse Supervisor',
    lastDay: '2026-09-15', reason: 'Resigned — new opportunity', status: 'IN_PROGRESS',
    exitInterview: false, assetsReturned: 2, assetsTotal: 5, knowledgeTransfer: 40,
    clearance: { it: false, finance: true, hr: false, manager: false },
  },
  {
    id: 'OFB-002', employeeName: 'Elena Vasquez', employeeId: 'EMP-1567', department: 'Marketing', role: 'Content Strategist',
    lastDay: '2026-08-30', reason: 'Relocation — personal', status: 'IN_PROGRESS',
    exitInterview: true, assetsReturned: 3, assetsTotal: 4, knowledgeTransfer: 85,
    clearance: { it: true, finance: true, hr: true, manager: false },
  },
  {
    id: 'OFB-003', employeeName: 'Tomoko Sato', employeeId: 'EMP-4102', department: 'Engineering', role: 'QA Engineer',
    lastDay: '2026-08-15', reason: 'Layoff — restructuring', status: 'COMPLETED',
    exitInterview: true, assetsReturned: 4, assetsTotal: 4, knowledgeTransfer: 100,
    clearance: { it: true, finance: true, hr: true, manager: true },
  },
];

const INITIAL_EVENTS: LifecycleEvent[] = [
  { id: 'EVT-001', employeeName: 'Wei Zhang', event: 'Onboarding Completed', date: '2026-08-18', department: 'Product', details: 'All tasks completed, 30-day check-in scheduled' },
  { id: 'EVT-002', employeeName: 'Tomoko Sato', event: 'Offboarding Completed', date: '2026-08-15', department: 'Engineering', details: 'Full clearance, assets returned, exit interview conducted' },
  { id: 'EVT-003', employeeName: 'Alex Rivera', event: 'Internal Transfer', date: '2026-08-12', department: 'Sales → CS', details: 'Moved from Enterprise Sales to Customer Success' },
  { id: 'EVT-004', employeeName: 'Fatima Al-Hassan', event: 'Promotion', date: '2026-08-10', department: 'Engineering', details: 'Senior Engineer → Staff Engineer, new comp package' },
  { id: 'EVT-005', employeeName: 'Marcus Chen', event: 'Work Anniversary', date: '2026-08-08', department: 'Engineering', details: '3 years at PaySphere — recognition email sent' },
  { id: 'EVT-006', employeeName: 'Priya Sharma', event: 'Pre-boarding Started', date: '2026-08-05', department: 'Finance', details: 'Background check cleared, equipment ordered' },
];

/* ──────────────────────────── Helpers ──────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtUSD = (n: number) => `$${fmt(n)}`;
function taskStatusColor(s: TaskStatus) {
  switch (s) { case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; case 'OVERDUE': return 'bg-red-500/20 text-red-300 border-red-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function stageColor(s: EmployeeLifecycleStage) {
  switch (s) { case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'ONBOARDING': return 'bg-blue-500/20 text-blue-300 border-blue-500/30'; case 'PRE_BOARDING': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; case 'OFFBOARDING': case 'TRANSFER': return 'bg-orange-500/20 text-orange-300 border-orange-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function offboardStatusColor(s: string) {
  switch (s) { case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'; case 'IN_PROGRESS': return 'bg-amber-500/20 text-amber-300 border-amber-500/30'; default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30'; }
}
function toCsvOnb(rows: OnboardingTask[]) {
  const h = 'ID,Employee,Department,Role,StartDate,Progress,Stage,Buddy,Manager';
  const lines = rows.map(r => [r.id, r.employeeName, r.department, r.role, r.startDate, r.progress + '%', r.stage, r.buddy, r.manager].join(','));
  return [h, ...lines].join('\n');
}
function downloadCsv(csv: string, name: string) { const b = new Blob([csv], { type: 'text/csv' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = name; a.click(); URL.revokeObjectURL(u); }
function generateRandomOnb(): OnboardingTask {
  const names = ['Kai Nakamura', 'Sofia Rossi', 'Ahmed Hassan', 'Lily Chen', 'Ravi Patel', 'Emma Wilson'];
  const depts = ['Engineering', 'Sales', 'Marketing', 'Finance', 'Product', 'Operations'];
  const roles = ['Software Engineer', 'Account Executive', 'Marketing Manager', 'Financial Analyst', 'Product Manager', 'Ops Lead'];
  const stages: EmployeeLifecycleStage[] = ['PRE_BOARDING', 'ONBOARDING', 'ACTIVE'];
  const stage = stages[Math.floor(Math.random() * stages.length)];
  const p = stage === 'ACTIVE' ? 100 : stage === 'ONBOARDING' ? 30 + Math.floor(Math.random() * 50) : Math.floor(Math.random() * 25);
  const i = Math.floor(Math.random() * names.length);
  return {
    id: `ONB-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    employeeName: names[i], employeeId: `EMP-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    department: depts[i], role: roles[i], startDate: new Date(Date.now() + 86400000 * Math.floor(Math.random() * 14)).toISOString().slice(0, 10),
    buddy: 'Auto-assigned', manager: 'Auto-assigned', progress: p, stage,
    tasks: [
      { name: 'Send welcome kit', status: Math.random() > 0.5 ? 'COMPLETED' : 'PENDING', dueDate: '2026-08-25', assignee: 'IT Ops' },
      { name: 'Create accounts', status: Math.random() > 0.5 ? 'COMPLETED' : 'PENDING', dueDate: '2026-08-26', assignee: 'IT Ops' },
      { name: 'Complete paperwork', status: 'PENDING', dueDate: '2026-08-27', assignee: 'HR' },
    ],
  };
}

interface Toast { id: number; message: string; type: 'success' | 'error' | 'warning' | 'info'; }
let toastSeq = 0;

/* ──────────────────────────── Main Component ──────────────────────────── */

export default function OnboardingLifecycleHubPage() {
  const [onboarding, setOnboarding] = useState<OnboardingTask[]>(INITIAL_ONBOARDING);
  const [offboarding, setOffboarding] = useState<OffboardingRequest[]>(INITIAL_OFFBOARDING);
  const [events] = useState<LifecycleEvent[]>(INITIAL_EVENTS);
  const [activeTab, setActiveTab] = useState<TabId>('onboarding');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selectedOnb, setSelectedOnb] = useState<OnboardingTask | null>(null);
  const [selectedOffb, setSelectedOffb] = useState<OffboardingRequest | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<LifecycleEvent | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [simRunning, setSimRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(1);
  const [simTick, setSimTick] = useState(0);
  const [simHires, setSimHires] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++toastSeq;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const dismissToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const simulationTick = useCallback(() => {
    const onb = generateRandomOnb();
    setOnboarding(prev => [onb, ...prev].slice(0, 30));
    setSimTick(prev => prev + 1);
    setSimHires(prev => prev + 1);
    addToast(`🎉 NEW HIRE: ${onb.employeeName} — ${onb.role} (${onb.department})`, 'success');
  }, [addToast]);

  useEffect(() => {
    if (simRunning) {
      const ms = simSpeed === 1 ? 2000 : simSpeed === 2 ? 1000 : 500;
      intervalRef.current = setInterval(simulationTick, ms);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [simRunning, simSpeed, simulationTick]);

  const toggleSim = () => setSimRunning(prev => !prev);
  const resetSim = () => { setSimRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); setSimTick(0); setSimHires(0); setOnboarding(INITIAL_ONBOARDING); addToast('🔄 Simulation reset', 'info'); };

  const handleExport = () => { downloadCsv(toCsvOnb(filteredOnb), `onboarding-report-${new Date().toISOString().slice(0, 10)}.csv`); addToast(`📥 Exported ${filteredOnb.length} onboarding records`, 'success'); };

  const filteredOnb = onboarding.filter(o => {
    const mS = searchQuery === '' || o.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || o.department.toLowerCase().includes(searchQuery.toLowerCase());
    const mSt = stageFilter === 'ALL' || o.stage === stageFilter;
    return mS && mSt;
  });

  const totalTasks = onboarding.reduce((s, o) => s + o.tasks.length, 0);
  const completedTasks = onboarding.reduce((s, o) => s + o.tasks.filter(t => t.status === 'COMPLETED').length, 0);
  const activeOffboarding = offboarding.filter(o => o.status !== 'COMPLETED').length;

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'onboarding', label: 'Onboarding', icon: <UserPlus className="w-4 h-4" /> },
    { id: 'offboarding', label: 'Offboarding', icon: <UserX className="w-4 h-4" /> },
    { id: 'lifecycle', label: 'Lifecycle Events', icon: <Activity className="w-4 h-4" /> },
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
      <header className="max-w-7xl mx-auto mb-8 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-indigo-500/20 text-indigo-300 text-xs px-3 py-1 rounded-full font-semibold border border-indigo-500/30 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" /> PaySphere Lifecycle Command
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" /> I-9 & E-Verify Integrated
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Employee Onboarding & Lifecycle Hub
            </h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
              End-to-end employee lifecycle orchestration — pre-boarding workflows, onboarding task management, offboarding clearance tracking, and organizational analytics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 border border-indigo-400/20 text-sm">
              <Download className="w-4 h-4" /> Export Report
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Active Onboarding</span><UserPlus className="w-4 h-4 text-indigo-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{onboarding.filter(o => o.stage === 'ONBOARDING' || o.stage === 'PRE_BOARDING').length}</div>
            <div className="text-indigo-400 text-xs mt-2 font-medium"><TrendingUp className="w-3.5 h-3.5 inline" /> {onboarding.filter(o => o.stage === 'PRE_BOARDING').length} pre-boarding</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Task Completion</span><ClipboardCheck className="w-4 h-4 text-emerald-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{completedTasks}<span className="text-lg text-slate-500">/{totalTasks}</span></div>
            <div className="text-emerald-400 text-xs mt-2 font-medium">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% overall progress</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Offboarding Active</span><UserX className="w-4 h-4 text-amber-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{activeOffboarding}</div>
            <div className="text-amber-400 text-xs mt-2 font-medium">{offboarding.filter(o => o.status === 'COMPLETED').length} completed this month</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2"><span>Lifecycle Events</span><Activity className="w-4 h-4 text-violet-400" /></div>
            <div className="text-3xl font-black text-white font-mono">{events.length}</div>
            <div className="text-violet-400 text-xs mt-2 font-medium">Transfers, promotions, anniversaries</div>
          </div>
        </div>

        {/* Simulation */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full font-semibold border border-purple-500/30 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Live Onboarding Simulator</span>
              <span className="text-slate-500 text-xs">Tick: {simTick} | New Hires: {simHires}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleSim} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition border ${simRunning ? 'bg-amber-600/20 text-amber-300 border-amber-500/30' : 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30'}`}>
                {simRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}{simRunning ? 'Pause' : 'Start'}
              </button>
              <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {([1, 2, 4] as SimSpeed[]).map(s => (<button key={s} onClick={() => setSimSpeed(s)} className={`px-3 py-2 text-xs font-bold transition ${simSpeed === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>{s}x</button>))}
              </div>
              <button onClick={resetSim} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"><RotateCcw className="w-4 h-4" /> Reset</button>
            </div>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-none px-4 py-2.5 rounded-xl font-medium text-sm transition flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Search employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition" />
            </div>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className="bg-slate-900/90 border border-slate-800 rounded-xl text-slate-300 text-sm px-3 py-2.5 focus:outline-none">
              <option value="ALL">All Stages</option>
              <option value="PRE_BOARDING">Pre-boarding</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="ACTIVE">Active</option>
              <option value="OFFBOARDING">Offboarding</option>
            </select>
          </div>
        </div>

        {/* ═══════ TAB: Onboarding ═══════ */}
        {activeTab === 'onboarding' && (
          <div className="space-y-4">
            {filteredOnb.map(o => (
              <div key={o.id} onClick={() => setSelectedOnb(o)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{o.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${stageColor(o.stage)}`}>{o.stage.replace(/_/g, ' ')}</span>
                    </div>
                    <h3 className="text-white font-bold text-base">{o.employeeName} <span className="text-slate-400 font-normal text-sm">({o.employeeId})</span></h3>
                    <p className="text-xs text-slate-500 mt-1">{o.role} · {o.department} · Start: {o.startDate}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Buddy: {o.buddy} · Manager: {o.manager}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32">
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1"><span>Progress</span><span className="font-bold text-white">{o.progress}%</span></div>
                      <div className="w-full bg-slate-800 rounded-full h-2"><div className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${o.progress}%` }} /></div>
                    </div>
                    <div className="text-xs text-slate-500">{o.tasks.filter(t => t.status === 'COMPLETED').length}/{o.tasks.length} tasks</div>
                    <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Offboarding ═══════ */}
        {activeTab === 'offboarding' && (
          <div className="space-y-4">
            {offboarding.map(o => (
              <div key={o.id} onClick={() => setSelectedOffb(o)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-slate-500">{o.id}</span>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${offboardStatusColor(o.status)}`}>{o.status}</span>
                    </div>
                    <h3 className="text-white font-bold text-base">{o.employeeName} <span className="text-slate-400 font-normal text-sm">({o.employeeId})</span></h3>
                    <p className="text-xs text-slate-500 mt-1">{o.role} · {o.department} · Last Day: {o.lastDay}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Reason: {o.reason}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center"><div className="text-slate-500 mb-1">Assets</div><div className={`font-bold ${o.assetsReturned === o.assetsTotal ? 'text-emerald-400' : 'text-amber-400'}`}>{o.assetsReturned}/{o.assetsTotal}</div></div>
                    <div className="text-center"><div className="text-slate-500 mb-1">Knowledge</div><div className={`font-bold ${o.knowledgeTransfer >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{o.knowledgeTransfer}%</div></div>
                    <div className="text-center"><div className="text-slate-500 mb-1">Exit Interview</div><div className={`font-bold ${o.exitInterview ? 'text-emerald-400' : 'text-red-400'}`}>{o.exitInterview ? 'Done' : 'Pending'}</div></div>
                    <Eye className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Lifecycle Events ═══════ */}
        {activeTab === 'lifecycle' && (
          <div className="space-y-3">
            {events.map(e => (
              <div key={e.id} onClick={() => setSelectedEvent(e)} className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition cursor-pointer group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-slate-500">{e.id}</span>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">{e.event}</span>
                    </div>
                    <div className="text-sm text-white font-semibold">{e.employeeName} <span className="text-slate-400 font-normal">· {e.department}</span></div>
                    <div className="text-xs text-slate-500 mt-1">{e.details}</div>
                  </div>
                  <div className="text-xs text-slate-500">{e.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══════ TAB: Analytics ═══════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-400" /> Onboarding by Department</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['Engineering', 'Sales', 'Marketing', 'Finance', 'Product', 'Operations'].map(d => {
                  const count = onboarding.filter(o => o.department === d).length;
                  return (<div key={d} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center">
                    <div className="text-xs text-slate-500 mb-1">{d}</div>
                    <div className="text-3xl font-black text-white">{count}</div>
                  </div>);
                })}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><Timer className="w-5 h-5 text-amber-400" /> Lifecycle Stage Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(['PRE_BOARDING', 'ONBOARDING', 'ACTIVE', 'TRANSFER', 'OFFBOARDING'] as EmployeeLifecycleStage[]).map(s => {
                  const count = onboarding.filter(o => o.stage === s).length;
                  return (<div key={s} className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${stageColor(s)}`}>{s.replace(/_/g, ' ')}</span>
                    <div className="text-3xl font-black text-white mt-3">{count}</div>
                  </div>);
                })}
              </div>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Offboarding Clearance Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {offboarding.map(o => (
                  <div key={o.id} className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                    <div className="text-sm text-white font-bold mb-2">{o.employeeName}</div>
                    <div className="space-y-1 text-xs">
                      {Object.entries(o.clearance).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-slate-500 capitalize">{k}</span>
                          {v ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════ MODAL: Onboarding Detail ═══════════════ */}
      {selectedOnb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedOnb(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOnb(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1"><span className="text-xs font-mono text-slate-500">{selectedOnb.id}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${stageColor(selectedOnb.stage)}`}>{selectedOnb.stage.replace(/_/g, ' ')}</span></div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedOnb.employeeName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedOnb.role} · {selectedOnb.department} · Start: {selectedOnb.startDate}</p>
            <div className="w-full bg-slate-800 rounded-full h-3 mb-4"><div className="h-3 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${selectedOnb.progress}%` }} /></div>
            <div className="space-y-2 mb-6">
              {selectedOnb.tasks.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  {t.status === 'COMPLETED' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" /> : t.status === 'IN_PROGRESS' ? <Clock className="w-4 h-4 text-blue-400 flex-none" /> : <CircleDot className="w-4 h-4 text-slate-500 flex-none" />}
                  <div className="flex-1"><div className="text-sm text-white">{t.name}</div><div className="text-xs text-slate-500">Due: {t.dueDate} · {t.assignee}</div></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${taskStatusColor(t.status)}`}>{t.status.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-xs font-mono">
              <div><span className="text-slate-500 block">Buddy</span><span className="text-white font-bold text-sm">{selectedOnb.buddy}</span></div>
              <div><span className="text-slate-500 block">Manager</span><span className="text-white font-bold text-sm">{selectedOnb.manager}</span></div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedOnb(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Offboarding Detail ═══════════════ */}
      {selectedOffb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedOffb(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedOffb(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1"><span className="text-xs font-mono text-slate-500">{selectedOffb.id}</span><span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${offboardStatusColor(selectedOffb.status)}`}>{selectedOffb.status}</span></div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedOffb.employeeName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedOffb.role} · {selectedOffb.department} · Last Day: {selectedOffb.lastDay} · Reason: {selectedOffb.reason}</p>
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-4 text-xs font-mono">
              <div><span className="text-slate-500 block">Assets Returned</span><span className={`font-bold text-sm ${selectedOffb.assetsReturned === selectedOffb.assetsTotal ? 'text-emerald-400' : 'text-amber-400'}`}>{selectedOffb.assetsReturned}/{selectedOffb.assetsTotal}</span></div>
              <div><span className="text-slate-500 block">Knowledge Transfer</span><span className={`font-bold text-sm ${selectedOffb.knowledgeTransfer >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{selectedOffb.knowledgeTransfer}%</span></div>
              <div><span className="text-slate-500 block">Exit Interview</span><span className={`font-bold text-sm ${selectedOffb.exitInterview ? 'text-emerald-400' : 'text-red-400'}`}>{selectedOffb.exitInterview ? 'Completed' : 'Pending'}</span></div>
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
              <div className="text-xs text-slate-500 mb-2 font-semibold uppercase">Clearance Status</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(selectedOffb.clearance).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 capitalize">{k} Department</span>
                    {v ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Cleared</span> : <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Pending</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end"><button onClick={() => setSelectedOffb(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      {/* ═══════════════ MODAL: Event Detail ═══════════════ */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedEvent(null)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-1"><span className="text-xs font-mono text-slate-500">{selectedEvent.id}</span><span className="text-xs bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-semibold">{selectedEvent.event}</span></div>
            <h2 className="text-xl font-bold text-white mb-1">{selectedEvent.employeeName}</h2>
            <p className="text-xs text-slate-500 mb-4">{selectedEvent.department} · {selectedEvent.date}</p>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6 text-sm text-slate-300">{selectedEvent.details}</div>
            <div className="flex justify-end"><button onClick={() => setSelectedEvent(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs transition">Close</button></div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  );
}
