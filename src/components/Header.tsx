import React from 'react';
import { Search, LifeBuoy, Calendar, LogIn, LogOut, Cloud, BookOpen, KeyRound } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { TranslatorDropdown } from './TranslatorDropdown';
import { getUIText } from '../services/translator';
import { useFirebase } from '../contexts/FirebaseContext';

export type NavTab = 'anime' | 'upcoming' | 'manga' | 'read' | 'characters' | 'library' | 'directory';

interface Props {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  currentLang: string;
  onLanguageChange: (code: string) => void;
  onSearchFocus: () => void;
  onOpenSupport?: () => void;
  onOpenTranslator?: () => void;
  onOpenApiKeySettings?: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  currentLang,
  onLanguageChange,
  onSearchFocus,
  onOpenSupport,
  onOpenTranslator,
  onOpenApiKeySettings,
}) => {
  const { user, authReady, authBusy, authError, signInWithGoogle, logoutUser } = useFirebase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 h-16">
        {/* Zone 1: Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('anime');
          }}
          className="text-lg font-bold tracking-tight text-white flex items-center gap-2 group shrink-0"
        >
          <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
            AR
          </span>
          <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent font-black tracking-tight">
            AniRead
          </span>
        </a>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onTabChange('anime')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'anime'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {getUIText('animeExplorer', currentLang)}
          </button>
          <button
            onClick={() => onTabChange('upcoming')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'upcoming'
                ? 'text-indigo-300 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming</span>
          </button>
          <button
            onClick={() => onTabChange('manga')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'manga'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Explore Manga
          </button>
          <button
            onClick={() => onTabChange('read')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'read'
                ? 'text-indigo-300 border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-indigo-300'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Read</span>
          </button>
          <button
            onClick={() => onTabChange('characters')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'characters'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {getUIText('topCharacters', currentLang)}
          </button>
          <button
            onClick={() => onTabChange('library')}
            className={`transition-colors whitespace-nowrap py-1 cursor-pointer ${
              activeTab === 'library'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {getUIText('myLibrary', currentLang)}
          </button>
          <button
            onClick={() => onTabChange('directory')}
            className={`transition-colors whitespace-nowrap py-1 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'directory'
                ? 'text-purple-400 border-b-2 border-purple-500 font-semibold'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <span>🌐</span>
            <span>Directory</span>
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Support & Quick Replies (Official gamerbangla436@gmail.com)"
            >
              <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Support & Replies</span>
              <span className="md:hidden">Support</span>
            </button>
          )}

          {onOpenTranslator && (
            <button
              onClick={onOpenTranslator}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
              title="Google AI Translator (Live 100+ World Languages & Voice)"
            >
              <span className="text-xs">🌐</span>
              <span className="hidden sm:inline">AI Translator</span>
            </button>
          )}

          {onOpenApiKeySettings && (
            <button
              type="button"
              onClick={onOpenApiKeySettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Gemini API Key settings"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-300" />
              <span className="hidden md:inline">API Key</span>
            </button>
          )}

          <button
            onClick={onSearchFocus}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="Search Anime"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <TranslatorDropdown
            currentLang={currentLang}
            onLanguageChange={onLanguageChange}
            onOpenTranslator={onOpenTranslator}
          />
          <PWAInstallButton />

          {authReady && (
            user ? (
              <div className="flex items-center gap-1.5 pl-1">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-200"
                  title={`Cloud synced as ${user.email || user.displayName || 'User'}`}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="hidden xl:inline max-w-[90px] truncate font-medium">
                    {user.displayName?.split(' ')[0] || 'Synced'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logoutUser}
                  disabled={authBusy}
                  className="p-2 text-slate-400 hover:text-rose-300 rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer disabled:opacity-50"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  disabled={authBusy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  title="Create account or sign in with Google"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-300" />
                  <span>{authBusy ? 'Redirecting...' : 'Continue with Google'}</span>
                </button>
              </div>
            )
          )}
          {authError && (
            <span role="status" aria-live="polite" title={authError} className="hidden md:inline max-w-[180px] truncate text-[10px] text-rose-300">
              {authError}
            </span>
          )}
        </div>
      </div>

      {/* Mobile & Tablet Secondary Tab Strip */}
      <div className="flex lg:hidden items-center gap-1 px-2.5 py-2 border-t border-slate-800/60 bg-[#0d1322] text-xs overflow-x-auto scrollbar-none">
        <button
          onClick={() => onTabChange('anime')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            activeTab === 'anime' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {getUIText('animeExplorer', currentLang)}
        </button>
        <button
          onClick={() => onTabChange('upcoming')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
            activeTab === 'upcoming' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3 h-3" />
          <span>Upcoming</span>
        </button>
        <button
          onClick={() => onTabChange('manga')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            activeTab === 'manga' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {getUIText('mangaReader', currentLang)}
        </button>
        <button
          onClick={() => onTabChange('read')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 ${
            activeTab === 'read' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          <span>Read</span>
        </button>
        <button
          onClick={() => onTabChange('characters')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            activeTab === 'characters' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {getUIText('topCharacters', currentLang)}
        </button>
        <button
          onClick={() => onTabChange('library')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 cursor-pointer ${
            activeTab === 'library' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {getUIText('myLibrary', currentLang)}
        </button>
        <button
          onClick={() => onTabChange('directory')}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 cursor-pointer ${
            activeTab === 'directory' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🌐</span>
          <span>Directory</span>
        </button>
        {onOpenSupport && (
          <button
            onClick={onOpenSupport}
            className="px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors shrink-0 flex items-center gap-1 cursor-pointer bg-indigo-900/60 text-indigo-300 border border-indigo-500/40 font-semibold"
          >
            <LifeBuoy className="w-3 h-3 text-indigo-400" />
            <span>Support</span>
          </button>
        )}
      </div>
    </header>
  );
};
