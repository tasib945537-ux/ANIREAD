import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Database,
  Search,
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Lock,
  LogOut,
  GitMerge,
  Archive,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';
import {
  isAdminAuthenticated,
  adminLogin,
  adminLogout,
} from '../../services/dubVerificationStorage';
import {
  ServerHindiDubRecord,
  syncHindiCatalogFromServer,
} from '../../services/hindiRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDatabaseUpdated?: () => void;
}

interface HindiStatsResponse {
  totalHindiDubbedAnime: number;
  completeCount: number;
  partialCount: number;
  announcedCount: number;
  byType: {
    TV: number;
    Movie: number;
    OVA: number;
    ONA: number;
    Special: number;
    ovaAndOna: number;
  };
  platformCounts: Record<string, number>;
  availabilityCounts: {
    Available: number;
    Unavailable: number;
    Unknown: number;
  };
  needsVerificationCount: number;
  duplicateCandidatesCount: number;
  lastVerificationDate: string;
  migrationSummary: {
    totalUniqueEntries?: number;
    completeHindiDubs?: number;
    partialHindiDubs?: number;
    announcedHindiDubs?: number;
    newlyAddedCount?: number;
    removedUnverifiedCount?: number;
    requiresFurtherVerificationCount?: number;
  } | null;
  removedUnverifiedEntries: Array<{
    title: string;
    reason?: string;
    previousClaim?: string;
  }>;
  recentAudits: Array<{
    timestamp: string;
    action: string;
    title: string;
    details: string;
    user?: string;
  }>;
}

interface DuplicateCandidate {
  key: string;
  records: ServerHindiDubRecord[];
  reason: string;
}

const KNOWN_PLATFORMS = [
  'Crunchyroll India',
  'Netflix India',
  'Amazon Prime Video India',
  'Anime Times India',
  'Muse India',
  'JioHotstar',
  'Sony YAY! / SonyLIV',
  'Hungama TV / Disney India',
  'Cartoon Network / Sonic India',
  'PVR Theatrical',
];

const EMPTY_FORM: Partial<ServerHindiDubRecord> = {
  title: '',
  original_title: '',
  englishTitle: '',
  type: 'TV',
  season: 1,
  part: null,
  episodes: 12,
  verified_episodes: 12,
  hindi_audio: true,
  dub_status: 'Complete',
  availability_status: 'Available',
  platforms: ['Crunchyroll India'],
  official_sources: ['Crunchyroll India'],
  source_urls: [''],
  verification_date: new Date().toISOString().slice(0, 10),
  notes: '',
  needs_verification: false,
  coverImage: '',
  anilistId: null,
  malId: null,
};

