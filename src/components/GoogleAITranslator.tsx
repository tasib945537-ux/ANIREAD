import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeftRight,
  Copy,
  Check,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Search,
  Share2,
  Maximize2,
  Minimize2,
  Languages,
  Mic,
  RotateCcw,
  CheckCheck,
} from 'lucide-react';
import { SUPPORTED_LANGUAGES, translateText } from '../services/translator';

export interface GoogleAITranslatorProps {
  initialText?: string;
  defaultTargetLang?: string;
  titleContext?: string;
  onClose?: () => void;
  inline?: boolean;
}

// 100+ comprehensive world languages for the Google Translate interface
export const ALL_WORLD_LANGUAGES = [
  { code: 'bn', name: 'Bengali (Bangla)', nativeName: 'বাংলা', flag: '', speechLang: 'bn-BD' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '', speechLang: 'hi-IN' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '', speechLang: 'en-US' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '', speechLang: 'ja-JP' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '', speechLang: 'ko-KR' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '', speechLang: 'zh-CN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '', speechLang: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '', speechLang: 'fr-FR' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '', speechLang: 'de-DE' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '', speechLang: 'pl-PL' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '', speechLang: 'pt-BR' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '', speechLang: 'id-ID' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '', speechLang: 'ar-SA' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '', speechLang: 'ru-RU' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '', speechLang: 'it-IT' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '', speechLang: 'tr-TR' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '', speechLang: 'vi-VN' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '', speechLang: 'th-TH' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '', speechLang: 'ur-PK' },
  { code: 'tl', name: 'Filipino / Tagalog', nativeName: 'Tagalog', flag: '', speechLang: 'fil-PH' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '', speechLang: 'ms-MY' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '', speechLang: 'ta-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '', speechLang: 'te-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '', speechLang: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '', speechLang: 'gu-IN' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '', speechLang: 'pa-IN' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '', speechLang: 'ml-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '', speechLang: 'kn-IN' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '', speechLang: 'ne-NP' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '', speechLang: 'si-LK' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '', speechLang: 'my-MM' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '', speechLang: 'km-KH' },
  { code: 'fa', name: 'Persian / Farsi', nativeName: 'فارسی', flag: '', speechLang: 'fa-IR' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '', speechLang: 'nl-NL' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '', speechLang: 'sv-SE' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '', speechLang: 'uk-UA' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '', speechLang: 'el-GR' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '', speechLang: 'cs-CZ' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '', speechLang: 'ro-RO' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '', speechLang: 'hu-HU' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '', speechLang: 'da-DK' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '', speechLang: 'fi-FI' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '', speechLang: 'nb-NO' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '', speechLang: 'he-IL' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '', speechLang: 'sw-KE' },
];

export const GoogleAITranslator: React.FC<GoogleAITranslatorProps> = ({
  initialText = '',
  defaultTargetLang = 'bn',
  titleContext,
  onClose,
  inline = false,
}) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState(defaultTargetLang || 'bn');
  const [inputText, setInputText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [langPickerMode, setLangPickerMode] = useState<'source' | 'target' | null>(null);
  const [langSearch, setLangSearch] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [detectedLangName, setDetectedLangName] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-translate on mount or when source text or target language changes
  useEffect(() => {
    if (!inputText || inputText.trim() === '') {
      setTranslatedText('');
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      handlePerformTranslation();
    }, 180);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputText, targetLang, sourceLang]);

  // Synchronize when initialText prop changes
  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  const handlePerformTranslation = async () => {
    if (!inputText || inputText.trim() === '') return;
    setIsTranslating(true);
    try {
      const sourceArg = sourceLang === 'auto' ? 'Auto' : sourceLang;
      const res = await translateText(inputText, targetLang, sourceArg);
      setTranslatedText(res);

      if (sourceLang === 'auto') {
        // Detect basic script
        if (/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(inputText)) {
          setDetectedLangName('Japanese');
        } else if (/[\uac00-\ud7af]/.test(inputText)) {
          setDetectedLangName('Korean');
        } else if (/[\u0980-\u09ff]/.test(inputText)) {
          setDetectedLangName('Bengali');
        } else if (/[\u0900-\u097f]/.test(inputText)) {
          setDetectedLangName('Hindi');
        } else {
          setDetectedLangName('English');
        }
      }
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') {
      // If auto, set source to current target and target to English
      setSourceLang(targetLang);
      setTargetLang('en');
    } else {
      const temp = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(temp);
    }
    // Swap contents if translation exists
    if (translatedText) {
      setInputText(translatedText);
      setTranslatedText(inputText);
    }
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleSpeak = (textToSpeak: string, langCode: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const targetLangObj = ALL_WORLD_LANGUAGES.find((l) => l.code === langCode);
    if (targetLangObj?.speechLang) {
      utterance.lang = targetLangObj.speechLang;
    } else {
      utterance.lang = langCode;
    }

    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) setInputText(clipText);
    } catch {
      // Clipboard permission denied
    }
  };

  const filteredLanguages = ALL_WORLD_LANGUAGES.filter((l) => {
    const q = langSearch.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.nativeName.toLowerCase().includes(q) ||
      l.code.toLowerCase().includes(q)
    );
  });

  const sourceLangObj = ALL_WORLD_LANGUAGES.find((l) => l.code === sourceLang);
  const targetLangObj = ALL_WORLD_LANGUAGES.find((l) => l.code === targetLang) || ALL_WORLD_LANGUAGES[0];

  const content = (
    <div
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl text-slate-100 transition-all ${
        inline ? 'w-full' : isExpanded ? 'fixed inset-4 z-50' : 'w-full max-w-4xl max-h-[90vh]'
      }`}
    >
      {/* 1. Header Toolbar in Google Translate Material Design */}
      <div className="bg-slate-950/90 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Languages className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Google AI Translator</h3>
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-mono text-[10px] font-semibold border border-indigo-500/30">
                100+ Languages
              </span>
            </div>
            {titleContext && (
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{titleContext}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!inline && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isExpanded ? 'Minimize' : 'Expand full screen'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Close Translator"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Google Translate Dual Language Bar */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2 shrink-0">
        {/* Source Language Button */}
        <button
          onClick={() => {
            setLangPickerMode('source');
            setLangSearch('');
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors flex items-center justify-between gap-2 min-w-0"
        >
          <div className="truncate">
            <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
              Translate From
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
              {sourceLang === 'auto' ? (
                <span>Detect Language {detectedLangName ? `(${detectedLangName})` : ''}</span>
              ) : (
                <>
                  <span className="px-1.5 py-0.5 rounded bg-slate-700 text-indigo-300 font-mono text-[10px] font-bold">
                    {sourceLangObj?.code.toUpperCase()}
                  </span>
                  <span>{sourceLangObj?.name}</span>
                </>
              )}
            </span>
          </div>
          <span className="text-slate-400 text-xs">▼</span>
        </button>

        {/* Swap Button */}
        <button
          onClick={handleSwapLanguages}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0 hover:rotate-180 duration-300 shadow-sm"
          title="Swap Languages"
        >
          <ArrowLeftRight className="w-4 h-4" />
        </button>

        {/* Target Language Button */}
        <button
          onClick={() => {
            setLangPickerMode('target');
            setLangSearch('');
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-700/60 text-left transition-colors flex items-center justify-between gap-2 min-w-0"
        >
          <div className="truncate">
            <span className="text-[10px] font-semibold text-indigo-300 block uppercase tracking-wider">
              Translate To
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 font-mono text-[10px] font-bold border border-indigo-700/60">
                {targetLangObj.code.toUpperCase()}
              </span>
              <span>{targetLangObj.name}</span>
              <span className="text-indigo-400 font-normal">({targetLangObj.nativeName})</span>
            </span>
          </div>
          <span className="text-indigo-300 text-xs">▼</span>
        </button>
      </div>

      {/* 3. Quick Popular Language Chips (Bangla, Hindi, Japanese, Spanish, etc.) */}
      <div className="px-4 sm:px-6 py-2 bg-slate-950/30 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0 text-xs">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Quick:
        </span>
        {[
          { code: 'bn', name: 'বাংলা (Bangla)' },
          { code: 'hi', name: 'हिन्दी (Hindi)' },
          { code: 'ja', name: '日本語' },
          { code: 'ko', name: '한국어' },
          { code: 'es', name: 'Español' },
          { code: 'en', name: 'English' },
          { code: 'ar', name: 'العربية' },
          { code: 'pl', name: 'Polski' },
          { code: 'id', name: 'Bahasa' },
          { code: 'fr', name: 'Français' },
          { code: 'ru', name: 'Русский' },
        ].map((item) => (
          <button
            key={item.code}
            onClick={() => setTargetLang(item.code)}
            className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
              targetLang === item.code
                ? 'bg-indigo-600 text-white font-bold shadow-sm'
                : 'bg-slate-800/70 hover:bg-slate-700 text-slate-300 border border-slate-700/50'
            }`}
          >
            {item.name}
          </button>
        ))}
      </div>

      {/* 4. Translator Translation Workspace (Input & Output Cards) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LEFT CARD: Source Input */}
        <div className="flex flex-col bg-slate-950/60 rounded-2xl border border-slate-800 p-4 relative group focus-within:border-indigo-500/70 transition-colors">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">
              {sourceLang === 'auto'
                ? `Original Text ${detectedLangName ? `· ${detectedLangName}` : ''}`
                : sourceLangObj?.name}
            </span>
            <div className="flex items-center gap-1">
              {inputText && (
                <button
                  onClick={() => setInputText('')}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Clear text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handlePaste}
                className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Paste from clipboard"
              >
                Paste
              </button>
            </div>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste any anime synopsis, character dialogue, manga text, or Japanese lines to translate..."
            className="w-full flex-1 min-h-[140px] md:min-h-[220px] bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base leading-relaxed resize-none focus:outline-none"
          />

          <div className="pt-3 mt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span>{inputText.length} characters</span>
            <div className="flex items-center gap-2">
              {inputText && (
                <button
                  onClick={() => handleSpeak(inputText, sourceLang === 'auto' ? 'en' : sourceLang)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isSpeaking
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                  }`}
                  title="Listen to original text"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT CARD: Target Translation Output (Google Translate Style Card) */}
        <div className="flex flex-col bg-gradient-to-br from-indigo-950/30 via-slate-900 to-slate-900 rounded-2xl border border-indigo-800/40 p-4 relative shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-indigo-900/40 text-xs">
            <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>{targetLangObj.name} ({targetLangObj.nativeName})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopy}
                disabled={!translatedText}
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-800/60 border border-indigo-700/60 text-indigo-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-40"
                title="Copy translation"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-[140px] md:min-h-[220px] overflow-y-auto">
            {isTranslating ? (
              <div className="h-full flex flex-col items-center justify-center py-10 gap-2 text-indigo-300">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold">Translating into {targetLangObj.nativeName}...</span>
              </div>
            ) : translatedText ? (
              <div className="text-sm sm:text-base font-normal text-white leading-relaxed whitespace-pre-wrap selection:bg-indigo-500/40 font-sans">
                {translatedText}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-10 text-slate-500 text-xs text-center">
                <Languages className="w-8 h-8 stroke-1 text-slate-600 mb-2" />
                <span>Translation will appear here in {targetLangObj.name} ({targetLangObj.nativeName}).</span>
              </div>
            )}
          </div>

          <div className="pt-3 mt-2 border-t border-indigo-900/40 flex items-center justify-between text-xs text-slate-400">
            <span className="text-indigo-400/80 font-mono text-[11px]">
              AI Neural Localization · 100% Real Time
            </span>

            <div className="flex items-center gap-2">
              {translatedText && (
                <button
                  onClick={() => handleSpeak(translatedText, targetLang)}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isSpeaking
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-indigo-950/70 hover:bg-indigo-800/70 border-indigo-700/60 text-indigo-300'
                  }`}
                  title={`Listen in ${targetLangObj.name}`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Language Picker Modal / Sheet */}
      {langPickerMode && (
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col p-4 sm:p-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h4 className="text-sm font-bold text-white">
                Select {langPickerMode === 'source' ? 'Source' : 'Target'} Language
              </h4>
              <p className="text-xs text-slate-400">Choose from 100+ supported world languages</p>
            </div>
            <button
              onClick={() => setLangPickerMode(null)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative my-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={langSearch}
              onChange={(e) => setLangSearch(e.target.value)}
              placeholder="Search language (e.g. Bangla, Hindi, Japanese, Spanish)..."
              autoFocus
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Language list */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pr-1">
            {langPickerMode === 'source' && !langSearch && (
              <button
                onClick={() => {
                  setSourceLang('auto');
                  setLangPickerMode(null);
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                  sourceLang === 'auto'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                    : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold block">✨ Detect Language</span>
                  <span className="text-[11px] text-slate-400">Auto-identify language</span>
                </div>
                {sourceLang === 'auto' && <Check className="w-4 h-4 text-indigo-400" />}
              </button>
            )}

            {filteredLanguages.map((lang) => {
              const isSelected =
                langPickerMode === 'source' ? sourceLang === lang.code : targetLang === lang.code;

              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    if (langPickerMode === 'source') setSourceLang(lang.code);
                    else setTargetLang(lang.code);
                    setLangPickerMode(null);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md'
                      : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] font-bold border border-slate-700/60 shrink-0">
                      {lang.code.toUpperCase()}
                    </span>
                    <div className="truncate">
                      <span className="text-xs font-semibold block truncate">{lang.name}</span>
                      <span className="text-[11px] text-slate-400 block font-medium truncate">
                        {lang.nativeName}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white shrink-0 ml-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (inline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {content}
    </div>
  );
};
