import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Bookmark,
  History,
  ShieldCheck,
  ShieldAlert,
  Compass,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  AlertCircle,
  Settings,
  Check,
  X,
} from 'lucide-react';
import {
  DirectoryService,
  DirectoryCategoryId,
  PlatformType,
  BusinessModel,
  BangladeshAvailability,
} from '../../types/directory';
import {
  DIRECTORY_CATEGORIES,
  getStoredDirectoryServices,
  getDirectoryBookmarks,
  toggleDirectoryBookmark,
  getRecentlyVisitedServices,
  recordServiceVisit,
} from '../../services/directoryStorage';
import { ServiceCard } from './ServiceCard';
import { ServiceDetailModal } from './ServiceDetailModal';
import { DirectoryAdminModal } from './DirectoryAdminModal';

interface Props {
  currentLang?: string;
  onOpenAnime?: (animeId: number) => void;
}

export const ServicesDirectoryPage: React.FC<Props> = ({ currentLang }) => {
  // Services & State
  const [services, setServices] = useState<DirectoryService[]>(() => getStoredDirectoryServices());
  const [bookmarks, setBookmarks] = useState<string[]>(() => getDirectoryBookmarks());
  const [recentlyVisited, setRecentlyVisited] = useState<string[]>(() => getRecentlyVisitedServices());

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DirectoryCategoryId | 'all'>('all');
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'bookmarks' | 'recent' | 'third_party'>('all');

  // Secondary Filters
  const [filterPlatform, setFilterPlatform] = useState<PlatformType | 'all'>('all');
  const [filterBusinessModel, setFilterBusinessModel] = useState<BusinessModel | 'all'>('all');
  const [filterBangladesh, setFilterBangladesh] = useState<BangladeshAvailability | 'all'>('all');
  const [filterOfficialOnly, setFilterOfficialOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'recommended' | 'alphabetical' | 'verified' | 'bookmarked' | 'rating'>('recommended');

  // Modals state
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<DirectoryService | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Sync URL hash for direct links (e.g. #directory/crunchyroll)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#directory/')) {
        const slug = hash.replace('#directory/', '').trim();
        const found = services.find((s) => s.slug === slug || s.id === slug);
        if (found) {
          setSelectedServiceForModal(found);
          recordServiceVisit(found.id);
          setRecentlyVisited(getRecentlyVisitedServices());
        }
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [services]);

  const handleOpenDetails = (service: DirectoryService) => {
    setSelectedServiceForModal(service);
    recordServiceVisit(service.id);
    setRecentlyVisited(getRecentlyVisitedServices());
    try {
      window.history.replaceState(null, '', `#directory/${service.slug}`);
    } catch {
      // ignore
    }
  };

  const handleCloseModal = () => {
    setSelectedServiceForModal(null);
    try {
      window.history.replaceState(null, '', '#directory');
    } catch {
      // ignore
    }
  };

  const handleToggleBookmark = (id: string) => {
    toggleDirectoryBookmark(id);
    setBookmarks(getDirectoryBookmarks());
    setServices(getStoredDirectoryServices());
  };

  // Filtered & Sorted Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      // Archived services check
      if (s.isArchived) return false;

      // View Tab filter
      if (activeViewTab === 'bookmarks' && !bookmarks.includes(s.id)) return false;
      if (activeViewTab === 'recent' && !recentlyVisited.includes(s.id)) return false;
      if (activeViewTab === 'third_party' && (s.isOfficial || !s.categories.includes('third_party_services'))) return false;

      // Category filter
      if (selectedCategory !== 'all' && !s.categories.includes(selectedCategory)) {
        return false;
      }

      // Official only filter
      if (filterOfficialOnly && !s.isOfficial) return false;

      // Platform filter
      if (filterPlatform !== 'all' && !s.platforms.includes(filterPlatform)) {
        return false;
      }

      // Business Model filter
      if (filterBusinessModel !== 'all' && s.businessModel !== filterBusinessModel) {
        return false;
      }

      // Bangladesh status filter
      if (filterBangladesh !== 'all' && s.bangladeshStatus !== filterBangladesh) {
        return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesTagline = s.tagline.toLowerCase().includes(q);
        const matchesDesc = s.description.toLowerCase().includes(q);
        const matchesCat = s.categories.some((c) => c.toLowerCase().includes(q));
        const matchesAudio = (s.specs.audioLanguages || []).some((l) => l.toLowerCase().includes(q));
        if (!matchesName && !matchesTagline && !matchesDesc && !matchesCat && !matchesAudio) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'verified') {
        return b.lastVerifiedDate.localeCompare(a.lastVerifiedDate);
      }
      if (sortBy === 'bookmarked') {
        return (b.bookmarkCount || 0) - (a.bookmarkCount || 0);
      }
      if (sortBy === 'rating') {
        return (b.userRating || 0) - (a.userRating || 0);
      }
      // 'recommended' - Official first, high bookmarks
      if (a.isOfficial !== b.isOfficial) {
        return a.isOfficial ? -1 : 1;
      }
      return (b.bookmarkCount || 0) - (a.bookmarkCount || 0);
    });
  }, [
    services,
    bookmarks,
    recentlyVisited,
    activeViewTab,
    selectedCategory,
    filterOfficialOnly,
    filterPlatform,
    filterBusinessModel,
    filterBangladesh,
    searchQuery,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setActiveViewTab('all');
    setFilterPlatform('all');
    setFilterBusinessModel('all');
    setFilterBangladesh('all');
    setFilterOfficialOnly(false);
    setSortBy('recommended');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    activeViewTab !== 'all' ||
    filterPlatform !== 'all' ||
    filterBusinessModel !== 'all' ||
    filterBangladesh !== 'all' ||
    filterOfficialOnly;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 pb-20 selection:bg-indigo-600 selection:text-white">
      {/* 1. HERO DIRECTORY HEADER (EverythingMoe Inspired AMOLED Design) */}
      <div className="relative overflow-hidden border-b border-slate-800/80 bg-gradient-to-b from-[#0e1424] via-[#090d16] to-[#07090e] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>CURATED SERVICES REGISTRY</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Inspired by EverythingMoe Directory
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                <span>Anime & Manga Directory</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                The centralized index of official anime streaming platforms, legal manga apps, licensed YouTube channels, light novel stores, databases, and merchandise retailers.
              </p>
            </div>

            {/* Admin Management Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAdminOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Admin Manager</span>
              </button>
            </div>
          </div>

          {/* Regional Disclaimer Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-xs text-slate-400 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong className="text-slate-300">Disclaimer:</strong> Service availability, pricing, advertising, and language audio dubs can change by region. Check the provider’s official page before subscribing.
            </span>
          </div>

          {/* Search Bar & View Tab Controls */}
          <div className="space-y-4 pt-2">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search platforms by name, audio dub (e.g. Hindi, Bengali, English), category, or features..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-[#0b0f1a] border border-slate-800 hover:border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-500 text-sm shadow-xl outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Tabs: All, Bookmarks, Recently Visited, Third-Party */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setActiveViewTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeViewTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                    : 'bg-[#0d1424] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <span>All Services ({services.length})</span>
              </button>

              <button
                onClick={() => setActiveViewTab('bookmarks')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeViewTab === 'bookmarks'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                    : 'bg-[#0d1424] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Favorites ({bookmarks.length})</span>
              </button>

              <button
                onClick={() => setActiveViewTab('recent')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeViewTab === 'recent'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60'
                    : 'bg-[#0d1424] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Recently Visited ({recentlyVisited.length})</span>
              </button>

              <button
                onClick={() => setActiveViewTab('third_party')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeViewTab === 'third_party'
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/60'
                    : 'bg-[#0d1424] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Third-Party Directory</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CATEGORY PILLS BAR (14 Categories) */}
      <div className="sticky top-16 z-30 bg-[#07090e]/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-white text-slate-950 shadow-md scale-105'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Categories
            </button>

            {DIRECTORY_CATEGORIES.map((cat) => {
              const count = services.filter((s) => s.categories.includes(cat.id)).length;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/50 scale-105'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.shortName}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-indigo-800 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. MULTI-DIMENSIONAL FILTER & SORT BAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        <div className="p-4 rounded-2xl bg-[#0c111f] border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Filters:</span>
            </span>

            {/* Platform filter */}
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value as any)}
              className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Platform: All</option>
              <option value="web">Web Browser</option>
              <option value="android">Android App</option>
              <option value="ios">Apple iOS App</option>
              <option value="smart_tv">Smart TV / Android TV</option>
              <option value="desktop">Desktop App</option>
            </select>

            {/* Business Model filter */}
            <select
              value={filterBusinessModel}
              onChange={(e) => setFilterBusinessModel(e.target.value as any)}
              className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Access: All Models</option>
              <option value="free">100% Free</option>
              <option value="ad_supported">Ad-Supported (AVOD)</option>
              <option value="subscription">Subscription (SVOD)</option>
              <option value="free_plus_premium">Free + Premium</option>
              <option value="pay_per_volume">Store / Pay per Title</option>
            </select>

            {/* Bangladesh Status filter */}
            <select
              value={filterBangladesh}
              onChange={(e) => setFilterBangladesh(e.target.value as any)}
              className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Region: Global</option>
              <option value="available">Available in Bangladesh</option>
              <option value="region_restricted">⚠️ Region-Restricted</option>
              <option value="vpn_required">🛡️ VPN Required</option>
            </select>

            {/* Official Licensors Only */}
            <label className="flex items-center gap-1.5 text-slate-300 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={filterOfficialOnly}
                onChange={(e) => setFilterOfficialOnly(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-indigo-600 cursor-pointer"
              />
              <span>Official Only</span>
            </label>
          </div>

          {/* Right Controls: Sort & Reset */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded-xl px-2.5 py-1.5 outline-none focus:border-indigo-500 cursor-pointer font-bold"
              >
                <option value="recommended">Curated / Recommended</option>
                <option value="alphabetical">Alphabetical (A - Z)</option>
                <option value="verified">Recently Verified</option>
                <option value="bookmarked">Most Bookmarked</option>
                <option value="rating">Highest User Rating</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-300 hover:text-white border border-rose-900/40 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono px-1">
          <span>
            Showing <strong className="text-white">{filteredServices.length}</strong> verified services
            {selectedCategory !== 'all' ? ` in ${DIRECTORY_CATEGORIES.find((c) => c.id === selectedCategory)?.title}` : ''}
          </span>
          <span>Last Catalog Audit: October 2026</span>
        </div>

        {/* 4. SERVICES CARDS GRID */}
        {filteredServices.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#0c111f] border border-slate-800 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
              🔍
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No services found matching your criteria</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try searching for broader keywords like "Crunchyroll", "Manga", "Hindi Dub", or clear your regional filters.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-950/60"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                isBookmarked={bookmarks.includes(service.id)}
                onToggleBookmark={handleToggleBookmark}
                onOpenDetails={handleOpenDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. SERVICE DETAIL MODAL */}
      {selectedServiceForModal && (
        <ServiceDetailModal
          service={selectedServiceForModal}
          allServices={services}
          isBookmarked={bookmarks.includes(selectedServiceForModal.id)}
          onToggleBookmark={handleToggleBookmark}
          onClose={handleCloseModal}
          onSelectService={handleOpenDetails}
        />
      )}

      {/* 6. ADMIN MANAGEMENT MODAL */}
      {isAdminOpen && (
        <DirectoryAdminModal
          services={services}
          onUpdateServices={(updated) => setServices(updated)}
          onClose={() => setIsAdminOpen(false)}
        />
      )}
    </div>
  );
};