export const HindiDubAdminModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onDatabaseUpdated,
}) => {
  const [authenticated, setAuthenticated] = useState<boolean>(() => isAdminAuthenticated());
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [activeView, setActiveView] = useState<'catalog' | 'duplicates' | 'audit'>('catalog');
  const [stats, setStats] = useState<HindiStatsResponse | null>(null);
  const [records, setRecords] = useState<ServerHindiDubRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [needsVerFilter, setNeedsVerFilter] = useState<'all' | 'true'>('all');

  // Duplicates & feedback banner
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [actionMessage, setActionMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Add / Edit modal
  const [editingRecord, setEditingRecord] = useState<Partial<ServerHindiDubRecord> | null>(null);
  const [platformsText, setPlatformsText] = useState('');
  const [sourcesText, setSourcesText] = useState('');
  const [urlsText, setUrlsText] = useState('');

  const fetchStatsAndDuplicates = useCallback(async () => {
    try {
      const [statsRes, dupRes] = await Promise.all([
        fetch('/api/dubs/hindi/stats'),
        fetch('/api/dubs/hindi/duplicates'),
      ]);
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (dupRes.ok) {
        const dj = await dupRes.json();
        setDuplicates(Array.isArray(dj?.candidates) ? dj.candidates : []);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        perPage: '20',
      });
      if (searchQ.trim()) qs.set('q', searchQ.trim());
      if (platformFilter !== 'all') qs.set('platform', platformFilter);
      if (statusFilter !== 'all') qs.set('dub_status', statusFilter);
      if (typeFilter !== 'all') qs.set('type', typeFilter);
      if (needsVerFilter === 'true') qs.set('needs_verification', 'true');

      const res = await fetch(`/api/dubs/hindi?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(Array.isArray(data?.items) ? data.items : []);
        setTotalRecords(Number(data?.total || 0));
        setTotalPages(Number(data?.totalPages || 1));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, searchQ, platformFilter, statusFilter, typeFilter, needsVerFilter]);

  useEffect(() => {
    if (isOpen && authenticated) {
      fetchStatsAndDuplicates();
    }
  }, [isOpen, authenticated, fetchStatsAndDuplicates]);

  useEffect(() => {
    if (isOpen && authenticated) {
      const t = setTimeout(() => {
        fetchRecords();
      }, 150);
      return () => clearTimeout(t);
    }
  }, [isOpen, authenticated, fetchRecords]);

  if (!isOpen) return null;

  const notify = (type: 'ok' | 'err', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(pinInput)) {
      setAuthenticated(true);
      setAuthError('');
      setPinInput('');
    } else {
      setAuthError('Invalid PIN. Use admin123 or aniread2026.');
    }
  };

  const handleLogout = () => {
    adminLogout();
    setAuthenticated(false);
  };

  const openEditor = (rec?: ServerHindiDubRecord) => {
    const seed = rec ? { ...rec } : { ...EMPTY_FORM };
    setEditingRecord(seed);
    setPlatformsText((seed.platforms || []).join(', '));
    setSourcesText((seed.official_sources || []).join(', '));
    setUrlsText((seed.source_urls || []).join('\n'));
  };

  const toggleFormPlatform = (plat: string) => {
    const current = platformsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.some((p) => p.toLowerCase() === plat.toLowerCase());
    const next = exists
      ? current.filter((p) => p.toLowerCase() !== plat.toLowerCase())
      : [...current, plat];
    setPlatformsText(next.join(', '));
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord?.title?.trim()) {
      notify('err', 'Anime title is required.');
      return;
    }

    setBusyAction('save');
    try {
      const platforms = platformsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const official_sources = sourcesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const source_urls = urlsText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/dubs/hindi/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingRecord,
          platforms,
          official_sources: official_sources.length > 0 ? official_sources : platforms,
          source_urls,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to save');

      setEditingRecord(null);
      notify('ok', `Saved "${json.record.title}" (${json.total} total Hindi entries).`);
      await Promise.all([fetchRecords(), fetchStatsAndDuplicates(), syncHindiCatalogFromServer()]);
      onDatabaseUpdated?.();
    } catch (err: any) {
      notify('err', err?.message || 'Save failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleQuickVerify = async (rec: ServerHindiDubRecord, nextStatus?: 'Complete' | 'Partial' | 'Announced') => {
    setBusyAction(`verify_${rec.id}`);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetch('/api/dubs/hindi/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rec,
          dub_status: nextStatus || rec.dub_status,
          needs_verification: false,
          verification_date: today,
          availability_status: (nextStatus || rec.dub_status) === 'Announced' ? 'Unknown' : 'Available',
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      notify('ok', `Verified "${rec.title}" as ${nextStatus || rec.dub_status}.`);
      await Promise.all([fetchRecords(), fetchStatsAndDuplicates(), syncHindiCatalogFromServer()]);
      onDatabaseUpdated?.();
    } catch (err: any) {
      notify('err', err?.message || 'Verification failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteRecord = async (id: string, title: string) => {
    setBusyAction(`del_${id}`);
    try {
      const res = await fetch(`/api/dubs/hindi/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setPendingDeleteId(null);
      notify('ok', `Removed "${title}" from Hindi database.`);
      await Promise.all([fetchRecords(), fetchStatsAndDuplicates(), syncHindiCatalogFromServer()]);
      onDatabaseUpdated?.();
    } catch (err: any) {
      notify('err', err?.message || 'Delete failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleSyncDatabase = async () => {
    setBusyAction('sync');
    try {
      const res = await fetch('/api/dubs/hindi/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Sync failed');
      notify('ok', `Database synced: ${data.total} unique records (${data.mergedDuplicates || 0} duplicates merged).`);
      await Promise.all([fetchRecords(), fetchStatsAndDuplicates(), syncHindiCatalogFromServer()]);
      onDatabaseUpdated?.();
    } catch (err: any) {
      notify('err', err?.message || 'Sync error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCreateBackup = async () => {
    setBusyAction('backup');
    try {
      const res = await fetch('/api/dubs/hindi/backup', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Backup failed');
      notify('ok', `Backup snapshot created: ${data.filename} (${data.count} entries).`);
      await fetchStatsAndDuplicates();
    } catch (err: any) {
      notify('err', err?.message || 'Backup error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAutoMergeDuplicates = async () => {
    setBusyAction('merge_all');
    try {
      const res = await fetch('/api/dubs/hindi/merge-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMergeExact: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Merge failed');
      notify('ok', `Auto-merged ${data.mergedCount} duplicate entries.`);
      await Promise.all([fetchRecords(), fetchStatsAndDuplicates(), syncHindiCatalogFromServer()]);
      onDatabaseUpdated?.();
    } catch (err: any) {
      notify('err', err?.message || 'Merge error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleMergePair = async (primaryId: string, duplicateId: string) => {
    setBusyAction(`merge_${primaryId}`);
    try {
      const res = await fetch('/api/dubs/hindi/merge-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryId, duplicateId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Pair merge failed');
      notify('ok', 'Merged duplicate pair cleanly.');
      await Promise.all([fetchRecords(), fetchStatsAndDuplicates(), syncHindiCatalogFromServer()]);
      onDatabaseUpdated?.();
    } catch (err: any) {
      notify('err', err?.message || 'Pair merge failed');
    } finally {
      setBusyAction(null);
    }
  };

  const handleDownloadExport = async (format: 'csv' | 'json') => {
    setBusyAction(`export_${format}`);
    try {
      const res = await fetch(`/api/dubs/hindi/export?format=${format}`);
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aniread_hindi_dub_database.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notify('ok', `Exported ${format.toUpperCase()} dataset.`);
    } catch (err: any) {
      notify('err', err?.message || 'Export error');
    } finally {
      setBusyAction(null);
    }
  };

  const platformBadgeMap = [
    { key: 'crunchyroll', label: 'Crunchyroll India', count: stats?.platformCounts['Crunchyroll India'] ?? 0 },
    { key: 'netflix', label: 'Netflix India', count: stats?.platformCounts['Netflix India'] ?? 0 },
    { key: 'prime', label: 'Amazon Prime Video India', count: stats?.platformCounts['Amazon Prime Video India'] ?? 0 },
    { key: 'anime_times', label: 'Anime Times India', count: stats?.platformCounts['Anime Times India'] ?? 0 },
    { key: 'muse', label: 'Muse India', count: stats?.platformCounts['Muse India'] ?? 0 },
    { key: 'other', label: 'Other Official Platforms', count: stats?.platformCounts['Other Official Platforms'] ?? 0 },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0d121f] border border-slate-800 shadow-2xl overflow-hidden text-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                Hindi Dub Database Management
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Official verified catalog · Crunchyroll, Netflix, Prime Video, Anime Times, Muse India & Broadcast TV
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {authenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Hindi Dub Admin Dashboard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {!authenticated ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950/90 p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-amber-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Admin Access Required</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your ANIREAD Admin PIN to manage official Hindi dub records, resolve duplicates, create database backups, or export CSV/JSON datasets.
              </p>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Admin PIN
                </label>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter admin PIN (admin123)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-amber-500 focus:outline-none text-sm text-white"
                  autoFocus
                />
              </div>
              {authError && (
                <p className="text-xs text-rose-400 font-medium">{authError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Unlock Hindi Dub Admin Dashboard
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Inline Feedback Toast */}
            {actionMessage && (
              <div
                className={`px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                  actionMessage.type === 'ok'
                    ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-200'
                    : 'bg-rose-950/60 border-rose-700/60 text-rose-200'
                }`}
              >
                <span>{actionMessage.text}</span>
                <button onClick={() => setActionMessage(null)} className="p-0.5 hover:opacity-80 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-slate-400">Total Hindi</div>
                <div className="text-xl font-bold text-white tabular-nums mt-0.5">
                  {stats?.totalHindiDubbedAnime ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-emerald-400">Complete Dubs</div>
                <div className="text-xl font-bold text-emerald-300 tabular-nums mt-0.5">
                  {stats?.completeCount ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-amber-400">Partial Dubs</div>
                <div className="text-xl font-bold text-amber-300 tabular-nums mt-0.5">
                  {stats?.partialCount ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-sky-400">Announced</div>
                <div className="text-xl font-bold text-sky-300 tabular-nums mt-0.5">
                  {stats?.announcedCount ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-slate-400">TV Series</div>
                <div className="text-xl font-bold text-white tabular-nums mt-0.5">
                  {stats?.byType.TV ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-slate-400">Movies</div>
                <div className="text-xl font-bold text-white tabular-nums mt-0.5">
                  {stats?.byType.Movie ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-slate-400">OVAs & ONAs</div>
                <div className="text-xl font-bold text-white tabular-nums mt-0.5">
                  {stats?.byType.ovaAndOna ?? '—'}
                </div>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="text-[11px] text-slate-400">Last Verified</div>
                <div className="text-xs font-mono font-semibold text-indigo-300 tabular-nums mt-1.5">
                  {stats?.lastVerificationDate || '2026-11-14'}
                </div>
              </div>
            </div>

            {/* Platform-wise Breakdown Strip */}
            <div className="flex flex-wrap items-center gap-2">
              {platformBadgeMap.map((p) => {
                const isSelected = platformFilter === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setPlatformFilter(isSelected ? 'all' : p.key);
                      setActiveView('catalog');
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                        : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{p.label}</span>
                    <span className="font-mono font-bold tabular-nums text-amber-300">{p.count}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Tabs & Action Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveView('catalog')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeView === 'catalog'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  Catalog ({totalRecords})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('duplicates')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeView === 'duplicates'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Duplicates ({duplicates.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('audit')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    activeView === 'audit'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Migration & Audit</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditor()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Entry</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncDatabase}
                  disabled={busyAction === 'sync'}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${busyAction === 'sync' ? 'animate-spin' : ''}`} />
                  <span>Re-Sync DB</span>
                </button>
                <button
                  type="button"
                  onClick={handleCreateBackup}
                  disabled={busyAction === 'backup'}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Backup</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadExport('csv')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadExport('json')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* VIEW 1: CATALOG TABLE */}
            {activeView === 'catalog' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  <div className="relative lg:col-span-2">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQ}
                      onChange={(e) => {
                        setSearchQ(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search title, Japanese name, platform, notes..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <select
                    value={platformFilter}
                    onChange={(e) => {
                      setPlatformFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="all">All Platforms</option>
                    <option value="crunchyroll">Crunchyroll India</option>
                    <option value="netflix">Netflix India</option>
                    <option value="prime">Amazon Prime Video India</option>
                    <option value="anime_times">Anime Times India</option>
                    <option value="muse">Muse India</option>
                    <option value="other">Other Official Platforms</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                  >
                    <option value="all">All Dub Statuses</option>
                    <option value="complete">Complete</option>
                    <option value="partial">Partial</option>
                    <option value="announced">Announced</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <select
                      value={typeFilter}
                      onChange={(e) => {
                        setTypeFilter(e.target.value);
                        setPage(1);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="all">All Types</option>
                      <option value="TV">TV Series</option>
                      <option value="Movie">Movie</option>
                      <option value="ova_ona">OVA / ONA</option>
                      <option value="Special">Special</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setNeedsVerFilter(needsVerFilter === 'true' ? 'all' : 'true');
                        setPage(1);
                      }}
                      className={`px-2.5 py-2 rounded-lg border text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                        needsVerFilter === 'true'
                          ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Filter records flagged for manual verification"
                    >
                      Review ({stats?.needsVerificationCount ?? 0})
                    </button>
                  </div>
                </div>

                {/* Records Table */}
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className="py-3 px-3">Title & Source</th>
                          <th className="py-3 px-3">Type / Season</th>
                          <th className="py-3 px-3">Episodes</th>
                          <th className="py-3 px-3">Dub Status</th>
                          <th className="py-3 px-3">Platforms</th>
                          <th className="py-3 px-3">Verified</th>
                          <th className="py-3 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              Loading verified Hindi database records...
                            </td>
                          </tr>
                        ) : records.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400">
                              No Hindi dub entries match your current filter criteria.
                            </td>
                          </tr>
                        ) : (
                          records.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-900/50 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-2.5 min-w-[200px] max-w-[300px]">
                                  <div className="w-8 h-11 rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                    {rec.coverImage ? (
                                      <img
                                        src={rec.coverImage}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                      />
                                    ) : (
                                      <Layers className="w-4 h-4 text-slate-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-semibold text-white truncate">{rec.title}</div>
                                    <div className="text-[11px] text-slate-400 truncate">
                                      {rec.original_title || rec.englishTitle}
                                    </div>
                                    {rec.needs_verification && (
                                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium mt-0.5">
                                        <AlertTriangle className="w-3 h-3" />
                                        Needs re-check
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                                {rec.type}
                                {rec.season ? ` · S${rec.season}` : ''}
                                {rec.part ? ` Pt ${rec.part}` : ''}
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-300 whitespace-nowrap">
                                {rec.verified_episodes ?? '—'} / {rec.episodes ?? '—'}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                    rec.dub_status === 'Complete'
                                      ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                                      : rec.dub_status === 'Partial'
                                      ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                                      : 'bg-sky-950/60 border-sky-700/60 text-sky-300'
                                  }`}
                                >
                                  {rec.dub_status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 max-w-[220px]">
                                <div className="flex flex-wrap gap-1">
                                  {rec.platforms.map((pl) => (
                                    <span
                                      key={pl}
                                      className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                                    >
                                      {pl}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                                {rec.verification_date}
                              </td>
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1">
                                  {rec.source_urls?.[0] && (
                                    <a
                                      href={rec.source_urls[0]}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800"
                                      title="Open official source link"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleQuickVerify(rec, 'Complete')}
                                    disabled={busyAction === `verify_${rec.id}`}
                                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-950/60 cursor-pointer"
                                    title="Confirm Complete Hindi Dub today"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditor(rec)}
                                    className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                                    title="Edit entry"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {pendingDeleteId === rec.id ? (
                                    <div className="inline-flex items-center gap-1 ml-1">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteRecord(rec.id, rec.title)}
                                        className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                      >
                                        Confirm
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDeleteId(null)}
                                        className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-[10px] cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setPendingDeleteId(rec.id)}
                                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 cursor-pointer"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="tabular-nums">
                    Showing page {page} of {totalPages} ({totalRecords} matching Hindi records)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: DUPLICATE DETECTION & MERGE */}
            {activeView === 'duplicates' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Duplicate Detection Queue</h3>
                    <p className="text-xs text-slate-400">
                      Identifies overlapping titles across alternate romanizations or platform imports while keeping separate seasons intact.
                    </p>
                  </div>
                  {duplicates.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoMergeDuplicates}
                      disabled={busyAction === 'merge_all'}
                      className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                    >
                      Auto-Merge All Exact Matches
                    </button>
                  )}
                </div>

                {duplicates.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-10 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-sm font-semibold text-white">Zero duplicate collisions detected</p>
                    <p className="text-xs text-slate-400">
                      All {stats?.totalHindiDubbedAnime ?? 0} Hindi dub entries have distinct normalized keys per season, part, and format.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {duplicates.map((cand, i) => (
                      <div key={cand.key + i} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-amber-300">{cand.reason}</span>
                          {cand.records.length >= 2 && (
                            <button
                              type="button"
                              onClick={() => handleMergePair(cand.records[0].id, cand.records[1].id)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
                            >
                              Merge Into Primary
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                          {cand.records.map((r) => (
                            <div key={r.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-1">
                              <div className="font-bold text-white">{r.title}</div>
                              <div className="text-slate-400 font-mono">
                                {r.id} · {r.type} · {r.dub_status}
                              </div>
                              <div className="text-amber-300">{r.platforms.join(', ')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: MIGRATION REPORT & AUDIT */}
            {activeView === 'audit' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Rebuild & Verification Summary</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Total Unique Entries</div>
                      <div className="text-lg font-bold text-white tabular-nums">
                        {stats?.migrationSummary?.totalUniqueEntries ?? stats?.totalHindiDubbedAnime ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Newly Researched Additions</div>
                      <div className="text-lg font-bold text-emerald-300 tabular-nums">
                        {stats?.migrationSummary?.newlyAddedCount ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Removed Unverified Old Entries</div>
                      <div className="text-lg font-bold text-rose-300 tabular-nums">
                        {stats?.migrationSummary?.removedUnverifiedCount ?? stats?.removedUnverifiedEntries?.length ?? 0}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Requires Further Verification</div>
                      <div className="text-lg font-bold text-amber-300 tabular-nums">
                        {stats?.needsVerificationCount ?? stats?.migrationSummary?.requiresFurtherVerificationCount ?? 0}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-semibold text-slate-300 mb-2">
                      Removed Unverified / Fan-Claimed Hindi Records ({stats?.removedUnverifiedEntries?.length ?? 0})
                    </h4>
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {(stats?.removedUnverifiedEntries || []).map((rem, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                          <div className="font-semibold text-rose-300">{rem.title}</div>
                          {rem.reason && <div className="text-slate-400 mt-0.5">{rem.reason}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>Recent Admin & Sync Activity</span>
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                    {(stats?.recentAudits || []).map((log, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-indigo-300">{log.action}</span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-semibold text-white">{log.title}</div>
                        <div className="text-slate-400">{log.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Hindi Dub Modal Overlay */}
      {editingRecord && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3"
          onClick={() => setEditingRecord(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveRecord}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-700 p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingRecord.id ? `Edit: ${editingRecord.title}` : 'Add Verified Hindi Dub Entry'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Exact Anime Title *</label>
                <input
                  type="text"
                  required
                  value={editingRecord.title || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Original Title (JP / Romaji)</label>
                <input
                  type="text"
                  value={editingRecord.original_title || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, original_title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Type</label>
                <select
                  value={editingRecord.type || 'TV'}
                  onChange={(e) => setEditingRecord({ ...editingRecord, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="TV">TV</option>
                  <option value="Movie">Movie</option>
                  <option value="OVA">OVA</option>
                  <option value="ONA">ONA</option>
                  <option value="Special">Special</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Season #</label>
                  <input
                    type="number"
                    min={1}
                    value={editingRecord.season ?? ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        season: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Part / Cour</label>
                  <input
                    type="text"
                    value={editingRecord.part ?? ''}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, part: e.target.value || null })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Total Episodes</label>
                  <input
                    type="number"
                    min={0}
                    value={editingRecord.episodes ?? ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        episodes: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dubbed Episodes</label>
                  <input
                    type="number"
                    min={0}
                    value={editingRecord.verified_episodes ?? ''}
                    onChange={(e) =>
                      setEditingRecord({
                        ...editingRecord,
                        verified_episodes: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Dub Status</label>
                  <select
                    value={editingRecord.dub_status || 'Complete'}
                    onChange={(e) => setEditingRecord({ ...editingRecord, dub_status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Complete">Complete</option>
                    <option value="Partial">Partial</option>
                    <option value="Announced">Announced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Availability</label>
                  <select
                    value={editingRecord.availability_status || 'Available'}
                    onChange={(e) =>
                      setEditingRecord({ ...editingRecord, availability_status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="Available">Available</option>
                    <option value="Unavailable">Unavailable</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Platform quick-toggles + comma input */}
            <div>
              <label className="block text-slate-400 font-semibold mb-1.5">Official Platforms</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {KNOWN_PLATFORMS.map((pl) => {
                  const active = platformsText.toLowerCase().includes(pl.toLowerCase());
                  return (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => toggleFormPlatform(pl)}
                      className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${
                        active
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-300'
                      }`}
                    >
                      {pl}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                value={platformsText}
                onChange={(e) => setPlatformsText(e.target.value)}
                placeholder="Comma-separated platforms (e.g. Crunchyroll India, Netflix India)"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Official Sources (comma-separated)</label>
                <input
                  type="text"
                  value={sourcesText}
                  onChange={(e) => setSourcesText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Verification Date</label>
                <input
                  type="date"
                  value={editingRecord.verification_date || new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setEditingRecord({ ...editingRecord, verification_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Official Source URLs (one per line)</label>
              <textarea
                rows={2}
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">AniList ID</label>
                <input
                  type="number"
                  value={editingRecord.anilistId ?? ''}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      anilistId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">MAL ID</label>
                <input
                  type="number"
                  value={editingRecord.malId ?? ''}
                  onChange={(e) =>
                    setEditingRecord({
                      ...editingRecord,
                      malId: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Cover Poster URL</label>
                <input
                  type="text"
                  value={editingRecord.coverImage || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, coverImage: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Verification Notes</label>
              <textarea
                rows={2}
                value={editingRecord.notes || ''}
                onChange={(e) => setEditingRecord({ ...editingRecord, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
              />
            </div>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(editingRecord.needs_verification)}
                onChange={(e) =>
                  setEditingRecord({ ...editingRecord, needs_verification: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-900"
              />
              <span>Flag entry for further verification review</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyAction === 'save'}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer disabled:opacity-50"
              >
                {busyAction === 'save' ? 'Saving...' : 'Save Hindi Dub Entry'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
