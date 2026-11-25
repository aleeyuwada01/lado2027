import React, { useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CampaignProvider, useCampaign } from './context/CampaignContext';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { CommandSearchModal } from './components/CommandSearchModal';
import { SetupWizardModal } from './components/SetupWizardModal';
import { CampaignLoader } from './components/CampaignLoader';
import type { NavModuleId } from './types/campaign';

const VALID_MODULE_IDS = new Set<NavModuleId>([
  'situation-room',
  'katsina-simulator',
  'voter-sentiment',
  'campaign-overview',
  'geographic-ops',
  'field-ops',
  'agents-volunteers',
  'call-center',
  'incidents',
  'events',
  'logistics',
  'organization',
  'polling-coverage',
  'election-day',
  'reports-analytics',
  'communications',
  'media-monitoring',
  'documents',
  'tasks',
  'security-audit',
  'settings-admin',
]);

function resolveRouteFromLocation(): {
  showLanding: boolean;
  initialModule: NavModuleId;
  openSentiment: boolean;
} {
  if (typeof window === 'undefined') {
    return { showLanding: true, initialModule: 'situation-room', openSentiment: false };
  }

  const params = new URLSearchParams(window.location.search);
  const pathSegment = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  const queryModule = params.get('module')?.toLowerCase() ?? '';
  const openSentiment = params.get('sentiment') === '1';

  if (VALID_MODULE_IDS.has(pathSegment as NavModuleId)) {
    return {
      showLanding: false,
      initialModule: pathSegment as NavModuleId,
      openSentiment,
    };
  }

  if (VALID_MODULE_IDS.has(queryModule as NavModuleId)) {
    return {
      showLanding: false,
      initialModule: queryModule as NavModuleId,
      openSentiment,
    };
  }

  if (params.get('autostart') === '1') {
    return { showLanding: false, initialModule: 'situation-room', openSentiment };
  }

  return { showLanding: true, initialModule: 'situation-room', openSentiment };
}

import { SituationRoomView } from './modules/SituationRoomView';
import { KatsinaSimulatorView } from './modules/KatsinaSimulatorView';
import { VoterSentimentView } from './modules/VoterSentimentView';
import { CampaignOverviewView } from './modules/CampaignOverviewView';
import { GeographicOpsView } from './modules/GeographicOpsView';
import { FieldOpsView } from './modules/FieldOpsView';
import { AgentsVolunteersView } from './modules/AgentsVolunteersView';
import { CallCenterView } from './modules/CallCenterView';
import { IncidentsView } from './modules/IncidentsView';
import { EventsView } from './modules/EventsView';
import { LogisticsView } from './modules/LogisticsView';
import { OrganizationView } from './modules/OrganizationView';
import { PollingCoverageView } from './modules/PollingCoverageView';
import { ElectionDayView } from './modules/ElectionDayView';
import { ReportsAnalyticsView } from './modules/ReportsAnalyticsView';
import { CommunicationsView } from './modules/CommunicationsView';
import { MediaMonitoringView } from './modules/MediaMonitoringView';
import { DocumentsView } from './modules/DocumentsView';
import { TasksView } from './modules/TasksView';
import { SecurityAuditView } from './modules/SecurityAuditView';
import { SettingsAdminView } from './modules/SettingsAdminView';

const MODULE_TRANSITION_LABELS: Partial<Record<NavModuleId, string>> = {
  'situation-room': 'Entering Executive Situation Room...',
  'katsina-simulator': 'Loading Katsina 34-LGA INEC Simulator...',
  'voter-sentiment': 'Opening Live Voter Sentiment Hub...',
  'settings-admin': 'Opening States, LGAs & Wards Directory...',
  'geographic-ops': 'Loading 774-LGA Geographic Operations...',
  'field-ops': 'Launching Field Operations Mobile PWA...',
};

const ActiveModuleSwitch: React.FC = () => {
  const { activeModule } = useCampaign();

  switch (activeModule) {
    case 'situation-room':
      return <SituationRoomView />;
    case 'katsina-simulator':
      return <KatsinaSimulatorView />;
    case 'voter-sentiment':
      return <VoterSentimentView />;
    case 'campaign-overview':
      return <CampaignOverviewView />;
    case 'geographic-ops':
      return <GeographicOpsView />;
    case 'field-ops':
      return <FieldOpsView />;
    case 'agents-volunteers':
      return <AgentsVolunteersView />;
    case 'call-center':
      return <CallCenterView />;
    case 'incidents':
      return <IncidentsView />;
    case 'events':
      return <EventsView />;
    case 'logistics':
      return <LogisticsView />;
    case 'organization':
      return <OrganizationView />;
    case 'polling-coverage':
      return <PollingCoverageView />;
    case 'election-day':
      return <ElectionDayView />;
    case 'reports-analytics':
      return <ReportsAnalyticsView />;
    case 'communications':
      return <CommunicationsView />;
    case 'media-monitoring':
      return <MediaMonitoringView />;
    case 'documents':
      return <DocumentsView />;
    case 'tasks':
      return <TasksView />;
    case 'security-audit':
      return <SecurityAuditView />;
    case 'settings-admin':
      return <SettingsAdminView />;
    default:
      return <SituationRoomView />;
  }
};

