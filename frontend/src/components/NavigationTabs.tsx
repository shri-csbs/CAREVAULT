import React from 'react';
import { LayoutDashboard, UserSearch, FilePlus2, History, RefreshCw, GitCompare, UserCheck2, ShieldAlert } from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'patient-search'
  | 'clinical-events'
  | 'event-history'
  | 'sync-status'
  | 'reconciliation'
  | 'human-review'
  | 'security-audit';

interface NavigationTabsProps {
  activeTab: NavTabId;
  onTabChange: (tab: NavTabId) => void;
  pendingReviewCount: number;
  isOffline: boolean;
  pendingSyncCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  pendingReviewCount,
  isOffline,
  pendingSyncCount,
}) => {
  const tabs = [
    {
      id: 'dashboard' as NavTabId,
      label: 'Main Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'patient-search' as NavTabId,
      label: 'Patient Search',
      shortLabel: 'Patients',
      icon: UserSearch,
    },
    {
      id: 'clinical-events' as NavTabId,
      label: 'Event Management',
      shortLabel: 'Create Event',
      icon: FilePlus2,
    },
    {
      id: 'event-history' as NavTabId,
      label: 'Event History',
      shortLabel: 'History',
      icon: History,
    },
    {
      id: 'sync-status' as NavTabId,
      label: 'Sync / Offline Status',
      shortLabel: 'Sync & Offline',
      icon: RefreshCw,
      badge: isOffline ? 'OFFLINE' : pendingSyncCount > 0 ? `${pendingSyncCount}` : undefined,
      badgeType: isOffline ? 'danger' : 'warning',
    },
    {
      id: 'reconciliation' as NavTabId,
      label: 'Reconciliation',
      shortLabel: 'Reconciliation',
      icon: GitCompare,
    },
    {
      id: 'human-review' as NavTabId,
      label: 'Human Review Queue',
      shortLabel: 'Review Queue',
      icon: UserCheck2,
      badge: pendingReviewCount > 0 ? `${pendingReviewCount}` : undefined,
      badgeType: 'danger',
    },
    {
      id: 'security-audit' as NavTabId,
      label: 'Security & Audit',
      shortLabel: 'Security',
      icon: ShieldAlert,
    },
  ];

  return (
    <div id="navigation-tabs-container" className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>

                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-1 ${
                      isActive
                        ? 'bg-white text-teal-800'
                        : tab.badgeType === 'danger'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
