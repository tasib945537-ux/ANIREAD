import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Flag,
  RotateCcw,
  Save,
} from 'lucide-react';
import {
  DirectoryService,
  DirectoryCategoryId,
  LicensingStatus,
  BusinessModel,
  BangladeshAvailability,
  UserReport,
} from '../../types/directory';
import {
  DIRECTORY_CATEGORIES,
  getUserReports,
  updateReportStatus,
  saveDirectoryServices,
  INITIAL_SERVICES_SEED,
} from '../../services/directoryStorage';

interface Props {
  services: DirectoryService[];
  onUpdateServices: (updated: DirectoryService[]) => void;
  onClose: () => void;
}

export const DirectoryAdminModal: React.FC<Props> = ({
  services,
  onUpdateServices,
  onClose,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'manage' | 'add' | 'reports'>('manage');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [reports, setReports] = useState<UserReport[]>(getUserReports());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLogoEmoji, setFormLogoEmoji] = useState('🌐');
  const [formWebsiteUrl, setFormWebsiteUrl] = useState('');
  const [formPrimaryCategory, setFormPrimaryCategory] = useState<DirectoryCategoryId>('official_anime_apps');
  const [formIsOfficial, setFormIsOfficial] = useState(true);
  const [formLicensing, setFormLicensing] = useState<LicensingStatus>('official_licensed');
  const [formBusinessModel, setFormBusinessModel] = useState<BusinessModel>('free_plus_premium');
  const [formBangladeshStatus, setFormBangladeshStatus] = useState<BangladeshAvailability>('available');
  const [formPrice, setFormPrice] = useState('');
  const [formMaxQuality, setFormMaxQuality] = useState<'4K UHD' | '1080p FHD' | '720p HD' | 'Adaptive' | 'Text/Images'>('1080p FHD');
  const [formAudioLangs, setFormAudioLangs] = useState('Japanese, English, Hindi');
  const [formVerificationSource, setFormVerificationSource] = useState('Official Provider Terms');

  const startEditService = (service: DirectoryService) => {
    setEditingServiceId(service.id);
    setFormName(service.name);
    setFormTagline(service.tagline);
    setFormDescription(service.description);
    setFormLogoEmoji(service.logoEmoji || '🌐');
    setFormWebsiteUrl(service.websiteUrl);
    setFormPrimaryCategory(service.primaryCategory);
    setFormIsOfficial(service.isOfficial);
    setFormLicensing(service.licensingStatus);
    setFormBusinessModel(service.businessModel);
    setFormBangladeshStatus(service.bangladeshStatus);
    setFormPrice(service.pricing.subscriptionPrice || '');
    setFormMaxQuality((service.specs.maxVideoQuality as any) || '1080p FHD');
    setFormAudioLangs((service.specs.audioLanguages || []).join(', '));
    setFormVerificationSource(service.verificationSource);
    setActiveAdminTab('add');
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formWebsiteUrl.trim()) return;

    const audioArr = formAudioLangs
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    let updated: DirectoryService[];

    if (editingServiceId) {
      // Update existing
      updated = services.map((s) => {
        if (s.id !== editingServiceId) return s;
        return {
          ...s,
          name: formName.trim(),
          tagline: formTagline.trim(),
          description: formDescription.trim(),
          logoEmoji: formLogoEmoji.trim() || '🌐',
          websiteUrl: formWebsiteUrl.trim(),
          primaryCategory: formPrimaryCategory,
          categories: Array.from(new Set([formPrimaryCategory, ...s.categories])),
          isOfficial: formIsOfficial,
          licensingStatus: formLicensing,
          businessModel: formBusinessModel,
          bangladeshStatus: formBangladeshStatus,
          pricing: {
            ...s.pricing,
            subscriptionPrice: formPrice.trim() || undefined,
          },
          specs: {
            ...s.specs,
            maxVideoQuality: formMaxQuality,
            audioLanguages: audioArr,
          },
          verificationSource: formVerificationSource.trim(),
          lastVerifiedDate: 'October 2026',
        };
      });
      setStatusMessage(`Service "${formName}" updated successfully!`);
    } else {
      // Create new
      const newService: DirectoryService = {
        id: `service_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        slug: formName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
        name: formName.trim(),
        tagline: formTagline.trim(),
        description: formDescription.trim(),
        logoEmoji: formLogoEmoji.trim() || '🌐',
        websiteUrl: formWebsiteUrl.trim(),
        primaryCategory: formPrimaryCategory,
        categories: [formPrimaryCategory],
        isOfficial: formIsOfficial,
        licensingStatus: formLicensing,
        operationalStatus: 'working',
        platforms: ['web', 'android', 'ios'],
        pricing: {
          hasFreeTier: formBusinessModel === 'free' || formBusinessModel === 'free_plus_premium',
          hasFreeTrial: false,
          hasAds: formBusinessModel === 'ad_supported',
          requiresAccount: true,
          subscriptionPrice: formPrice.trim() || undefined,
        },
        businessModel: formBusinessModel,
        specs: {
          maxVideoQuality: formMaxQuality,
          audioLanguages: audioArr,
          supportsOfflineViewing: 'plan_dependent',
        },
        bangladeshStatus: formBangladeshStatus,
        verificationSource: formVerificationSource.trim(),
        sourceUrl: formWebsiteUrl.trim(),
        lastVerifiedDate: 'October 2026',
        bookmarkCount: 0,
      };
      updated = [newService, ...services];
      setStatusMessage(`New service "${formName}" added to directory!`);
    }

    saveDirectoryServices(updated);
    onUpdateServices(updated);
    setEditingServiceId(null);
    setActiveAdminTab('manage');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the directory?`)) return;
    const updated = services.filter((s) => s.id !== id);
    saveDirectoryServices(updated);
    onUpdateServices(updated);
    setStatusMessage(`Service "${name}" removed.`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleResolveReport = (reportId: string) => {
    updateReportStatus(reportId, 'resolved');
    setReports(getUserReports());
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(services, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `aniread_directory_backup_${Date.now()}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
  };

  const handleResetToSeed = () => {
    if (!confirm('Reset directory to official seed records? This will restore original entries.')) return;
    saveDirectoryServices(INITIAL_SERVICES_SEED);
    onUpdateServices(INITIAL_SERVICES_SEED);
    setStatusMessage('Directory restored to default official seed.');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#090d16] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-auto text-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>Directory Admin Management Center</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Curate verified services, inspect user error reports, and export/import registry data.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 rounded-xl bg-indigo-950 border border-indigo-600/50 text-indigo-200 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Tab Strip */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => {
              setEditingServiceId(null);
              setActiveAdminTab('manage');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'manage'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <span>All Services ({services.length})</span>
          </button>

          <button
            onClick={() => {
              setEditingServiceId(null);
              setFormName('');
              setFormTagline('');
              setFormDescription('');
              setFormWebsiteUrl('');
              setFormPrice('');
              setActiveAdminTab('add');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'add'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{editingServiceId ? 'Edit Service' : 'Add New Service'}</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('reports')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeAdminTab === 'reports'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>User Reports ({reports.filter((r) => r.status === 'pending').length})</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-800 cursor-pointer"
              title="Backup Directory to JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={handleResetToSeed}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 cursor-pointer"
              title="Reset to Seed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Manage Existing Services */}
        {activeAdminTab === 'manage' && (
          <div className="space-y-3">
            <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-[#0e1526] border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.logoEmoji || '🌐'}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{s.name}</strong>
                        {s.isOfficial ? (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Official
                          </span>
                        ) : (
                          <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                            Third-Party
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.businessModel.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px] block">{s.tagline}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditService(s)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(s.id, s.name)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Add or Edit Service */}
        {activeAdminTab === 'add' && (
          <form onSubmit={handleSaveService} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Service Name:</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Crunchyroll"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Logo / Badge Emoji:</label>
                <input
                  type="text"
                  value={formLogoEmoji}
                  onChange={(e) => setFormLogoEmoji(e.target.value)}
                  placeholder="e.g. 🟠 or 🔴"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Tagline:</label>
                <input
                  type="text"
                  value={formTagline}
                  onChange={(e) => setFormTagline(e.target.value)}
                  placeholder="Short one-line description"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-bold mb-1">Full Description:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detailed explanation of features, library, and license..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Website URL:</label>
                <input
                  type="url"
                  value={formWebsiteUrl}
                  onChange={(e) => setFormWebsiteUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Primary Category:</label>
                <select
                  value={formPrimaryCategory}
                  onChange={(e) => setFormPrimaryCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {DIRECTORY_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Business Model:</label>
                <select
                  value={formBusinessModel}
                  onChange={(e) => setFormBusinessModel(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="free">Free (100% Free)</option>
                  <option value="ad_supported">Ad-Supported (AVOD)</option>
                  <option value="subscription">Subscription / Premium (SVOD)</option>
                  <option value="free_plus_premium">Free + Premium Tier</option>
                  <option value="pay_per_volume">Store / Pay per Title</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Bangladesh Status:</label>
                <select
                  value={formBangladeshStatus}
                  onChange={(e) => setFormBangladeshStatus(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="available">Available in Bangladesh</option>
                  <option value="region_restricted">⚠️ Region-Restricted</option>
                  <option value="vpn_required">🛡️ VPN Required</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Verified Pricing String:</label>
                <input
                  type="text"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="e.g. BDT 500/mo or $4.99/mo"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Supported Audio Dubs:</label>
                <input
                  type="text"
                  value={formAudioLangs}
                  onChange={(e) => setFormAudioLangs(e.target.value)}
                  placeholder="Japanese, English, Hindi"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-2 sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsOfficial}
                    onChange={(e) => setFormIsOfficial(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                  />
                  <span className="text-slate-300 font-bold">Officially Licensed / Publisher</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingServiceId(null);
                  setActiveAdminTab('manage');
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/50"
              >
                <Save className="w-4 h-4" />
                <span>{editingServiceId ? 'Update Service' : 'Save New Service'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: User Error Reports */}
        {activeAdminTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs font-mono">
                No user error reports currently logged. All links verified!
              </div>
            ) : (
              <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-4 rounded-2xl bg-[#0e1526] border border-slate-800 text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Flag className="w-3.5 h-3.5 text-rose-400" />
                        <span>{rep.serviceName}</span>
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          rep.status === 'pending'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {rep.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                      Issue: <strong className="text-amber-300">{rep.reportType}</strong> — {rep.comment}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                      <span>Submitted {new Date(rep.timestamp).toLocaleDateString()}</span>
                      {rep.status === 'pending' && (
                        <button
                          onClick={() => handleResolveReport(rep.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                        >
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
