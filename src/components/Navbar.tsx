import React, { useState } from 'react';
import { 
  Award, 
  LogIn, 
  LogOut, 
  Share2, 
  Check, 
  CheckCheck, 
  Bell, 
  MessageSquare, 
  Calendar as CalendarIcon, 
  FileText, 
  Mail, 
  X, 
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { UserProfile, Club, isPraesidiumMember } from '../utils/clubLogic';
import { NotificationItem } from '../utils/notifications';
import { ClubLogo } from './ClubLogo';
import { UserAvatar } from './UserAvatar';

export type TabType = 'forum' | 'calendar' | 'clubs' | 'protokolle' | 'profile' | 'praesidium';

interface NavbarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: UserProfile;
  currentClub?: Club;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onShareApp?: () => void;
  copiedLink?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  unreadCounts?: {
    forum: number;
    calendar: number;
    protokolle: number;
    profile: number;
    total: number;
  };
  unreadItems?: NotificationItem[];
  onMarkAllAsRead?: () => void;
  onSyncDatabase?: () => Promise<void>;
  isSyncing?: boolean;
  usersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  currentClub,
  onOpenAuthModal,
  onLogout,
  onShareApp,
  copiedLink,
  isDarkMode = false,
  onToggleTheme,
  unreadCounts,
  unreadItems,
  onMarkAllAsRead,
  onSyncDatabase,
  isSyncing = false,
  usersCount
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const isPraesidium = isPraesidiumMember(currentUser);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand wordmark with hidden link to official website */}
        <a 
          href="https://narrenkreis-bruchsal.de/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2.5 group cursor-pointer no-underline"
          title="Offizielle Website: https://narrenkreis-bruchsal.de/"
        >
          <img
            src="/assets/aistudio/Screenshot_20261021-104615_ee27e84a.png"
            alt="Narrenkreis Bruchsal Logo"
            className="w-8 h-10 object-contain shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform"
          />
          <span className="font-extrabold text-red-950 dark:text-red-400 group-hover:text-red-800 dark:group-hover:text-red-300 transition-colors">Narrenkreis Bruchsal</span>
        </a>

        {/* Zone 2: Navigation tabs: FORUM, KALENDER, VEREINE, PROTOKOLLE, PROFIL, PRÄSIDIUM */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onTabChange('forum')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
              activeTab === 'forum'
                ? 'text-red-700 dark:text-red-400 border-b-2 border-red-700 dark:border-red-500 font-bold'
                : 'hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent'
            }`}
          >
            <span>FORUM</span>
            {Boolean(unreadCounts?.forum) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black leading-tight animate-pulse shadow-xs">
                {unreadCounts?.forum}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('calendar')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'text-red-700 border-b-2 border-red-700 font-bold'
                : 'hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            <span>KALENDER</span>
            {Boolean(unreadCounts?.calendar) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black leading-tight animate-pulse shadow-xs">
                {unreadCounts?.calendar}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('clubs')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 ${
              activeTab === 'clubs'
                ? 'text-red-700 border-b-2 border-red-700 font-bold'
                : 'hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            <span>VEREINE</span>
          </button>

          <button
            onClick={() => onTabChange('protokolle')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
              activeTab === 'protokolle'
                ? 'text-red-700 border-b-2 border-red-700 font-bold'
                : 'hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            <span>PROTOKOLLE</span>
            {Boolean(unreadCounts?.protokolle) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black leading-tight animate-pulse shadow-xs">
                {unreadCounts?.protokolle}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('profile')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'text-red-700 border-b-2 border-red-700 font-bold'
                : 'hover:text-slate-900 border-b-2 border-transparent'
            }`}
          >
            <span>PROFIL</span>
            {Boolean(unreadCounts?.profile) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-black leading-tight animate-pulse shadow-xs">
                {unreadCounts?.profile}
              </span>
            )}
          </button>

          {isPraesidium && (
            <button
              onClick={() => onTabChange('praesidium')}
              className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 flex items-center gap-1.5 ${
                activeTab === 'praesidium'
                  ? 'text-amber-800 border-b-2 border-amber-600 font-bold'
                  : 'hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <span>PRÄSIDIUM</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" title="Präsidiums-Zugang aktiv" />
            </button>
          )}
        </nav>

        {/* Zone 3: Active Profile Quick Indicator, Theme Switcher, Share & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {onSyncDatabase && (
            <button
              type="button"
              onClick={onSyncDatabase}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-200 hover:text-amber-900 dark:hover:text-amber-300 transition-colors text-xs font-semibold shadow-2xs cursor-pointer disabled:opacity-50"
              title={`Cloud-Datenbank synchronisieren (${usersCount ?? 0} Mitglieder)`}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-700 dark:text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline">{isSyncing ? 'Sync...' : 'Live-Sync'}</span>
            </button>
          )}

          {/* Theme Switcher Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-amber-300 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 transition-colors text-xs font-semibold shadow-2xs cursor-pointer"
              title={isDarkMode ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren (besonders angenehm bei Sitzungen am Abend & in Festhallen)'}
              aria-label="Design umschalten"
            >
              {isDarkMode ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-600" />
              )}
              <span className="hidden sm:inline">{isDarkMode ? 'Hell' : 'Dunkel'}</span>
            </button>
          )}

          {onShareApp && (
            <button
              type="button"
              onClick={onShareApp}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-800 hover:bg-red-50/50 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-200 hover:text-red-800 dark:hover:text-red-300 transition-colors text-xs font-semibold shadow-2xs cursor-pointer"
              title="Diesen Link für Mitglieder kopieren (ohne Google-Konto, für alle Browser)"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-red-700 dark:text-red-400" />}
              <span className="hidden sm:inline">{copiedLink ? 'Kopiert!' : 'Link teilen'}</span>
            </button>
          )}

          {/* Notification Bell with Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const nextOpen = !isNotificationsOpen;
                setIsNotificationsOpen(nextOpen);
                if (nextOpen && onMarkAllAsRead) {
                  onMarkAllAsRead();
                }
              }}
              className={`p-2 rounded-xl border transition-colors relative cursor-pointer flex items-center justify-center ${
                isNotificationsOpen
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Neuigkeiten & Benachrichtigungen"
            >
              <Bell className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              {Boolean(unreadCounts?.total) && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-red-600 text-white flex items-center justify-center shadow-xs animate-pulse leading-none">
                  {unreadCounts?.total}
                </span>
              )}
            </button>

            {/* Notification Dropdown & Backdrop */}
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[60] bg-black/10 sm:bg-transparent"
                  onClick={() => setIsNotificationsOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-3 z-[70] animate-in fade-in duration-150">
                  <div className="px-4 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-red-700" />
                      <span className="text-xs font-bold text-slate-900">Neuigkeiten im Narrenkreis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {onMarkAllAsRead && (
                        <button
                          type="button"
                          onClick={() => onMarkAllAsRead()}
                          className="text-[11px] font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 hover:underline cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md transition-colors"
                          title="Alle Benachrichtigungen als gelesen markieren"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Gelesen</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition-colors"
                        title="Schließen"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-1">
                    {unreadItems && unreadItems.length > 0 ? (
                      unreadItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.tab);
                            setIsNotificationsOpen(false);
                          }}
                          className="px-4 py-2.5 hover:bg-amber-50/60 transition-colors cursor-pointer flex items-start gap-3 group"
                        >
                          <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0 mt-0.5 border border-red-200/60">
                            {item.type === 'forum' && <MessageSquare className="w-3.5 h-3.5" />}
                            {item.type === 'calendar' && <CalendarIcon className="w-3.5 h-3.5" />}
                            {item.type === 'protokolle' && <FileText className="w-3.5 h-3.5" />}
                            {item.type === 'email' && <Mail className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-bold text-slate-800 group-hover:text-red-700 transition-colors truncate">
                                {item.title}
                              </p>
                              {item.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" title="Neu" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 px-4 text-center space-y-1">
                        <p className="text-xs font-semibold text-slate-700">Keine Neuigkeiten vorhanden</p>
                        <p className="text-[11px] text-slate-400">Alles ist aktuell und auf dem neuesten Stand!</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => onTabChange('profile')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-red-300 hover:bg-red-50/40 transition-colors bg-white shadow-2xs group cursor-pointer"
            title="Mein Profil bearbeiten"
          >
            <ClubLogo club={currentClub} size="xs" />
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight group-hover:text-red-700">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-500 block truncate max-w-[110px]">
                {currentUser.praesidiumRole || currentClub?.shortName || 'Mitglied'}
              </span>
            </div>
            <UserAvatar user={currentUser} size="xs" />
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors text-xs font-semibold shadow-2xs cursor-pointer"
              title="Abmelden"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav bar with the 6 tabs & quick dark mode toggle */}
      <div className="flex lg:hidden items-center justify-between overflow-x-auto border-t border-slate-200 dark:border-slate-800 px-3 py-2 text-xs font-semibold bg-slate-50/95 dark:bg-slate-900/95 scrollbar-none gap-1.5 transition-colors">
        <button
          onClick={() => onTabChange('forum')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 flex items-center gap-1 ${activeTab === 'forum' ? 'bg-red-700 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span>FORUM</span>
          {Boolean(unreadCounts?.forum) && (
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight ${activeTab === 'forum' ? 'bg-white text-red-700' : 'bg-red-600 text-white animate-pulse'}`}>
              {unreadCounts?.forum}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('calendar')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 flex items-center gap-1 ${activeTab === 'calendar' ? 'bg-red-700 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span>KALENDER</span>
          {Boolean(unreadCounts?.calendar) && (
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight ${activeTab === 'calendar' ? 'bg-white text-red-700' : 'bg-red-600 text-white animate-pulse'}`}>
              {unreadCounts?.calendar}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('clubs')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'clubs' ? 'bg-red-700 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          VEREINE
        </button>
        <button
          onClick={() => onTabChange('protokolle')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 flex items-center gap-1 ${activeTab === 'protokolle' ? 'bg-red-700 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span>PROTOKOLLE</span>
          {Boolean(unreadCounts?.protokolle) && (
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight ${activeTab === 'protokolle' ? 'bg-white text-red-700' : 'bg-red-600 text-white animate-pulse'}`}>
              {unreadCounts?.protokolle}
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('profile')}
          className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 flex items-center gap-1 ${activeTab === 'profile' ? 'bg-red-700 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <span>PROFIL</span>
          {Boolean(unreadCounts?.profile) && (
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black leading-tight ${activeTab === 'profile' ? 'bg-white text-red-700' : 'bg-red-600 text-white animate-pulse'}`}>
              {unreadCounts?.profile}
            </span>
          )}
        </button>
        {isPraesidium && (
          <button
            onClick={() => onTabChange('praesidium')}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${activeTab === 'praesidium' ? 'bg-amber-700 text-white font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
          >
            PRÄSIDIUM
          </button>
        )}

        {/* Mobile Quick Theme Switcher */}
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="p-1.5 rounded-md shrink-0 text-slate-500 dark:text-amber-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title={isDarkMode ? 'Helles Design' : 'Dunkles Design'}
            aria-label="Design umschalten"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            className="px-2 py-1 rounded-md whitespace-nowrap shrink-0 text-slate-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
            title="Abmelden"
          >
            <LogOut className="w-3 h-3" />
            <span>Abmelden</span>
          </button>
        )}
      </div>
    </header>
  );
};
