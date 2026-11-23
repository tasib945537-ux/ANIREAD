import React from 'react';
import {
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Smartphone,
  Tv,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  Info,
  DollarSign,
  Download,
  Volume2,
} from 'lucide-react';
import { DirectoryService, PlatformType } from '../../types/directory';

interface Props {
  service: DirectoryService;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onOpenDetails: (service: DirectoryService) => void;
}

export const ServiceCard: React.FC<Props> = ({
  service,
  isBookmarked,
  onToggleBookmark,
  onOpenDetails,
}) => {
  const getPlatformIcon = (platform: PlatformType) => {
    switch (platform) {
      case 'web':
        return (
          <span title="Web Browser">
            <Globe className="w-3.5 h-3.5" />
          </span>
        );
      case 'android':
      case 'ios':
        return (
          <span title="Mobile App (Android/iOS)">
            <Smartphone className="w-3.5 h-3.5" />
          </span>
        );
      case 'smart_tv':
      case 'console':
        return (
          <span title="Smart TV / Console">
            <Tv className="w-3.5 h-3.5" />
          </span>
        );
      case 'desktop':
        return (
          <span title="Desktop App">
            <Monitor className="w-3.5 h-3.5" />
          </span>
        );
      default:
        return <Globe className="w-3.5 h-3.5" />;
    }
  };

  const getBusinessModelBadge = () => {
    switch (service.businessModel) {
      case 'free':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            FREE
          </span>
        );
      case 'ad_supported':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
            AD-SUPPORTED
          </span>
        );
      case 'subscription':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
            PREMIUM
          </span>
        );
      case 'free_plus_premium':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
            FREE + PREMIUM
          </span>
        );
      case 'pay_per_volume':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
            STORE / RETAIL
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
            INFO UNVERIFIED
          </span>
        );
    }
  };

  const getBangladeshBadge = () => {
    switch (service.bangladeshStatus) {
      case 'available':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Available in BD</span>
          </span>
        );
      case 'region_restricted':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-rose-950/60 text-rose-300 border border-rose-800/40 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>Region-Restricted</span>
          </span>
        );
      case 'vpn_required':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-amber-950/60 text-amber-300 border border-amber-800/40 flex items-center gap-1">
            <span>🛡️</span>
            <span>VPN Needed</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-slate-900 text-slate-400 border border-slate-800">
            BD Status Unknown
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0e1526]/90 border border-slate-800/90 hover:border-indigo-500/40 shadow-xl transition-all flex flex-col justify-between gap-4 group relative overflow-hidden backdrop-blur-sm">
      {/* Top Bar: Icon, Name, Official Badge, Bookmark */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-700/40 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
              {service.logoEmoji || '🌐'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {service.name}
                </h3>
                {service.isOfficial ? (
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Official</span>
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Third-Party</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                {service.tagline}
              </p>
            </div>
          </div>

          <button
            onClick={() => onToggleBookmark(service.id)}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isBookmarked
                ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Service'}
            aria-label="Bookmark"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-4 h-4 text-indigo-400 fill-indigo-400/20" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
          {service.description}
        </p>

        {/* Badges strip: Business Model, Regional status, Max Quality */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {getBusinessModelBadge()}
          {getBangladeshBadge()}
          {service.specs.maxVideoQuality && service.specs.maxVideoQuality !== 'Unknown' && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-slate-300 border border-slate-800">
              {service.specs.maxVideoQuality}
            </span>
          )}
          {service.specs.supportsOfflineViewing === true && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-emerald-300 border border-slate-800 flex items-center gap-1">
              <Download className="w-2.5 h-2.5" />
              <span>Offline</span>
            </span>
          )}
        </div>

        {/* Audio / Subtitle Quick Peek */}
        {service.specs.audioLanguages && service.specs.audioLanguages.length > 0 && (
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono pt-0.5">
            <Volume2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="line-clamp-1">
              Audio: {service.specs.audioLanguages.slice(0, 4).join(', ')}
              {service.specs.audioLanguages.length > 4 ? ` +${service.specs.audioLanguages.length - 4}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Footer: Platform Icons, Verification Date, Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            {service.platforms.map((p) => (
              <span key={p} className="p-1 rounded bg-slate-900/80 border border-slate-800 text-slate-300">
                {getPlatformIcon(p)}
              </span>
            ))}
          </div>

          <span className="text-[10px] font-mono text-slate-400">
            Verified {service.lastVerifiedDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenDetails(service)}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-indigo-400" />
            <span>Service Details</span>
          </button>

          <a
            href={service.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Visit Official Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