const CampaignAppShell: React.FC = () => {
  const { activeModule, setActiveModule, branding } = useCampaign();
  const initialRouteRef = useRef(resolveRouteFromLocation());
  const routeReadyRef = useRef<boolean>(
    initialRouteRef.current.showLanding || initialRouteRef.current.initialModule === 'situation-room'
  );
  const skipNextPushRef = useRef<boolean>(false);

  const [showLanding, setShowLanding] = useState<boolean>(initialRouteRef.current.showLanding);
  const [openSentimentOnEnter, setOpenSentimentOnEnter] = useState<boolean>(
    initialRouteRef.current.openSentiment
  );

  // Sync initial deep-link route (e.g. /katsina-simulator) and normalize unknown paths
  useEffect(() => {
    const initial = initialRouteRef.current;
    if (!initial.showLanding) {
      setActiveModule(initial.initialModule);
      return;
    }
    const cleanPath = window.location.pathname.replace(/^\/+|\/+$/g, '');
    if (cleanPath && cleanPath !== 'index.html') {
      window.history.replaceState(null, '', `/${window.location.search}${window.location.hash}`);
    }
  }, [setActiveModule]);

  // Keep browser URL synchronized with active module and handle Back/Forward navigation
  useEffect(() => {
    const onPopState = () => {
      const next = resolveRouteFromLocation();
      skipNextPushRef.current = true;
      setShowLanding(next.showLanding);
      setOpenSentimentOnEnter(next.openSentiment);
      if (!next.showLanding) {
        setActiveModule(next.initialModule);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setActiveModule]);

  useEffect(() => {
    if (!routeReadyRef.current) {
      if (activeModule === initialRouteRef.current.initialModule) {
        routeReadyRef.current = true;
      }
      return;
    }
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    const targetPath = showLanding ? '/' : `/${activeModule}`;
    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    if (currentPath !== targetPath) {
      const nextUrl = showLanding ? '/' : `${targetPath}${window.location.search}`;
      window.history.pushState(null, '', nextUrl);
    }
  }, [activeModule, showLanding]);

  // Branded executive boot sequence when the application launches
  const [bootVisible, setBootVisible] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('noloader') === '1') return false;
    }
    return true;
  });
  const [bootProgress, setBootProgress] = useState<number>(22);
  const [bootStatus, setBootStatus] = useState<string>('Initializing Katsina Command Platform...');

  // Brief branded transition overlay when moving between Landing Page & Command Center
  const [shellTransition, setShellTransition] = useState<{
    active: boolean;
    status: string;
    progress: number;
  }>({ active: false, status: '', progress: 0 });

  useEffect(() => {
    if (!bootVisible) return;
    const t1 = window.setTimeout(() => {
      setBootProgress(58);
      setBootStatus('Loading Oct 2026 INEC Register · 3,876,051 Voters...');
    }, 950);
    const t2 = window.setTimeout(() => {
      setBootProgress(92);
      setBootStatus('Synchronizing 34 LGAs, 361 Wards & Live Sentiment...');
    }, 1950);
    const t3 = window.setTimeout(() => {
      setBootProgress(100);
      setBootStatus('Katsina 2027 Command Center Ready');
    }, 2600);
    const t4 = window.setTimeout(() => {
      setBootVisible(false);
    }, 3050);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [bootVisible]);

  const handleEnterCommand = (
    initialModule: NavModuleId = 'situation-room',
    options?: { openSentiment?: boolean }
  ) => {
    const label =
      MODULE_TRANSITION_LABELS[initialModule] ?? 'Entering Campaign Command Center...';
    setShellTransition({ active: true, status: label, progress: 38 });
    routeReadyRef.current = true;
    setActiveModule(initialModule);
    setOpenSentimentOnEnter(Boolean(options?.openSentiment));
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    window.setTimeout(() => {
      setShellTransition((prev) => ({ ...prev, progress: 100 }));
    }, 360);
    window.setTimeout(() => {
      setShellTransition({ active: false, status: '', progress: 0 });
    }, 780);
  };

  const handleReturnHome = () => {
    setShellTransition({
      active: true,
      status: 'Returning to Campaign Home...',
      progress: 48,
    });
    routeReadyRef.current = true;
    setShowLanding(true);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    window.setTimeout(() => {
      setShellTransition((prev) => ({ ...prev, progress: 100 }));
    }, 320);
    window.setTimeout(() => {
      setShellTransition({ active: false, status: '', progress: 0 });
    }, 680);
  };

  const loaderVisible = bootVisible || shellTransition.active;
  const loaderStatus = bootVisible ? bootStatus : shellTransition.status;
  const loaderProgress = bootVisible ? bootProgress : shellTransition.progress;

  return (
    <>
      <CampaignLoader
        visible={loaderVisible}
        variant="fullscreen"
        title={`Senator ${branding.candidateName}`}
        statusText={loaderStatus}
        progress={loaderProgress}
        portraitUrl={branding.portraitDataUrl}
        crestUrl={branding.partyLogoDataUrl}
      />

      {showLanding ? (
        <LandingPage onEnterCommand={handleEnterCommand} />
      ) : (
        <>
          <Layout
            onReturnHome={handleReturnHome}
            initialSentimentOpen={openSentimentOnEnter}
          >
            <ActiveModuleSwitch />
          </Layout>
          <CommandSearchModal />
          <SetupWizardModal />
        </>
      )}
    </>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <CampaignProvider>
        <CampaignAppShell />
      </CampaignProvider>
    </ErrorBoundary>
  );
}
