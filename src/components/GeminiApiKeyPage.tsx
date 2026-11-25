import React, { useState } from 'react';
import { KeyRound, ExternalLink, Eye, EyeOff, Save, Trash2, ShieldCheck, AlertTriangle, CheckCircle2, Copy } from 'lucide-react';
import { clearGeminiApiKey, getGeminiApiKey, saveGeminiApiKey } from '../services/geminiApiKey';

interface Props {
  onBack?: () => void;
}

export const GeminiApiKeyPage: React.FC<Props> = ({ onBack }) => {
  const [key, setKey] = useState(() => getGeminiApiKey());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(Boolean(getGeminiApiKey()));
  const [message, setMessage] = useState('');

  const handleSave = () => {
    const value = key.trim();
    if (!value || !value.startsWith('AIza')) {
      setMessage('Please enter a valid-looking Google AI Studio API key.');
      setSaved(false);
      return;
    }
    try {
      saveGeminiApiKey(value);
      setKey(value);
      setSaved(true);
      setMessage('API key saved on this device. Manga translation can now use it.');
    } catch {
      setSaved(false);
      setMessage('Could not save the key on this device. Check browser storage settings.');
    }
  };

  const handleRemove = () => {
    clearGeminiApiKey();
    setKey('');
    setSaved(false);
    setMessage('API key removed from this device.');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://aistudio.google.com/app/apikey');
      setMessage('Google AI Studio link copied.');
    } catch {
      setMessage('Open the Google AI Studio link below.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">ANIREAD SETTINGS</p>
          <h1 className="text-2xl font-black text-white">Gemini API Key</h1>
          <p className="text-sm text-slate-400">Connect Google AI Studio to translate manga pages.</p>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <h2 className="font-bold text-white">Your key stays on this device</h2>
            <p className="text-sm text-slate-400 mt-1">ANIREAD stores this key in this device's browser storage and sends it securely with translation requests. The ANIREAD server does not save it. Do not share your key or add it to GitHub, screenshots, or public posts.</p>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-200" htmlFor="gemini-api-key">Google AI Studio API key</label>
        <div className="flex gap-2">
          <input
            id="gemini-api-key"
            type={showKey ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            value={key}
            onChange={(event) => { setKey(event.target.value); setSaved(false); setMessage(''); }}
            placeholder="Paste your Gemini API key here"
            className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-indigo-500"
          />
          <button type="button" onClick={() => setShowKey((value) => !value)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 text-slate-300 hover:text-white" aria-label={showKey ? 'Hide key' : 'Show key'}>
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleSave} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500">
            <Save className="w-4 h-4" /> Save API Key
          </button>
          <button type="button" onClick={handleRemove} disabled={!key && !saved} className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-40">
            <Trash2 className="w-4 h-4" /> Remove
          </button>
        </div>

        {message && (
          <p role="status" className={`text-sm rounded-lg px-3 py-2 ${saved ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}`}>
            {saved ? <CheckCircle2 className="inline w-4 h-4 mr-1" /> : <AlertTriangle className="inline w-4 h-4 mr-1" />}{message}
          </p>
        )}
        {saved && !message && <p className="text-xs text-emerald-300"><CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />A key is saved on this device.</p>}
      </section>

      <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 sm:p-6 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white">How to get your API key</h2>
          <p className="text-sm text-slate-400 mt-1">Create your own key in Google's official AI Studio. Never send it to anyone.</p>
        </div>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-900 hover:bg-slate-200">
          Open Google AI Studio <ExternalLink className="w-4 h-4" />
        </a>
        <button type="button" onClick={copyLink} className="ml-2 inline-flex items-center gap-2 text-xs text-indigo-300 hover:text-indigo-200">
          <Copy className="w-3.5 h-3.5" /> Copy link
        </button>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300">
          <li>Open Google AI Studio and sign in to your Google account.</li>
          <li>Open <strong>Get API key</strong>, then choose <strong>Create API key</strong>.</li>
          <li>Choose a Google Cloud project if Google asks you to.</li>
          <li>Copy the new key and return to ANIREAD.</li>
          <li>Paste it in the box above and tap <strong>Save API Key</strong>.</li>
          <li>Open a manga chapter and use <strong>Translate Page</strong> or <strong>Translate Chapter</strong>.</li>
        </ol>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <figure className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            <img src="/assets/aistudio/Screenshot_20261031-145256_e7d657f1.png" alt="Google AI Studio setup screenshot" className="w-full h-auto object-contain" loading="lazy" />
            <figcaption className="px-3 py-2 text-xs text-slate-400">Google AI Studio — API key setup reference</figcaption>
          </figure>
          <figure className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            <img src="/assets/aistudio/Screenshot_20261102-000220_344306da.png" alt="Google AI Studio API key reference screenshot" className="w-full h-auto object-contain" loading="lazy" />
            <figcaption className="px-3 py-2 text-xs text-slate-400">Create or manage your API key</figcaption>
          </figure>
        </div>
      </section>

      <p className="text-xs leading-relaxed text-amber-200/80">Important: API keys can incur usage or billing under the Google account/project that owns them. Check Google's current quota and billing settings. If a quota is exhausted, wait for its reset or use Google's approved quota options; ANIREAD will not bypass provider limits.</p>
      {onBack && <button type="button" onClick={onBack} className="text-sm font-semibold text-slate-400 hover:text-white">← Back</button>}
    </div>
  );
};
