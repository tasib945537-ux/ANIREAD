import { Tv, ExternalLink, ShieldCheck, PlayCircle, Info, Globe } from 'lucide-react';
import { AnimeItem, WatchLink } from '../../types/anime';
import { VERIFIED_24_ANIME_WEBSITES } from './AnimeWebSourceChecker';

interface Props {
  anime: AnimeItem;
}

export const AnimeStreamingServices: React.FC<Props> = ({ anime }) => {
  const watchLinks: WatchLink[] = anime.watchLinks || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Official Streaming Directory Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-800/40 shadow-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Official & Licensed Streaming Providers</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Watch <strong className="text-white">{anime.title}</strong> legally on licensed international streaming platforms. Support the animators and official studios.
        </p>
      </div>

      {/* Streaming Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {watchLinks.map((link, idx) => {
          const isCrunchyroll = link.name.toLowerCase().includes('crunchyroll');
          const isNetflix = link.name.toLowerCase().includes('netflix');
          const isPrime = link.name.toLowerCase().includes('prime');
          const isDisney = link.name.toLowerCase().includes('disney') || link.name.toLowerCase().includes('hotstar');
          const isYouTube = link.name.toLowerCase().includes('youtube') || link.name.toLowerCase().includes('muse');

          const isApple = link.name.toLowerCase().includes('apple');
          const isJio = link.name.toLowerCase().includes('jio');
          const isEverythingMoe = link.name.toLowerCase().includes('everythingmoe');
          const isHiAnime = link.name.toLowerCase().includes('hianime');

          let accentStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900/90';
          if (isCrunchyroll) accentStyle = 'border-amber-600/40 hover:border-amber-500 bg-gradient-to-br from-amber-950/20 to-slate-900';
          if (isNetflix) accentStyle = 'border-rose-600/40 hover:border-rose-500 bg-gradient-to-br from-rose-950/20 to-slate-900';
          if (isPrime) accentStyle = 'border-blue-600/40 hover:border-blue-500 bg-gradient-to-br from-blue-950/20 to-slate-900';
          if (isDisney) accentStyle = 'border-indigo-600/40 hover:border-indigo-500 bg-gradient-to-br from-indigo-950/20 to-slate-900';
          if (isYouTube) accentStyle = 'border-red-600/40 hover:border-red-500 bg-gradient-to-br from-red-950/20 to-slate-900';
          if (isApple) accentStyle = 'border-slate-600/40 hover:border-slate-500 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900';
          if (isJio) accentStyle = 'border-pink-600/40 hover:border-pink-500 bg-gradient-to-br from-pink-950/20 to-slate-900';
          if (isEverythingMoe) accentStyle = 'border-purple-600/40 hover:border-purple-500 bg-gradient-to-br from-purple-950/25 to-slate-900';
          if (isHiAnime) accentStyle = 'border-amber-500/40 hover:border-amber-400 bg-gradient-to-br from-amber-950/20 to-slate-900';

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 shadow-md ${accentStyle}`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-indigo-400" />
                    <span>{link.name}</span>
                  </h4>

                  {link.isOfficial && (
                    <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Official
                    </span>
                  )}
                </div>

                {link.badge && (
                  <span className="text-[11px] text-slate-300 font-medium block">
                    {link.badge}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">1080p Full HD</span>

                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span>Watch on {link.name.split(' ')[0]}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regional Licensing Notice */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          Streaming licenses differ by geographical territories. For India and South Asia, titles are licensed between Crunchyroll, Netflix, JioCinema/Hotstar, and Muse Asia YouTube channels.
        </div>
      </div>

      {/* Cross-Check Across 24 Global & Regional Databases */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>Cross-Check Streaming Rights on 24 Global Websites</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">24 Sources Verified</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {VERIFIED_24_ANIME_WEBSITES.map((site) => (
            <a
              key={site.id}
              href={site.getSearchUrl(anime.title, anime)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-400/50 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-xs cursor-pointer group"
              title={`Check ${anime.title} on ${site.name}`}
            >
              <img
                src={site.logoUrl}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span>{site.domain}</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-500 group-hover:text-indigo-400 shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Cross-Link to EverythingMoe Inspired Services Directory */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-slate-900 border border-purple-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🌐</span>
          <div>
            <h4 className="font-bold text-white">Looking for More Platforms & Manga Services?</h4>
            <p className="text-[11px] text-slate-300">
              Browse our curated Anime & Manga Services Directory with verified regional availability, prices, and ad policies.
            </p>
          </div>
        </div>
        <a
          href="#directory"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.location.hash = '#directory';
            }
          }}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold whitespace-nowrap text-center transition-all shadow-md shadow-purple-950/50 cursor-pointer"
        >
          Open Services Directory →
        </a>
      </div>
    </div>
  );
};
