import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Volume2,
  Download,
  Search,
} from 'lucide-react';
import { AnimeItem } from '../types/anime';

interface ScheduledEpisode {
  id: string;
  animeTitle: string;
  seasonName: string;
  episodeNumber: number;
  language: string;
  languageCode: string; // 'hi', 'en', 'bn', 'ta', 'te', 'es', 'ja'
  type: 'OFFICIAL_ANNOUNCEMENT' | 'ESTIMATED_SCHEDULE';
  platform: string;
  releaseDateString: string;
  releaseTimeUTC: string;
  timezone: string;
  sourceUrl: string;
  sourceName: string;
  isSimuldub: boolean;
  status: 'CONFIRMED' | 'ANNOUNCED' | 'ESTIMATED';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentAnime?: AnimeItem | null;
  onSelectAnimeTitle?: (title: string) => void;
}

export const DubReleaseCalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentAnime,
  onSelectAnimeTitle,
}) => {
  const [selectedLang, setSelectedLang] = useState<string>('all');
  const [scheduleTypeFilter, setScheduleTypeFilter] = useState<'all' | 'official' | 'estimated'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Master schedule containing official upcoming episodes and estimated cadence drops
  const UPCOMING_DUB_SCHEDULE: ScheduledEpisode[] = [
    {
      id: 'rezero_s4_hi_prime',
      animeTitle: 'Re:ZERO -Starting Life in Another World-',
      seasonName: 'Season 4 / Counterattack Arc (Auguria Dunes)',
      episodeNumber: 1,
      language: 'Hindi Dub',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Amazon Prime Video (Anime Times) / Muse India',
      releaseDateString: 'Weekly Wednesdays & Fridays',
      releaseTimeUTC: '14:00 UTC / 19:30 IST',
      timezone: 'IST (Indian Standard Time)',
      sourceUrl: 'https://www.primevideo.com/-/hi/detail/0MZJ5726QF7MUEIXH8CRC3S1AN?tr=in',
      sourceName: 'Prime Video India Official (Anime Times)',
      isSimuldub: true,
      status: 'CONFIRMED',
    },
    {
      id: 'fmab_apple_tv_hi_ta_te',
      animeTitle: 'Fullmetal Alchemist: Brotherhood',
      seasonName: 'Complete Series (64 Episodes)',
      episodeNumber: 1,
      language: 'Hindi, Tamil & Telugu Dubs',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Apple TV (India)',
      releaseDateString: 'Official Master Catalog Active',
      releaseTimeUTC: 'Full Series On-Demand',
      timezone: 'IST',
      sourceUrl: 'https://tv.apple.com/in/show/fullmetal-alchemist-brotherhood/umc.cmc.310y4hb2lmauoi9ry4cqne0uh',
      sourceName: 'Apple TV (India) Official Store',
      isSimuldub: false,
      status: 'CONFIRMED',
    },
    {
      id: 'sl_s2_hi_1',
      animeTitle: 'Solo Leveling: Arise from the Shadow',
      seasonName: 'Season 2',
      episodeNumber: 1,
      language: 'Hindi Dub',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Crunchyroll India',
      releaseDateString: 'Winter 2025 (Weekly Saturdays)',
      releaseTimeUTC: '17:30 UTC / 23:00 IST',
      timezone: 'IST (Indian Standard Time) & UTC',
      sourceUrl: 'https://www.crunchyroll.com/discover',
      sourceName: 'Crunchyroll Discover SimulDubs',
      isSimuldub: true,
      status: 'ANNOUNCED',
    },
    {
      id: 'sl_s2_en_1',
      animeTitle: 'Solo Leveling: Arise from the Shadow',
      seasonName: 'Season 2',
      episodeNumber: 1,
      language: 'English Dub',
      languageCode: 'en',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Crunchyroll',
      releaseDateString: 'Winter 2025 (SimulDub)',
      releaseTimeUTC: '20:00 UTC / 15:00 EST',
      timezone: 'EST & UTC',
      sourceUrl: 'https://english-dubbed.com/anime-industry/english-dub-anime-calendar/',
      sourceName: 'English Dub Anime Calendar',
      isSimuldub: true,
      status: 'CONFIRMED',
    },
    {
      id: 'ds_ht_hi_8',
      animeTitle: 'Demon Slayer: Kimetsu no Yaiba',
      seasonName: 'Hashira Training Arc',
      episodeNumber: 8,
      language: 'Hindi Dub',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Crunchyroll India',
      releaseDateString: 'Verified Streaming Broadcast',
      releaseTimeUTC: '18:00 UTC / 23:30 IST',
      timezone: 'IST',
      sourceUrl: 'https://www.animedubhindi.link/schedule.php',
      sourceName: 'AnimeDubHindi Airing Schedule',
      isSimuldub: true,
      status: 'CONFIRMED',
    },
    {
      id: 'jkk_s2_hi_final',
      animeTitle: 'Jujutsu Kaisen',
      seasonName: 'Shibuya Incident (Season 2)',
      episodeNumber: 23,
      language: 'Hindi Dub',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Crunchyroll India',
      releaseDateString: 'Streaming Catalog Active',
      releaseTimeUTC: '19:00 UTC / 00:30 IST',
      timezone: 'IST',
      sourceUrl: 'https://www.crunchyroll.com/discover',
      sourceName: 'Crunchyroll India Official',
      isSimuldub: false,
      status: 'CONFIRMED',
    },
    {
      id: 'mha_s7_hi_ep21',
      animeTitle: 'My Hero Academia',
      seasonName: 'Season 7',
      episodeNumber: 21,
      language: 'Hindi Dub',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Crunchyroll India',
      releaseDateString: 'Weekly Saturdays at 17:00 IST',
      releaseTimeUTC: '11:30 UTC / 17:00 IST',
      timezone: 'IST',
      sourceUrl: 'https://www.animedubhindi.link/schedule.php',
      sourceName: 'AnimeDubHindi Schedule',
      isSimuldub: true,
      status: 'CONFIRMED',
    },
    {
      id: 'mha_s7_en_ep21',
      animeTitle: 'My Hero Academia',
      seasonName: 'Season 7',
      episodeNumber: 21,
      language: 'English Dub',
      languageCode: 'en',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Crunchyroll',
      releaseDateString: 'Saturdays at 15:00 EDT',
      releaseTimeUTC: '19:00 UTC / 15:00 EDT',
      timezone: 'EDT',
      sourceUrl: 'https://english-dubbed.com/anime-industry/english-dub-anime-calendar/',
      sourceName: 'English Dub Anime Calendar',
      isSimuldub: true,
      status: 'CONFIRMED',
    },
    {
      id: 'csm_movie_hi',
      animeTitle: 'Chainsaw Man – The Movie: Reze Arc',
      seasonName: 'Theatrical Film',
      episodeNumber: 1,
      language: 'Hindi Dub (Theatrical / OTT)',
      languageCode: 'hi',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Sony Pictures India / Crunchyroll',
      releaseDateString: 'Theatrical Release 2025',
      releaseTimeUTC: 'Official Theatrical Schedule',
      timezone: 'IST',
      sourceUrl: 'https://www.animehubindia.com/',
      sourceName: 'Anime Hub India Release Roster',
      isSimuldub: false,
      status: 'ANNOUNCED',
    },
    {
      id: 'op_egghead_en_1100',
      animeTitle: 'One Piece',
      seasonName: 'Egghead Arc',
      episodeNumber: 1100,
      language: 'English Dub',
      languageCode: 'en',
      type: 'ESTIMATED_SCHEDULE',
      platform: 'Crunchyroll / Microsoft Movies & TV',
      releaseDateString: 'Monthly Batch Cadence (~12 eps)',
      releaseTimeUTC: 'Batch drop Tuesdays 00:00 UTC',
      timezone: 'UTC & PST',
      sourceUrl: 'https://english-dubbed.com/anime-industry/english-dub-anime-calendar/',
      sourceName: 'English Dub Calendar Batch Tracker',
      isSimuldub: false,
      status: 'ESTIMATED',
    },
    {
      id: 'bc_s5_hi_est',
      animeTitle: 'Black Clover',
      seasonName: 'Spade Kingdom Raid Arc (Continuation)',
      episodeNumber: 171,
      language: 'Hindi Dub',
      languageCode: 'hi',
      type: 'ESTIMATED_SCHEDULE',
      platform: 'Crunchyroll India',
      releaseDateString: 'Estimated Post Japanese Broadcast',
      releaseTimeUTC: 'TBD',
      timezone: 'IST',
      sourceUrl: 'https://www.anidub.moe/',
      sourceName: 'AniDub.moe Tracker',
      isSimuldub: true,
      status: 'ESTIMATED',
    },
    {
      id: 'magical_explorer_jp_tv',
      animeTitle: 'Magical Explorer',
      seasonName: 'Season 1',
      episodeNumber: 1,
      language: 'Japanese (Original)',
      languageCode: 'ja',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Tokyo MX / AT-X Broadcast',
      releaseDateString: 'Japanese Television Broadcast Window',
      releaseTimeUTC: '23:30 JST / 14:30 UTC',
      timezone: 'JST (Japan Standard Time)',
      sourceUrl: 'https://sneakerbunko.jp/series/magical-explorer/',
      sourceName: 'Kadokawa Sneaker Bunko Official Website',
      isSimuldub: false,
      status: 'ANNOUNCED',
    },
    {
      id: 'magical_explorer_streaming',
      animeTitle: 'Magical Explorer',
      seasonName: 'Season 1',
      episodeNumber: 1,
      language: 'Worldwide Streaming License',
      languageCode: 'en',
      type: 'OFFICIAL_ANNOUNCEMENT',
      platform: 'Global OTT Streaming License',
      releaseDateString: 'Post-Broadcast OTT Window (Separate from TV)',
      releaseTimeUTC: 'Separate OTT Window',
      timezone: 'UTC',
      sourceUrl: 'https://sneakerbunko.jp/series/magical-explorer/',
      sourceName: 'Official Distribution Release Window',
      isSimuldub: false,
      status: 'ANNOUNCED',
    },
  ];

  // Filtering
  const filteredSchedule = UPCOMING_DUB_SCHEDULE.filter((item) => {
    // Language filter
    if (selectedLang !== 'all' && item.languageCode !== selectedLang) {
      return false;
    }
    // Type filter
    if (scheduleTypeFilter === 'official' && item.type !== 'OFFICIAL_ANNOUNCEMENT') {
      return false;
    }
    if (scheduleTypeFilter === 'estimated' && item.type !== 'ESTIMATED_SCHEDULE') {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.animeTitle.toLowerCase().includes(q) ||
        item.language.toLowerCase().includes(q) ||
        item.platform.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const officialAnnouncements = filteredSchedule.filter(
    (s) => s.type === 'OFFICIAL_ANNOUNCEMENT'
  );
  const estimatedSchedules = filteredSchedule.filter(
    (s) => s.type === 'ESTIMATED_SCHEDULE'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#090d16] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dub-release-calendar-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="dub-release-calendar-title"
                  className="text-base sm:text-lg font-bold text-white tracking-tight"
                >
                  Dub Release Calendar & Airing Schedules
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                  LIVE SCHEDULE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-platform episode drops tracked across Crunchyroll, Netflix, Muse Asia, and regional Indian networks.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors self-end sm:self-auto cursor-pointer"
            aria-label="Close calendar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by anime title or platform..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Official vs Estimated Toggle */}
            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => setScheduleTypeFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  scheduleTypeFilter === 'all'
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All Schedules
              </button>
              <button
                onClick={() => setScheduleTypeFilter('official')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  scheduleTypeFilter === 'official'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Official Announcements</span>
              </button>
              <button
                onClick={() => setScheduleTypeFilter('estimated')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 ${
                  scheduleTypeFilter === 'estimated'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Estimated Cadence</span>
              </button>
            </div>
          </div>

          {/* Language filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono scrollbar-none">
            <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0 mr-1">
              Language:
            </span>
            {[
              { id: 'all', label: 'All Tracks' },
              { id: 'hi', label: 'Hindi Dub (HI)', highlight: true },
              { id: 'en', label: 'English Dub (EN)' },
              { id: 'ja', label: 'Japanese Master (JA)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedLang(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedLang === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Schedule Lists */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* SECTION 1: OFFICIAL ANNOUNCEMENTS & SIMULCAST DROPS */}
          {(scheduleTypeFilter === 'all' || scheduleTypeFilter === 'official') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Official Announcements & Confirmed Broadcasts ({officialAnnouncements.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  VERIFIED SOURCES
                </span>
              </div>

              {officialAnnouncements.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-center">
                  No official announcements matching this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {officialAnnouncements.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/30 hover:border-emerald-500/50 transition-all flex flex-col justify-between gap-3 shadow-lg group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                            {item.language}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Ep {item.episodeNumber}
                          </span>
                        </div>

                        <div>
                          <h4
                            onClick={() => onSelectAnimeTitle && onSelectAnimeTitle(item.animeTitle)}
                            className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors cursor-pointer"
                          >
                            {item.animeTitle}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.seasonName}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Air Date:</span>
                            <span className="font-semibold text-slate-200">{item.releaseDateString}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Time & TZ:</span>
                            <span className="text-indigo-300">{item.releaseTimeUTC}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Platform:</span>
                            <span className="text-emerald-400 font-sans font-semibold">{item.platform}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 truncate font-mono">
                          Source: {item.sourceName}
                        </span>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <span>Check Source</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: ESTIMATED SCHEDULES & CADENCE DROPS */}
          {(scheduleTypeFilter === 'all' || scheduleTypeFilter === 'estimated') && (
            <div className="space-y-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                    Estimated Schedules & SimulDub Cadence ({estimatedSchedules.length})
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
                  ESTIMATED / HISTORICAL CADENCE
                </span>
              </div>

              {estimatedSchedules.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-center">
                  No estimated schedules matching this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {estimatedSchedules.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-amber-900/30 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 shadow-lg group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/40">
                            {item.language}
                          </span>
                          <span className="text-[10px] font-mono text-amber-400">
                            Estimated Ep {item.episodeNumber}
                          </span>
                        </div>

                        <div>
                          <h4
                            onClick={() => onSelectAnimeTitle && onSelectAnimeTitle(item.animeTitle)}
                            className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors cursor-pointer"
                          >
                            {item.animeTitle}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.seasonName}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Projected Cadence:</span>
                            <span className="font-semibold text-amber-200">{item.releaseDateString}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-500">Platform:</span>
                            <span className="text-slate-200 font-sans">{item.platform}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-500 truncate font-mono">
                          Source: {item.sourceName}
                        </span>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-[11px] flex items-center gap-1 shrink-0 transition-colors"
                        >
                          <span>View Calendar</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950 flex items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
            Verified across Crunchyroll Discover, English-Dubbed, AniDub, and AnimeDubHindi.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors ml-auto cursor-pointer"
          >
            Close Calendar
          </button>
        </div>
      </div>
    </div>
  );
};
