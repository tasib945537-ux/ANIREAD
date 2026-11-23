import React, { useState, useMemo } from 'react';
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  Tv,
  Layers,
  Lock,
  Edit3,
  Check,
  Plus,
  Trash2,
  Sparkles,
  Info,
} from 'lucide-react';
import { AnimeItem, AudioTrack, AudioVerificationState, DubTypeCategory, PlatformDistributorType } from '../../types/anime';
import {
  getAnimeAudioAvailability,
  isAdminAuthenticated,
  adminLogin,
  adminLogout,
  saveAdminOverride,
  markOverrideExpired,
  getAllAdminOverrides,
} from '../../services/dubVerificationStorage';
import { saveAdminHindiOverrideToCloud } from '../../services/firestoreSync';

interface Props {
  anime: AnimeItem;
  onOpenCalendar?: () => void;
}

export const AnimeAudioAvailabilitySection: React.FC<Props> = ({ anime, onOpenCalendar }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAdmin, setIsAdmin] = useState(() => isAdminAuthenticated());
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState(false);
  const [activeTab, setActiveTab] = useState<'table' | 'episodes' | 'platforms'>('table');

  // Form state for Admin Editing
  const [selectedLang, setSelectedLang] = useState<'Hindi' | 'English' | 'Bangla' | 'Japanese'>('Hindi');
  const [formStatus, setFormStatus] = useState<AudioVerificationState>('Verified');
  const [formDubType, setFormDubType] = useState<DubTypeCategory>('Official');
  const [formDubbedCount, setFormDubbedCount] = useState<number>(anime.episodes || 12);
  const [formPlatform, setFormPlatform] = useState<string>('Crunchyroll India');
  const [formDistributor, setFormDistributor] = useState<string>('Crunchyroll India');
  const [formDistributorType, setFormDistributorType] = useState<PlatformDistributorType>('Official dub distributor');
  const [formSourceUrl, setFormSourceUrl] = useState<string>('https://www.crunchyroll.com');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formReleaseDate, setFormReleaseDate] = useState<string>('2024–2026');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const availabilityData = useMemo(() => getAnimeAudioAvailability(anime), [anime, refreshKey]);
  const totalEpisodes = availabilityData.totalEpisodes;
  const hiTrack = availabilityData.tracks.find((t) => t.languageCode === 'hi');
  const bnTrack = availabilityData.tracks.find((t) => t.languageCode === 'bn');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLogin(adminPinInput)) {
      setIsAdmin(true);
      setShowAdminLoginModal(false);
      setAdminPinInput('');
      setAdminPinError(false);
      setShowAdminEditModal(true);
    } else {
      setAdminPinError(true);
    }
  };

  const handleSaveAdminDub = (e: React.FormEvent) => {
    e.preventDefault();
    let langCode = 'hi';
    if (selectedLang === 'English') langCode = 'en';
    else if (selectedLang === 'Bangla') langCode = 'bn';
    else if (selectedLang === 'Japanese') langCode = 'ja';

    saveAdminOverride({
      id: `admin_override_${anime.id}_${langCode}_${Date.now()}`,
      animeId: anime.id,
      animeTitle: anime.title,
      language: selectedLang,
      languageCode: langCode,
      status: formStatus,
      dubType: formDubType,
      dubbedEpisodes: Number(formDubbedCount) || 0,
      totalEpisodes,
      episodeRange: formDubbedCount > 0 ? `Episodes 1–${formDubbedCount}` : 'None',
      platform: formPlatform,
      distributor: formDistributor,
      distributorType: formDistributorType,
      sourceUrl: formSourceUrl,
      verifiedAt: 'November 2026',
      releaseDate: formReleaseDate,
      notes: formNotes,
    });

    if (langCode === 'hi') {
      const dubStatus: 'Complete' | 'Partial' | 'Announced' =
        formStatus === 'Unverified'
          ? 'Announced'
          : (Number(formDubbedCount) || 0) < totalEpisodes
          ? 'Partial'
          : 'Complete';
      void saveAdminHindiOverrideToCloud({
        animeId: anime.id,
        title: anime.title,
        dubStatus,
        platforms: formPlatform.split(/[\/,]+/).map((s) => s.trim()).filter(Boolean),
        hindiEpisodeCount: Number(formDubbedCount) || 0,
        sourceUrl: formSourceUrl,
        notes: formNotes,
      }).catch(() => {});
    }

    setRefreshKey((k) => k + 1);
    setShowAdminEditModal(false);
    setAdminToast(`Successfully updated ${selectedLang} audio details!`);
    setTimeout(() => setAdminToast(null), 3500);
  };

  const getStatusBadge = (status: AudioVerificationState) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified Available
          </span>
        );
      case 'Unverified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-[11px] font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Unverified / In Progress
          </span>
        );
      case 'Unavailable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono text-[11px] font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            Unavailable / Sub Only
          </span>
        );
      case 'Unknown':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 font-mono text-[11px] font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            Unknown
          </span>
        );
    }
  };

  return (
    <div key={refreshKey} className="space-y-4 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-xl">
      {/* Header with Title & Admin Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Audio Availability & Dub Verification</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono">
                  Strict Evidence Audit
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact multi-source audio tracks and episode-level dub coverage for {anime.title}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-700/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dub Calendar</span>
            </button>
          )}

          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowAdminEditModal(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Admin Manage Dubs</span>
              </button>
              <button
                onClick={() => {
                  adminLogout();
                  setIsAdmin(false);
                }}
                className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium cursor-pointer"
                title="Log out of Admin"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminLoginModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Admin Verification Login"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Admin Verify</span>
            </button>
          )}
        </div>
      </div>

      {adminToast && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{adminToast}</span>
        </div>
      )}

      {/* Navigation View Switcher (Table / Episodes / Platforms) */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('table')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'table'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Audio Availability Table</span>
        </button>

        <button
          onClick={() => setActiveTab('episodes')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'episodes'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Episode-Level Dub Tracking</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
            {availabilityData.summary.hindiDubbedCount}/{totalEpisodes} HI
          </span>
        </button>

        <button
          onClick={() => setActiveTab('platforms')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'platforms'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Verified Platforms & Distro</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. AUDIO AVAILABILITY TABLE (Requirement 2)                    */}
      {/* ============================================================== */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Hindi Simulcast / Release Timing Banner (when available) */}
          {hiTrack && (hiTrack.airTime || hiTrack.simulcastSchedule || hiTrack.broadcastTiming) && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-950 to-indigo-950/50 border border-amber-500/40 space-y-1.5 shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hindi Dub Simulcast & Broadcast Timing</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {hiTrack.timeZone || 'IST (Indian Standard Time)'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {hiTrack.airTime && (
                  <span className="text-amber-200 font-bold">{hiTrack.airTime}</span>
                )}
                {hiTrack.simulcastSchedule && (
                  <span className="text-indigo-200 font-medium">{hiTrack.simulcastSchedule}</span>
                )}
              </div>
              {hiTrack.broadcastTiming && (
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {hiTrack.broadcastTiming}
                </p>
              )}
              {hiTrack.nextEpisodeAirDate && (
                <p className="text-[11px] font-mono text-emerald-300 font-semibold">
                  Next Drop: {hiTrack.nextEpisodeAirDate}
                </p>
              )}
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/90 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                  <th className="py-3 px-4 font-bold">Language</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                  <th className="py-3 px-4 font-bold">Episodes Dubbed</th>
                  <th className="py-3 px-4 font-bold">Dub Type</th>
                  <th className="py-3 px-4 font-bold">Official Provider / Platform</th>
                  <th className="py-3 px-4 font-bold text-right">Evidence Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-sans">
                {availabilityData.tracks.map((track) => {
                  const isHindi = track.languageCode === 'hi';
                  const isBangla = track.languageCode === 'bn';
                  const isEnglish = track.languageCode === 'en';
                  const isJapanese = track.languageCode === 'ja';

                  return (
                    <tr
                      key={track.id}
                      className={`hover:bg-slate-850 transition-colors ${
                        isHindi && track.verificationStatus === 'Verified' ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            track.verificationStatus === 'Verified'
                              ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                              : track.verificationStatus === 'Unverified'
                              ? 'bg-amber-400'
                              : 'bg-slate-600'
                          }`}
                        />
                        <span className="text-sm font-semibold">{track.language}</span>
                        {isJapanese && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                            Master
                          </span>
                        )}
                        {isHindi && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                            हिन्दी
                          </span>
                        )}
                        {isBangla && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                            বাংলা
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(track.verificationStatus)}</td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <strong
                            className={`text-sm ${
                              track.verificationStatus === 'Verified' ? 'text-white' : 'text-slate-400'
                            }`}
                          >
                            {track.dubbedEpisodes} / {track.totalEpisodes}
                          </strong>
                          <span className="text-[11px] text-slate-400">
                            ({track.episodeRange || 'None'})
                          </span>
                        </div>
                        {track.missingEpisodes > 0 && track.verificationStatus === 'Verified' && (
                          <span className="text-[10px] text-amber-400/90 block">
                            {track.missingEpisodes} episodes pending dub
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-slate-200 font-medium">{track.dubType}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">
                          {track.releaseDate || 'Catalog'}
                        </span>
                        {track.airTime && (
                          <span className="text-[10px] text-amber-300/90 block font-mono mt-0.5">
                            {track.airTime}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Tv className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px] font-medium">{track.provider}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          Verified: {track.verifiedAt}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={track.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-300 hover:text-white transition-colors text-[11px] font-bold"
                        >
                          <span>Verify</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Deep Audio Notes & Transparency Guarantee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Anti-Fake Data Constitution
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                AniRead separates metadata from dub verification. Unconfirmed dubs remain explicitly{' '}
                <strong className="text-slate-200">Unknown</strong> or{' '}
                <strong className="text-slate-200">Unavailable / Sub Only</strong> until verified by official
                distributor press releases, licensor streaming catalogs, or accredited voice rosters.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-mono text-[10px] text-indigo-400 uppercase font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Missing Episodes Transparency
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                We never assume all episodes are dubbed just because one episode exists. Ongoing simul-dubs log exact
                episode counts so you know precisely how many episodes can be watched in your preferred audio track.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. EPISODE-LEVEL DUB TRACKING (Requirement 3)                  */}
      {/* ============================================================== */}
      {activeTab === 'episodes' && (
        <div className="space-y-4">
          {/* Summary Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                Japanese Original
              </span>
              <span className="text-lg font-bold text-rose-300 font-mono">
                {availabilityData.summary.japaneseCount} / {totalEpisodes}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium block">100% Available</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                Hindi Dubbed
              </span>
              <span className="text-lg font-bold text-amber-300 font-mono">
                {availabilityData.summary.hindiDubbedCount} / {totalEpisodes}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {availabilityData.summary.hindiDubbedCount > 0
                  ? `${Math.round((availabilityData.summary.hindiDubbedCount / totalEpisodes) * 100)}% Coverage`
                  : '0% (Subtitles Only)'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                English Dubbed
              </span>
              <span className="text-lg font-bold text-sky-300 font-mono">
                {availabilityData.summary.englishDubbedCount} / {totalEpisodes}
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                {availabilityData.summary.englishDubbedCount > 0
                  ? `${Math.round((availabilityData.summary.englishDubbedCount / totalEpisodes) * 100)}% Coverage`
                  : '0% (Subtitles Only)'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                Bangla Dubbed
              </span>
              <span className={`text-lg font-bold font-mono ${availabilityData.summary.banglaDubbedCount > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                {availabilityData.summary.banglaDubbedCount} / {totalEpisodes}
              </span>
              <span className={`text-[10px] block font-medium ${availabilityData.summary.banglaDubbedCount > 0 ? 'text-emerald-400' : bnTrack?.verificationStatus === 'Unknown' ? 'text-slate-500' : 'text-rose-400/90'}`}>
                {availabilityData.summary.banglaDubbedCount > 0
                  ? `${Math.round((availabilityData.summary.banglaDubbedCount / totalEpisodes) * 100)}% Coverage (Muse India)`
                  : bnTrack?.verificationStatus === 'Unknown'
                  ? 'Unknown / Unverified'
                  : 'Subtitles on Muse Asia'}
              </span>
            </div>
          </div>

          {/* Episode Grid Matrix */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/70">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                Episode Audio Matrix (Ep 1 to {availabilityData.episodeMatrix.length}):
              </span>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Check className="w-3 h-3 text-emerald-400" /> Available
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <XCircle className="w-3 h-3 text-rose-400" /> Unavailable
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <HelpCircle className="w-3 h-3 text-slate-500" /> Unknown
                </span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin">
              {availabilityData.episodeMatrix.map((row) => (
                <div
                  key={row.episodeNumber}
                  className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-900/60 transition-colors"
                >
                  <div className="font-mono font-bold text-white w-24">
                    Episode {row.episodeNumber}
                  </div>

                  <div className="flex items-center gap-4 sm:gap-8 font-mono text-[11px]">
                    {/* Japanese */}
                    <div className="flex items-center gap-1.5" title="Japanese Original Audio">
                      <span className="text-slate-400">JP:</span>
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>

                    {/* Hindi */}
                    <div className="flex items-center gap-1.5" title="Hindi Dubbed Audio">
                      <span className="text-slate-400">HI:</span>
                      {row.hindi === true ? (
                        <Check className="w-4 h-4 text-emerald-400 font-bold" />
                      ) : row.hindi === false ? (
                        <XCircle className="w-4 h-4 text-rose-400/80" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    {/* English */}
                    <div className="flex items-center gap-1.5" title="English Dubbed Audio">
                      <span className="text-slate-400">EN:</span>
                      {row.english === true ? (
                        <Check className="w-4 h-4 text-emerald-400 font-bold" />
                      ) : row.english === false ? (
                        <XCircle className="w-4 h-4 text-rose-400/80" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    {/* Bangla */}
                    <div className="flex items-center gap-1.5" title="Bangla Dubbed Audio">
                      <span className="text-slate-400">BN:</span>
                      {row.bangla === true ? (
                        <Check className="w-4 h-4 text-emerald-400 font-bold" />
                      ) : row.bangla === false ? (
                        <XCircle className="w-4 h-4 text-rose-400/80" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. VERIFIED PLATFORMS & DISTRIBUTOR (Requirement 6)            */}
      {/* ============================================================== */}
      {activeTab === 'platforms' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Clearly distinguishing official streaming platforms, regional dub distributors, and original broadcasters:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {availabilityData.platforms.map((plat) => (
              <div
                key={plat.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-indigo-400" />
                      {plat.platform}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {plat.language} Verified
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-300 font-medium block mt-1">
                    Role: {plat.distributorType}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    Verified Date: {plat.verifiedAt}
                  </span>
                </div>

                <a
                  href={plat.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pt-2 border-t border-slate-800/80 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center justify-between font-bold"
                >
                  <span>Open Official Platform Page</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN LOGIN MODAL (Protected by PIN)                           */}
      {/* ============================================================== */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-2xl text-slate-200">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Admin Dub Verification Login</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Enter admin passkey (Default: <code className="text-amber-300 font-mono font-bold">admin123</code>) to edit audio tracks and episode counts.
            </p>

            <form onSubmit={handleAdminLogin} className="space-y-3 mt-4">
              <div>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminPinError(false);
                  }}
                  placeholder="Enter admin passkey"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                {adminPinError && (
                  <span className="text-[11px] text-rose-400 mt-1 block">
                    Incorrect passkey. Please try again.
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLoginModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADMIN EDIT / ADD DUB MODAL (Requirement 8)                      */}
      {/* ============================================================== */}
      {showAdminEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                  <span>Admin Dub Manager: {anime.title}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update verified dub status, platform, episode counts, and distributor evidence.
                </p>
              </div>
              <button
                onClick={() => setShowAdminEditModal(false)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdminDub} className="space-y-3.5 mt-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Language:
                  </label>
                  <select
                    value={selectedLang}
                    onChange={(e) => setSelectedLang(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="English">English</option>
                    <option value="Bangla">Bangla (বাংলা)</option>
                    <option value="Japanese">Japanese (Original)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Verification Status:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
                  >
                    <option value="Verified">Verified Available (Green)</option>
                    <option value="Unverified">Unverified / In Progress (Yellow)</option>
                    <option value="Unavailable">Unavailable / Sub Only (Red/Grey)</option>
                    <option value="Unknown">Unknown (Grey)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Dubbed Episodes Count:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={totalEpisodes}
                    value={formDubbedCount}
                    onChange={(e) => setFormDubbedCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Total Season Episodes: {totalEpisodes}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Dub Type Category:
                  </label>
                  <select
                    value={formDubType}
                    onChange={(e) => setFormDubType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
                  >
                    <option value="Official">Official</option>
                    <option value="Licensed">Licensed</option>
                    <option value="Original">Original</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Official Platform:
                </label>
                <input
                  type="text"
                  value={formPlatform}
                  onChange={(e) => setFormPlatform(e.target.value)}
                  placeholder="e.g. Crunchyroll India, Netflix, Muse Asia"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Distributor:
                  </label>
                  <input
                    type="text"
                    value={formDistributor}
                    onChange={(e) => setFormDistributor(e.target.value)}
                    placeholder="e.g. Crunchyroll India"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Distributor Role:
                  </label>
                  <select
                    value={formDistributorType}
                    onChange={(e) => setFormDistributorType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white cursor-pointer"
                  >
                    <option value="Official dub distributor">Official dub distributor</option>
                    <option value="Official streaming platform">Official streaming platform</option>
                    <option value="Original broadcaster">Original broadcaster</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Source / Verification URL:
                </label>
                <input
                  type="url"
                  value={formSourceUrl}
                  onChange={(e) => setFormSourceUrl(e.target.value)}
                  placeholder="https://www.crunchyroll.com/series/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Verification Notes:
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Official announcement details or voice cast credits..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAdminEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold transition-all shadow-md cursor-pointer"
                >
                  Save Verified Dub Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
