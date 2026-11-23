import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Smartphone,
  Tv,
  Monitor,
  Download,
  Volume2,
  DollarSign,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  Send,
  Flag,
  Sparkles,
} from 'lucide-react';
import { DirectoryService, UserReport } from '../../types/directory';
import { submitUserReport } from '../../services/directoryStorage';

interface Props {
  service: DirectoryService;
  allServices: DirectoryService[];
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onClose: () => void;
  onSelectService: (service: DirectoryService) => void;
}

export const ServiceDetailModal: React.FC<Props> = ({
  service,
  allServices,
  isBookmarked,
  onToggleBookmark,
  onClose,
  onSelectService,
}) => {
  // Report form state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState<UserReport['reportType']>('wrong_pricing');
  const [reportComment, setReportComment] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportComment.trim()) return;

    submitUserReport({
      serviceId: service.id,
      serviceName: service.name,
      reportType,
      comment: reportComment.trim(),
    });

    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      setReportComment('');
    }, 2000);
  };

  // Find related services in same categories
  const relatedServices = allServices
    .filter(
      (s) =>
        s.id !== service.id &&
        s.categories.some((c) => service.categories.includes(c))
    )
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#090d16] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 my-auto text-slate-200 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header Strip */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-3.5">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border border-indigo-700/40 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {service.logoEmoji || '🌐'}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {service.name}
                </h2>
                {service.isOfficial ? (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Official Licensor / Publisher</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Third-Party / Unverified</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300 font-mono mt-0.5">
                {service.tagline}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleBookmark(service.id)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isBookmarked
                  ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={isBookmarked ? 'Bookmarked' : 'Add to Bookmarks'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-indigo-400" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Buttons: Visit Official Site & App Store Links */}
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={service.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[200px] py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/60 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Open Official Website</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {service.androidAppUrl && (
            <a
              href={service.androidAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Google Play App</span>
            </a>
          )}

          {service.iosAppUrl && (
            <a
              href={service.iosAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-900/50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Apple App Store</span>
            </a>
          )}
        </div>

        {/* Service Full Overview */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            About the Service
          </h4>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-[#0e1526] p-4 rounded-2xl border border-slate-800/80">
            {service.description}
          </p>
        </div>

        {/* Technical Specs & Pricing Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: Pricing & Plans */}
          <div className="p-4 rounded-2xl bg-[#0e1526] border border-slate-800/90 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4" />
              <span>Pricing & Subscription Terms</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Business Model:</span>
                <span className="font-mono font-bold text-white uppercase">{service.businessModel.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Free Tier:</span>
                <span className="font-bold text-slate-200">
                  {service.pricing.hasFreeTier === true
                    ? 'Yes (Available)'
                    : service.pricing.hasFreeTier === 'limited'
                    ? 'Limited Selection'
                    : 'No (Subscription Only)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Free Trial:</span>
                <span className="font-bold text-slate-200">
                  {service.pricing.hasFreeTrial
                    ? `Yes (${service.pricing.trialDays || 7} Days)`
                    : 'None / Unavailable'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Advertising:</span>
                <span className="font-bold text-slate-200">
                  {service.pricing.hasAds === true
                    ? 'Yes (Commercial Breaks)'
                    : service.pricing.hasAds === 'some_regions'
                    ? 'Ad-Supported Tier Available'
                    : 'Zero Ads (Clean Stream)'}
                </span>
              </div>
              {service.pricing.subscriptionPrice && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Verified Pricing:</span>
                  <span className="font-mono font-bold text-emerald-400">{service.pricing.subscriptionPrice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card B: Media & Audio Specs */}
          <div className="p-4 rounded-2xl bg-[#0e1526] border border-slate-800/90 space-y-3">
            <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tv className="w-4 h-4" />
              <span>Media, Audio & Offline Specs</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Max Video Quality:</span>
                <span className="font-mono font-bold text-white">{service.specs.maxVideoQuality || 'Adaptive'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Offline Downloads:</span>
                <span className="font-bold text-slate-200">
                  {service.specs.supportsOfflineViewing === true
                    ? 'Yes (Supported in mobile apps)'
                    : service.specs.supportsOfflineViewing === 'plan_dependent'
                    ? 'Available in Premium tiers'
                    : 'Not supported'}
                </span>
              </div>
              <div className="py-1 border-b border-slate-800/60 space-y-1">
                <span className="text-slate-400 block">Audio Dub Languages:</span>
                <span className="text-indigo-300 font-mono text-[11px] block">
                  {service.specs.audioLanguages && service.specs.audioLanguages.length > 0
                    ? service.specs.audioLanguages.join(', ')
                    : 'Japanese Original Audio'}
                </span>
              </div>
              <div className="py-1 space-y-1">
                <span className="text-slate-400 block">Subtitle Languages:</span>
                <span className="text-slate-300 font-mono text-[11px] block">
                  {service.specs.subtitleLanguages && service.specs.subtitleLanguages.length > 0
                    ? service.specs.subtitleLanguages.join(', ')
                    : 'English & Global Subtitles'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Regional & Bangladesh Availability Guide */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-[#0e1526] to-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Bangladesh & Regional Availability Guide</span>
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                service.bangladeshStatus === 'available'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                  : service.bangladeshStatus === 'region_restricted'
                  ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                  : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
              }`}
            >
              {service.bangladeshStatus.toUpperCase().replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {service.regionalNotes ||
              'Service availability is subject to regional licensing contracts. Always verify directly with the provider.'}
          </p>
        </div>

        {/* Safety & Verification Card */}
        <div className="p-4 rounded-2xl bg-[#0e1526]/80 border border-slate-800 text-xs space-y-2 font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Last Verified: <strong className="text-white">{service.lastVerifiedDate}</strong></span>
            </span>
            <span className="text-slate-400">
              Source: <strong className="text-indigo-300">{service.verificationSource}</strong>
            </span>
          </div>
          {service.safetyNotes && (
            <p className="text-slate-300 text-[11px] leading-relaxed pt-1">
              Safety note: {service.safetyNotes}
            </p>
          )}
        </div>

        {/* Footer Actions: Report Error & Related Services */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setShowReportModal(true)}
            className="text-xs text-slate-400 hover:text-rose-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Report Incorrect Information</span>
          </button>

          {relatedServices.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span>Related:</span>
              {relatedServices.map((rel) => (
                <button
                  key={rel.id}
                  onClick={() => onSelectService(rel)}
                  className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                >
                  {rel.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report Incorrect Info Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-rose-400" />
                  <span>Report Service Information</span>
                </h3>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-center text-xs text-emerald-300 font-semibold space-y-1">
                  <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                  <p>Thank you! Your correction report has been logged for review.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Issue Category:</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="wrong_pricing">Incorrect Pricing or Currency</option>
                      <option value="region_inaccurate">Bangladesh / Regional Availability Error</option>
                      <option value="broken_link">Broken Official URL or Dead Link</option>
                      <option value="malware_ads">Invasive Ads or Safety Concern</option>
                      <option value="copyright_issue">Copyright / Licensing Inaccuracy</option>
                      <option value="other">Other Information Update</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">Details & Evidence Link:</label>
                    <textarea
                      rows={3}
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      placeholder="Please explain what is outdated or incorrect and provide official proof if possible..."
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500 placeholder:text-slate-500"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReportModal(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Report</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
