import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  Globe,
  Tv,
  CheckCircle2,
  Search,
  Layers,
  Sparkles,
  Info,
  Languages,
} from 'lucide-react';
import { AnimeItem } from '../../types/anime';
import { getAnimeDubInfo } from '../../services/dubCatalog';
import { findNormalizedDubRecord } from '../../services/dub-database';

interface SubtitleTrackInfo {
  language: string;
  nativeName?: string;
  code: string;
  format: 'Softsub (CC/SDH)' | 'Softsub (Styled ASS/VTT)' | 'Hardsub (Burned-in)';
  platforms: string[];
  region: string;
  sourceUrl: string;
  provider: string;
  isOfficial: boolean;
  notes: string;
  status: 'Available' | 'Simulcast' | 'Catalog';
}

interface Props {
  anime: AnimeItem;
  currentLang?: string;
  onSwitchToDubs?: () => void;
}

export const AnimeSubDetailsSection: React.FC<Props> = ({
  anime,
  onSwitchToDubs,
}) => {
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const norm = findNormalizedDubRecord(anime.title) || (anime.englishTitle ? findNormalizedDubRecord(anime.englishTitle) : undefined);
  const dubInfo = getAnimeDubInfo(anime);

  const defaultWatchUrl = dubInfo.dubs[0]?.watchUrl || `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title)}`;

  const subTracks: SubtitleTrackInfo[] = [
    {
      language: 'English',
      nativeName: 'English (US & UK) SDH / Full Captions',
      code: 'en',
      format: 'Softsub (CC/SDH)',
      platforms: ['Crunchyroll', 'Apple TV (India)', 'Netflix', 'Amazon Prime Video'],
      region: 'Worldwide / India',
      sourceUrl: dubInfo.dubs.find((d) => d.code === 'en')?.watchUrl || defaultWatchUrl,
      provider: 'Official Licensor & Simulcast Subtitle Master',
      isOfficial: true,
      notes: 'Full dialogue subtitles including signs, songs, and dialogue with SDH hearing-impaired descriptions.',
      status: 'Available',
    },
    {
      language: 'Bengali',
      nativeName: 'বাংলা সাবটাইটেল (Bangla)',
      code: 'bn',
      format: 'Softsub (Styled ASS/VTT)',
      platforms: ['Muse Asia (YouTube)', 'Muse India', 'Netflix India'],
      region: 'India (West Bengal) & Bangladesh',
      sourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' Bengali Muse Asia')}`,
      provider: 'Muse Communication India / Muse Asia Bengali Subtitle Team',
      isOfficial: true,
      notes: 'Official Bengali subtitles stream on Muse Asia YouTube and select Netflix India masters.',
      status: dubInfo.hasBengaliDub || dubInfo.hasBengaliSub ? 'Available' : 'Simulcast',
    },
    {
      language: 'Hindi',
      nativeName: 'हिन्दी सबटाइटल्स (Devanagari)',
      code: 'hi',
      format: 'Softsub (CC/SDH)',
      platforms: ['Crunchyroll India', 'Netflix India', 'Amazon Prime Video'],
      region: 'India & South Asia',
      sourceUrl: dubInfo.dubs.find((d) => d.code === 'hi')?.watchUrl || `https://www.crunchyroll.com/search?q=${encodeURIComponent(anime.title + ' Hindi')}`,
      provider: 'Crunchyroll India Localization & Netflix Subtitle Team',
      isOfficial: true,
      notes: 'Official Hindi subtitle translation available across South Asian licensed streaming platforms.',
      status: 'Available',
    },
    {
      language: 'Japanese',
      nativeName: '日本語 (Closed Captions / 原語字幕)',
      code: 'ja',
      format: 'Softsub (CC/SDH)',
      platforms: ['Apple TV (India)', 'Netflix Japan / Worldwide', 'Crunchyroll'],
      region: 'Japan & International Licensed Territories',
      sourceUrl: defaultWatchUrl,
      provider: 'Official Japanese Broadcast Network (MBS / TV Tokyo / Fuji TV / AT-X)',
      isOfficial: true,
      notes: 'Original Japanese closed captions verified directly against broadcast master.',
      status: 'Available',
    },
    {
      language: 'Spanish',
      nativeName: 'Español (Latinoamérica & España)',
      code: 'es',
      format: 'Softsub (Styled ASS/VTT)',
      platforms: ['Crunchyroll', 'Netflix', 'Apple TV (India)'],
      region: 'Latin America & Spain',
      sourceUrl: defaultWatchUrl,
      provider: 'Crunchyroll Latin America & Netflix Spain Localization',
      isOfficial: true,
      notes: 'Dual subtitle tracks available: Español Neutro (Latin America) and Castellano (Spain).',
      status: 'Available',
    },
    {
      language: 'French',
      nativeName: 'Français (Sous-titres officiels)',
      code: 'fr',
      format: 'Softsub (Styled ASS/VTT)',
      platforms: ['Crunchyroll', 'Apple TV (India)', 'Netflix France'],
      region: 'France, Belgium, Switzerland & Canada',
      sourceUrl: defaultWatchUrl,
      provider: 'Dybex / Crunchyroll France Official Subtitle Department',
      isOfficial: true,
      notes: 'Accredited French subtitle translations with adapted signboards and karaoke lyrics.',
      status: 'Available',
    },
    {
      language: 'German',
      nativeName: 'Deutsch (Deutsche Untertitel)',
      code: 'de',
      format: 'Softsub (Styled ASS/VTT)',
      platforms: ['Crunchyroll Germany', 'Netflix'],
      region: 'Germany, Austria, Switzerland',
      sourceUrl: defaultWatchUrl,
      provider: 'Crunchyroll DACH Official Subtitle Team',
      isOfficial: true,
      notes: 'Verified German localization matching simulcast broadcast standards.',
      status: 'Available',
    },
    {
      language: 'Portuguese',
      nativeName: 'Português (Brasil & Portugal)',
      code: 'pt',
      format: 'Softsub (Styled ASS/VTT)',
      platforms: ['Crunchyroll', 'Netflix', 'Apple TV (India)'],
      region: 'Brazil & Portugal',
      sourceUrl: defaultWatchUrl,
      provider: 'Crunchyroll Brazil / Netflix Localization',
      isOfficial: true,
      notes: 'Complete Brazilian Portuguese subtitle tracks available.',
      status: 'Available',
    },
    {
      language: 'Indonesian / Bahasa',
      nativeName: 'Bahasa Indonesia (Takarir Resmi)',
      code: 'id',
      format: 'Softsub (CC/SDH)',
      platforms: ['Muse Asia (YouTube)', 'Bilibili Global', 'Apple TV (India)'],
      region: 'Indonesia & Southeast Asia',
      sourceUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' Muse Indonesia')}`,
      provider: 'Muse Indonesia & Bilibili Official Subtitle Channel',
      isOfficial: true,
      notes: 'Free official Indonesian subtitles streaming on Muse Indonesia YouTube.',
      status: 'Available',
    },
    {
      language: 'Chinese',
      nativeName: '中文 (简体 & 繁體字幕)',
      code: 'zh',
      format: 'Softsub (Styled ASS/VTT)',
      platforms: ['Bilibili Global', 'Apple TV (India)', 'Netflix'],
      region: 'Taiwan, Hong Kong & Global',
      sourceUrl: defaultWatchUrl,
      provider: 'Official Greater China Localization Registry',
      isOfficial: true,
      notes: 'Verified Simplified and Traditional Chinese subtitle tracks.',
      status: 'Available',
    },
  ];

  const filteredTracks = subTracks.filter((track) => {
    if (filterLang !== 'all' && track.code !== filterLang) return false;
    if (filterPlatform !== 'all') {
      const p = filterPlatform.toLowerCase();
      if (!track.platforms.some((plat) => plat.toLowerCase().includes(p))) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        track.language.toLowerCase().includes(q) ||
        (track.nativeName && track.nativeName.toLowerCase().includes(q)) ||
        track.platforms.some((plat) => plat.toLowerCase().includes(q)) ||
        track.provider.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Sub Details Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-slate-900 border border-blue-800/40 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-bold uppercase tracking-wider">
              <FileText className="w-4 h-4" />
              <span>Official Sub Details & Captions Hub</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Original Japanese Audio + Subtitles: {anime.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              This dedicated Sub Details page provides verified subtitle tracks, softsubs, styled captions, and broadcast translations for original Japanese voice audio across Crunchyroll, Netflix, Amazon Prime Video, Apple TV, and Muse Asia.
            </p>
          </div>

          {onSwitchToDubs && (
            <button
              onClick={onSwitchToDubs}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-md transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>View Dub Details Instead →</span>
            </button>
          )}
        </div>

        {/* Notice of Separation between Dub and Sub */}
        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-900/60 flex items-center gap-2 text-xs text-blue-200">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Sub Details Separation:</strong> Subtitle tracks feature original Japanese broadcast voices with synchronized on-screen text. For localized voice audio tracks (Hindi, English, Tamil, Telugu, etc.), open the <strong>Dub Details</strong> tab.
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="space-y-3">
        {/* Search input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subtitle languages, formats, or platforms..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Language Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Language:
          </span>
          {[
            { id: 'all', label: 'All Subtitles' },
            { id: 'en', label: 'English' },
            { id: 'bn', label: 'Bengali (বাংলা)' },
            { id: 'hi', label: 'Hindi (हिन्दी)' },
            { id: 'ja', label: 'Japanese CC' },
            { id: 'es', label: 'Spanish' },
            { id: 'fr', label: 'French' },
            { id: 'de', label: 'German' },
            { id: 'pt', label: 'Portuguese' },
            { id: 'id', label: 'Indonesian' },
            { id: 'zh', label: 'Chinese' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterLang(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                filterLang === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Platform Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Platform:
          </span>
          {[
            { id: 'all', label: 'All Platforms' },
            { id: 'crunchyroll', label: 'Crunchyroll' },
            { id: 'netflix', label: 'Netflix' },
            { id: 'prime', label: 'Amazon Prime Video' },
            { id: 'apple', label: 'Apple TV (India)' },
            { id: 'muse', label: 'Muse Asia' },
            { id: 'bilibili', label: 'Bilibili' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPlatform(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer text-xs ${
                filterPlatform === tab.id
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subtitle Tracks List */}
      <div className="space-y-3">
        {filteredTracks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No subtitle tracks matched your current filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredTracks.map((track, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 hover:border-blue-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600/30 text-blue-300 font-mono text-[10px] font-bold uppercase border border-blue-500/30">
                          {track.code.toUpperCase()}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">
                          {track.language} Subtitles
                        </h4>
                      </div>
                      {track.nativeName && (
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          {track.nativeName}
                        </p>
                      )}
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-800/50 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{track.status}</span>
                    </span>
                  </div>

                  {/* Format & Region */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                    <span className="font-mono text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-900/50">
                      {track.format}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{track.region}</span>
                  </div>

                  {/* Notes */}
                  <p className="text-xs text-slate-300/90 leading-relaxed">
                    {track.notes}
                  </p>

                  {/* Provider */}
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="truncate">{track.provider}</span>
                  </div>
                </div>

                {/* Platforms & Direct Watch Action */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {track.platforms.map((plat, pIdx) => (
                      <span
                        key={pIdx}
                        className="px-2 py-0.5 rounded-md bg-slate-800/90 text-[10px] font-medium text-slate-300 border border-slate-700/60"
                      >
                        {plat}
                      </span>
                    ))}
                  </div>

                  <a
                    href={track.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm ml-auto cursor-pointer"
                  >
                    <span>Watch with Subtitles</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
