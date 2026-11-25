import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Globe,
  Headphones,
  LogIn,
  MapPin,
  Megaphone,
  Menu,
  Moon,
  Newspaper,
  Plus,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sun,
  TrendingUp,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { useCampaign } from '../context/CampaignContext';
import { QuickCommandModal } from './QuickCommandModal';
import { VoterSentimentSidebar } from './VoterSentimentSidebar';
import { CampaignLoader } from './CampaignLoader';
import type { NavModuleId, RoleName } from '../types/campaign';

interface NavItem {
  id: NavModuleId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'situation-room', label: 'Executive Situation Room', shortLabel: 'Situation Room', icon: Radio, group: 'Command' },
  { id: 'katsina-simulator', label: 'Katsina INEC & Simulator', shortLabel: 'Katsina Simulator', icon: TrendingUp, group: 'Command' },
  { id: 'voter-sentiment', label: 'Voter Sentiment Hub', shortLabel: 'Voter Sentiment', icon: Activity, group: 'Command' },
  { id: 'campaign-overview', label: 'Campaign Overview', shortLabel: 'Campaign Overview', icon: Compass, group: 'Command' },
  { id: 'geographic-ops', label: 'Geographic Operations', shortLabel: 'Geographic Ops', icon: Globe, group: 'Geography & Field' },
  { id: 'field-ops', label: 'Field Operations', shortLabel: 'Field Operations', icon: Smartphone, group: 'Geography & Field' },
  { id: 'agents-volunteers', label: 'Agent & Volunteer Mgmt', shortLabel: 'Agents & Staff', icon: Users, group: 'Geography & Field' },
  { id: 'call-center', label: 'Call Center', shortLabel: 'Call Center', icon: Headphones, group: 'Response' },
  { id: 'incidents', label: 'Incident Management', shortLabel: 'Incidents', icon: AlertTriangle, group: 'Response' },
  { id: 'events', label: 'Campaign Events', shortLabel: 'Campaign Events', icon: Calendar, group: 'Operations' },
  { id: 'logistics', label: 'Logistics & Transport', shortLabel: 'Logistics', icon: Truck, group: 'Operations' },
  { id: 'organization', label: 'Campaign Organization', shortLabel: 'Organization', icon: Building2, group: 'Operations' },
  { id: 'polling-coverage', label: 'Polling Unit Coverage', shortLabel: 'Polling Units', icon: MapPin, group: 'Election Ops' },
  { id: 'election-day', label: 'Election-Day Operations', shortLabel: 'Election Day', icon: Activity, group: 'Election Ops' },
  { id: 'reports-analytics', label: 'Reports & Analytics', shortLabel: 'Reports', icon: BarChart3, group: 'Intelligence' },
  { id: 'communications', label: 'Communications', shortLabel: 'Communications', icon: Megaphone, group: 'Intelligence' },
  { id: 'media-monitoring', label: 'Media Monitoring', shortLabel: 'Media Monitor', icon: Newspaper, group: 'Intelligence' },
  { id: 'documents', label: 'Campaign Documents', shortLabel: 'Documents', icon: FileText, group: 'Governance' },
  { id: 'tasks', label: 'Tasks & Workflow', shortLabel: 'Tasks', icon: CheckSquare, group: 'Governance' },
  { id: 'security-audit', label: 'Security & Audit', shortLabel: 'Security & Audit', icon: ShieldCheck, group: 'Governance' },
  { id: 'settings-admin', label: 'Admin · States, Wards & Settings', shortLabel: 'Admin & Wards', icon: Settings, group: 'Governance' },
];

const DEMO_ROLE_PRESETS: Array<{ label: string; role: RoleName; stateCode: string | null; lga: string | null }> = [
  { label: 'Super Admin (National)', role: 'Platform Super Administrator', stateCode: null, lga: null },
  { label: 'Situation Room Director', role: 'Situation Room Director', stateCode: null, lga: null },
  { label: 'State Coordinator (Katsina)', role: 'State Coordinator', stateCode: 'KT', lga: null },
  { label: 'LGA Coordinator (Daura)', role: 'LGA Coordinator', stateCode: 'KT', lga: 'Daura' },
  { label: 'Call Center Operator', role: 'Call Center Operator', stateCode: null, lga: null },
  { label: 'Polling Unit Agent', role: 'Polling Unit Agent', stateCode: 'KT', lga: 'Kankara' },
  { label: 'Auditor (Read-Only)', role: 'Auditor', stateCode: null, lga: null },
];

interface LayoutProps {
  children: React.ReactNode;
  onReturnHome: () => void;
  initialSentimentOpen?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onReturnHome,
  initialSentimentOpen = false,
}) => {
  const {
    activeModule,
    setActiveModule,
    branding,
    darkMode,
    toggleDarkMode,
    fullscreenSituationRoom,
    setCommandSearchOpen,
    currentUser,
    firebaseSyncActive,
    signInWithGoogle,
    switchDemoRole,
    hasDemoData,
    setSetupWizardOpen,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    offlineQueue,
  } = useCampaign();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [sentimentOpen, setSentimentOpen] = useState<boolean>(
    () => initialSentimentOpen || (typeof window !== 'undefined' && window.innerWidth >= 1280)
  );
  const [sentimentScore, setSentimentScore] = useState<number>(73);
  const [demoNoticeDismissed, setDemoNoticeDismissed] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [moduleTransitioning, setModuleTransitioning] = useState(false);
  const prevModuleRef = useRef<NavModuleId>(activeModule);

  useEffect(() => {
    if (prevModuleRef.current !== activeModule) {
      prevModuleRef.current = activeModule;
      setModuleTransitioning(true);
      const timer = window.setTimeout(() => setModuleTransitioning(false), 450);
      return () => window.clearTimeout(timer);
    }
  }, [activeModule]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const activeNav = NAV_ITEMS.find((n) => n.id === activeModule) ?? NAV_ITEMS[0];

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
      setProfileOpen(false);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in cancelled or blocked.');
    }
  };

  if (fullscreenSituationRoom && activeModule === 'situation-room') {
    return <div className="min-h-screen bg-[#070B14] text-slate-100">{children}</div>;
  }

  const groups = Array.from(new Set(NAV_ITEMS.map((i) => i.group)));
  const logoUrl =
    branding.partyLogoDataUrl ||
    branding.campaignLogoDataUrl ||
    '/src/assets/images/pdp_umbrella_emblem_1795647900978.jpg';

  const renderSidebarNav = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#0A0F1A] text-slate-200 border-r border-slate-800/90">
      {/* Brand Lockup with PDP Crest */}
      <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-slate-800/90 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={logoUrl}
            alt="PDP Umbrella Emblem"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-700 bg-white"
          />
          {(!sidebarCollapsed || isMobile) && (
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight font-display">
                {branding.candidateName}
              </div>
              <div className="text-[11px] text-emerald-400/90 truncate leading-tight mt-0.5">
                PDP Command Center
              </div>
            </div>
          )}
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation drawer"
            className="p-1.5 text-slate-400 hover:text-white rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSidebarCollapsed((c) => !c)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-md transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Return to Campaign Landing Page & Sidebar Quick-Filter */}
      <div className="px-2.5 pt-3 pb-1.5 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => {
            onReturnHome();
            if (isMobile) setMobileMenuOpen(false);
          }}
          title={sidebarCollapsed && !isMobile ? 'Campaign Landing Page' : undefined}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 min-h-[38px] rounded-lg text-xs font-medium text-slate-300 bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:text-white transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          {(!sidebarCollapsed || isMobile) && <span className="truncate">Campaign Home</span>}
        </button>

        {/* Direct Sidebar Launcher for Live Voter Sentiment Pulse */}
        <button
          type="button"
          onClick={() => {
            setSentimentOpen((o) => !o);
            if (isMobile) setMobileMenuOpen(false);
          }}
          data-testid={isMobile ? 'mobile-sidebar-voter-sentiment-btn' : 'sidebar-voter-sentiment-btn'}
          title={sidebarCollapsed && !isMobile ? `Voter Sentiment Pulse (${sentimentScore}/100)` : undefined}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
            sentimentOpen
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-600/80'
              : 'bg-slate-900/70 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/60 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <Activity className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span className="truncate">Voter Sentiment</span>}
          </span>
          {(!sidebarCollapsed || isMobile) && (
            <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {sentimentScore}
            </span>
          )}
        </button>

        {/* Direct Sidebar Launcher for Admin States, LGAs & Katsina 361 Wards Tab */}
        <button
          type="button"
          onClick={() => {
            setActiveModule('settings-admin');
            if (isMobile) setMobileMenuOpen(false);
          }}
          data-testid={isMobile ? 'mobile-sidebar-admin-wards-btn' : 'sidebar-admin-wards-btn'}
          title={sidebarCollapsed && !isMobile ? 'Admin: States, LGAs & Katsina Wards (361)' : undefined}
          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 min-h-[38px] rounded-lg text-xs font-semibold border transition-colors whitespace-nowrap ${
            activeModule === 'settings-admin'
              ? 'bg-[#0D5C38] text-white border-emerald-500/80 shadow-xs'
              : 'bg-slate-900/70 text-slate-200 border-slate-700/80 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span className="truncate">Admin: States & Wards</span>}
          </span>
          {(!sidebarCollapsed || isMobile) && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 shrink-0">
              34 KT
            </span>
          )}
        </button>

        {(!sidebarCollapsed || isMobile) && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={sidebarFilter}
              onChange={(e) => setSidebarFilter(e.target.value)}
              placeholder="Find module..."
              aria-label="Filter dashboard modules"
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-900/80 border border-slate-800 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-600/80"
            />
            {sidebarFilter && (
              <button
                type="button"
                onClick={() => setSidebarFilter('')}
                aria-label="Clear module filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-2.5 px-2.5 space-y-4" aria-label="Campaign Modules">
        {groups.map((group) => {
          const q = sidebarFilter.trim().toLowerCase();
          const groupItems = NAV_ITEMS.filter(
            (item) =>
              item.group === group &&
              (!q || item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q))
          );
          if (groupItems.length === 0) return null;

          return (
            <div key={group}>
              {(!sidebarCollapsed || isMobile) && (
                <div className="px-2.5 pb-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                  {group}
                </div>
              )}
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveModule(item.id);
                        if (isMobile) setMobileMenuOpen(false);
                      }}
                      title={sidebarCollapsed && !isMobile ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-emerald-950/90 text-white border border-emerald-700/80 shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-emerald-400' : ''}`} />
                      {(!sidebarCollapsed || isMobile) && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom Sync Summary */}
      {(!sidebarCollapsed || isMobile) && (
        <div className="p-3.5 border-t border-slate-800/90 text-[11px] text-slate-400 space-y-1.5 bg-[#080C15]">
          <div className="flex items-center justify-between">
            <span>Workspace Sync</span>
            <span className={firebaseSyncActive ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-medium'}>
              {firebaseSyncActive ? 'Cloud Live' : 'Demo Workspace'}
            </span>
          </div>
          {offlineQueue.length > 0 && (
            <div className="flex items-center justify-between text-amber-400">
              <span>Offline Queue</span>
              <span className="font-mono tabular-nums">{offlineQueue.length} pending</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F9FA] dark:bg-[#070B14] text-slate-900 dark:text-slate-100 overflow-x-clip">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 sticky top-0 h-screen transition-[width] duration-150 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {renderSidebarNav(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="w-72 max-w-[85vw] h-full">{renderSidebarNav(true)}</div>
          <button
            type="button"
            aria-label="Dismiss mobile menu"
            className="flex-1 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Refined Mobile-First Top Bar (h-14 mobile / h-16 desktop) */}
        <header className="sticky top-0 z-40 h-14 sm:h-16 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Mobile toggle + Contextual Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 -ml-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-md shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs min-w-0 flex-1">
              <span
                className={`${sentimentOpen ? 'hidden 2xl:inline' : 'hidden sm:inline'} text-slate-500 dark:text-slate-400 whitespace-nowrap`}
              >
                {activeNav.group}
              </span>
              <span
                className={`${sentimentOpen ? 'hidden 2xl:inline' : 'hidden sm:inline'} text-slate-300 dark:text-slate-700`}
                aria-hidden="true"
              >
                /
              </span>
              <h1 className="text-sm font-bold text-slate-950 dark:text-white truncate font-display">
                <span className="sm:hidden">{activeNav.shortLabel}</span>
                <span className="hidden sm:inline">{activeNav.label}</span>
              </h1>
            </div>
          </div>

          {/* Right: Quick Action + Command Search + Theme + Notifications + Role Menu (NO LOGOUT BUTTON) */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setQuickModalOpen(true)}
              data-testid="header-quick-action-btn"
              aria-label="Quick Action"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 min-h-[36px] text-xs font-semibold text-white bg-[#0D5C38] hover:bg-[#09452A] rounded-lg transition-colors whitespace-nowrap shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Quick Action</span>
            </button>

            {/* Voter Sentiment toggle on tablet/desktop (mobile has dedicated thumb-zone Sentiment tab + drawer button) */}
            <button
              type="button"
              onClick={() => setSentimentOpen((o) => !o)}
              data-testid="toggle-voter-sentiment-btn"
              aria-expanded={sentimentOpen}
              aria-label={sentimentOpen ? 'Close Voter Sentiment sidebar' : 'Open Voter Sentiment sidebar'}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                sentimentOpen
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700'
                  : 'text-emerald-900 dark:text-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300/90 dark:border-emerald-800 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <Activity className="w-3.5 h-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <span>Voter Sentiment</span>
              <span className="font-mono tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded bg-emerald-600/15 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                {sentimentScore}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setCommandSearchOpen(true)}
              aria-label="Open global command search"
              className="inline-flex items-center gap-2 px-2 sm:px-3 py-2 min-h-[36px] text-xs text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              <Search className="w-3.5 h-3.5" />
              <span className={sentimentOpen ? 'hidden 2xl:inline' : 'hidden md:inline'}>
                Search states, LGAs...
              </span>
              <span className="hidden sm:inline font-mono text-[10px] text-slate-400">Ctrl K</span>
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to light command theme' : 'Switch to dark situation room theme'}
              className="hidden sm:inline-flex items-center justify-center p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label={`Open notifications (${unreadCount} unread)`}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 text-[9px] font-mono font-bold bg-red-600 text-white rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setNotifOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">
                        Operational Alerts ({unreadCount} unread)
                      </span>
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            markNotificationRead(n.id);
                            setActiveModule(n.module);
                            setNotifOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                            !n.read ? 'bg-slate-50/70 dark:bg-slate-900/50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">{n.title}</span>
                            <span
                              className={`text-[10px] font-mono uppercase shrink-0 ${
                                n.severity === 'critical'
                                  ? 'text-red-700 dark:text-red-400'
                                  : n.severity === 'high'
                                    ? 'text-amber-700 dark:text-amber-400'
                                    : 'text-slate-500'
                              }`}
                            >
                              {n.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Operator Role & Workspace Profile Menu (Strictly NO Logout Button) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                aria-label="Open operator account and role menu"
                className="flex items-center gap-2 p-1.5 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-colors whitespace-nowrap"
              >
                <span
                  className="w-6 h-6 rounded-md text-white text-[11px] font-bold flex items-center justify-center shrink-0"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  {currentUser.displayName.slice(0, 2).toUpperCase()}
                </span>
                <span
                  className={`${sentimentOpen ? 'hidden 2xl:inline' : 'hidden md:inline'} font-medium text-slate-800 dark:text-slate-200 max-w-[150px] truncate`}
                >
                  {currentUser.role}
                </span>
              </button>

              {profileOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close profile menu"
                    onClick={() => setProfileOpen(false)}
                    className="fixed inset-0 z-30 cursor-default"
                  />
                  <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-auto sm:mt-2 w-[calc(100vw-1.5rem)] max-w-xs sm:w-80 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 p-4 space-y-3">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {currentUser.displayName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                        Role: <span className="font-semibold">{currentUser.role}</span>
                        {currentUser.assignedStateCode && ` · Scope: ${currentUser.assignedStateCode}`}
                        {currentUser.assignedLga && ` / ${currentUser.assignedLga}`}
                      </div>
                    </div>

                    {/* Mobile Theme Switcher inside Profile Menu */}
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className="sm:hidden w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      <span>Display Theme</span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                        {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        {darkMode ? 'Light Mode' : 'Dark Mode'}
                      </span>
                    </button>

                    {!currentUser.isAuthenticated ? (
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white rounded-lg hover:opacity-92 transition-opacity"
                          style={{ backgroundColor: branding.primaryColor }}
                        >
                          <LogIn className="w-3.5 h-3.5" /> Sign in with Google (Live Sync)
                        </button>
                        {authError && <p className="text-[11px] text-red-600">{authError}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Verified Cloud Sync Active</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                        Operational Role Perspective
                      </div>
                      <div className="space-y-1 max-h-44 overflow-y-auto">
                        {DEMO_ROLE_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => {
                              switchDemoRole(preset.role, preset.stateCode, preset.lga);
                              setProfileOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              currentUser.role === preset.role &&
                              currentUser.assignedStateCode === preset.stateCode
                                ? 'bg-slate-900 text-white dark:bg-slate-700'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Quiet, Dismissible Operational Notice Strip */}
        {((hasDemoData && !demoNoticeDismissed) || branding.electionDayMode) && (
          <div className="no-print px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-[#0D1425] flex items-center justify-between gap-2 text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 min-w-0 truncate">
              {branding.electionDayMode && (
                <span className="font-semibold text-red-700 dark:text-red-400 shrink-0">
                  Election-Day Mode
                </span>
              )}
              {branding.electionDayMode && hasDemoData && !demoNoticeDismissed && (
                <span aria-hidden="true">·</span>
              )}
              {hasDemoData && !demoNoticeDismissed && (
                <span className="truncate">
                  <strong className="text-slate-800 dark:text-slate-100">Demo Data</strong>
                  <span className="hidden sm:inline">: Sample records active for evaluation.</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSetupWizardOpen(true)}
                className="font-semibold text-emerald-800 dark:text-emerald-400 hover:underline whitespace-nowrap"
              >
                <span className="sm:hidden">Setup</span>
                <span className="hidden sm:inline">Setup Wizard</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('settings-admin')}
                className="font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
              >
                <span className="sm:hidden">Manage</span>
                <span className="hidden sm:inline">Manage Data</span>
              </button>
              {!branding.electionDayMode && (
                <button
                  type="button"
                  onClick={() => setDemoNoticeDismissed(true)}
                  aria-label="Dismiss demo notice"
                  className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Workspace Viewport */}
        <main className="relative flex-1 p-3.5 sm:p-5 lg:p-8 pb-24 lg:pb-8 max-w-[1560px] w-full mx-auto min-w-0">
          <CampaignLoader
            visible={moduleTransitioning}
            variant="overlay"
            statusText={`Loading ${activeNav.label}...`}
            portraitUrl={branding.portraitDataUrl}
            crestUrl={branding.partyLogoDataUrl}
          />
          {children}
        </main>

        {/* Mobile-First Thumb-Zone 5-Tab Quick Navigation Bar (56px + safe-area, lg:hidden) */}
        <nav
          aria-label="Mobile Quick Navigation"
          data-testid="mobile-bottom-nav"
          className="no-print fixed bottom-0 inset-x-0 z-40 lg:hidden min-h-[56px] pb-safe bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 grid grid-cols-5"
        >
          {(
            [
              { id: 'situation-room' as NavModuleId, label: 'Command', icon: Radio },
              { id: 'katsina-simulator' as NavModuleId, label: 'Simulator', icon: TrendingUp },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModule(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[10px] font-semibold transition-colors ${
                  isActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSentimentOpen((o) => !o)}
            data-testid="mobile-nav-sentiment-btn"
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[10px] font-semibold transition-colors ${
              sentimentOpen || activeModule === 'voter-sentiment'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Sentiment</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModule('settings-admin')}
            data-testid="mobile-nav-wards-btn"
            className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[10px] font-semibold transition-colors ${
              activeModule === 'settings-admin'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Wards</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-h-[44px] text-[10px] font-semibold text-slate-500 dark:text-slate-400"
          >
            <Menu className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </nav>

        <QuickCommandModal
          open={quickModalOpen}
          initialTab="incident"
          onClose={() => setQuickModalOpen(false)}
        />
      </div>

      {/* Real-Time Voter Sentiment Sidebar (Desktop Docked + Mobile Slide-Over) */}
      <VoterSentimentSidebar
        open={sentimentOpen}
        onClose={() => setSentimentOpen(false)}
        onPulseScoreChange={setSentimentScore}
      />
    </div>
  );
};
