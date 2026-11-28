import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw,
  Sparkles,
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Edit3,
  Check,
  X,
  Languages,
} from 'lucide-react';
import { MangaPageDialogue, TranslatedMangaPageResult } from '../services/translator';

/** Measure translated text against the detected source region. */
function fitOverlayFontSize(text: string, widthPx: number, heightPx: number, fontFamily: string, weight = 700): number {
  if (typeof document === 'undefined' || !text.trim()) return 8;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 8;
  const words = text.replace(/\s+/g, ' ').trim().split(' ');
  const byWord = words.length > 1;
  const tokens = byWord ? words : [...text];
  const fits = (size: number) => {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    let line = '';
    const lines: string[] = [];
    for (const token of tokens) {
      const candidate = line ? `${line}${byWord ? ' ' : ''}${token}` : token;
      if (line && ctx.measureText(candidate).width > widthPx) { lines.push(line); line = token; }
      else line = candidate;
    }
    if (line) lines.push(line);
    const widest = Math.max(0, ...lines.map((value) => ctx.measureText(value).width));
    return widest <= widthPx * 0.96 && lines.length * size * 1.08 <= heightPx * 0.92;
  };
  let low = 6;
  let high = Math.max(7, Math.min(42, heightPx * 0.72, widthPx * 0.72));
  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid; else high = mid;
  }
  return Math.max(6, low);
}

interface RegionAdjustment {
  deltaX: number; // percentage offset
  deltaY: number; // percentage offset
  showOriginal: boolean;
  customText?: string;
}

interface MangaCanvasPageProps {
  src: string;
  pageNumber: number;
  totalPages: number;
  alt: string;
  isTranslatedView: boolean;
  targetLangCode: string;
  translatedData?: TranslatedMangaPageResult | null;
  isTranslating?: boolean;
  onTranslatePage?: (pageNum: number, base64Data?: string) => void;
  fitMode?: 'width' | 'contain';
  zoomLevel?: number;
  translationOpacity?: number; // 0 to 100
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const MangaCanvasPage: React.FC<MangaCanvasPageProps> = ({
  src,
  pageNumber,
  totalPages,
  alt,
  isTranslatedView,
  targetLangCode,
  translatedData,
  isTranslating = false,
  onTranslatePage,
  fitMode = 'width',
  zoomLevel = 100,
  translationOpacity = 100,
  className = '',
  onClick,
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [imgStatus, setImgStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  // Active inspected region in Google Lens Inspector
  const [selectedDialogueId, setSelectedDialogueId] = useState<number | null>(null);
  const [regionAdjustments, setRegionAdjustments] = useState<Record<number, RegionAdjustment>>({});
  const [isEditingText, setIsEditingText] = useState(false);
  const [tempEditText, setTempEditText] = useState('');

  useEffect(() => {
    setCurrentSrc(src);
    setImgStatus('loading');
    setAttempt(0);
    setSelectedDialogueId(null);
  }, [src]);

  const handleImageLoad = () => {
    setImgStatus('loaded');
  };

  const handleError = () => {
    if (attempt === 0 && currentSrc.includes('/data/')) {
      const fallbackUrl = currentSrc.replace(
        /https%3A%2F%2F[^%]+%2Fdata%2F/i,
        'https%3A%2F%2Fuploads.mangadex.org%2Fdata%2F'
      );
      setAttempt(1);
      setCurrentSrc(fallbackUrl);
    } else if (attempt === 1 && currentSrc.includes('/data/')) {
      const saverUrl = currentSrc.replace(
        /https%3A%2F%2F[^%]+%2Fdata%2F/i,
        'https%3A%2F%2Fuploads.mangadex.org%2Fdata-saver%2F'
      );
      setAttempt(2);
      setCurrentSrc(saverUrl);
    } else if (attempt === 2 && currentSrc.includes('url=')) {
      try {
        const direct = decodeURIComponent(currentSrc.slice(currentSrc.indexOf('url=') + 4));
        setAttempt(3);
        setCurrentSrc(direct);
      } catch {
        setImgStatus('error');
      }
    } else {
      setImgStatus('error');
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImgStatus('loading');
    setAttempt(0);
    setCurrentSrc(src + (src.includes('?') ? '&' : '?') + 't=' + Date.now());
  };

  // Helper to extract base64 from the currently loaded image element
  const getLoadedImageBase64 = (): string | undefined => {
    if (!imgRef.current || imgStatus !== 'loaded') return undefined;
    try {
      const img = imgRef.current;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (!w || !h) return undefined;

      const canvas = document.createElement('canvas');
      const maxDim = 1600;
      let targetW = w;
      let targetH = h;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          targetH = Math.round((h * maxDim) / w);
          targetW = maxDim;
        } else {
          targetW = Math.round((w * maxDim) / h);
          targetH = maxDim;
        }
      }

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      ctx.drawImage(img, 0, 0, targetW, targetH);
      return canvas.toDataURL('image/jpeg', 0.88);
    } catch {
      // CORS might restrict reading tainted canvas if cross-origin without proper proxy
      return undefined;
    }
  };

  const handleTriggerTranslate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const base64 = getLoadedImageBase64();
    onTranslatePage?.(pageNumber, base64);
  };

  const dialogues: MangaPageDialogue[] = useMemo(() => {
    return translatedData?.dialogues || [];
  }, [translatedData]);

  const hasTranslations = dialogues.length > 0;

  // Selected dialogue object for inspector
  const activeDialogue = useMemo(() => {
    if (selectedDialogueId === null) return null;
    return dialogues.find((d) => d.id === selectedDialogueId) || null;
  }, [selectedDialogueId, dialogues]);

  // Adjustments handlers
  const handleNudge = (deltaX: number, deltaY: number) => {
    if (selectedDialogueId === null) return;
    setRegionAdjustments((prev) => {
      const cur = prev[selectedDialogueId] || { deltaX: 0, deltaY: 0, showOriginal: false };
      return {
        ...prev,
        [selectedDialogueId]: {
          ...cur,
          deltaX: cur.deltaX + deltaX,
          deltaY: cur.deltaY + deltaY,
        },
      };
    });
  };

  const handleToggleOriginal = () => {
    if (selectedDialogueId === null) return;
    setRegionAdjustments((prev) => {
      const cur = prev[selectedDialogueId] || { deltaX: 0, deltaY: 0, showOriginal: false };
      return {
        ...prev,
        [selectedDialogueId]: {
          ...cur,
          showOriginal: !cur.showOriginal,
        },
      };
    });
  };

  const handleSaveCustomText = () => {
    if (selectedDialogueId === null) return;
    setRegionAdjustments((prev) => {
      const cur = prev[selectedDialogueId] || { deltaX: 0, deltaY: 0, showOriginal: false };
      return {
        ...prev,
        [selectedDialogueId]: {
          ...cur,
          customText: tempEditText,
        },
      };
    });
    setIsEditingText(false);
  };

  // Font family class based on target language
  const fontClass =
    targetLangCode === 'bn'
      ? 'font-bengali'
      : targetLangCode === 'hi'
      ? 'font-devanagari'
      : 'manga-bubble-text';

  return (
    <div
      onClick={onClick}
      className={`relative w-full flex flex-col items-center justify-center select-none ${className}`}
    >
      {/* Loading Skeleton */}
      {imgStatus === 'loading' && (
        <div className="w-full max-w-4xl aspect-[2/3] flex flex-col items-center justify-center bg-slate-900/60 border border-slate-800/80 rounded-xl animate-pulse text-slate-400 my-4 min-h-[420px]">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="font-mono text-xs font-semibold text-slate-300">
            Loading Page {pageNumber} of {totalPages}...
          </span>
          <span className="text-[11px] text-slate-500 mt-1">High-Resolution Manga Scan</span>
        </div>
      )}

      {/* Error Retry Card */}
      {imgStatus === 'error' && (
        <div className="w-full max-w-md py-14 px-6 flex flex-col items-center justify-center text-center bg-slate-900/90 rounded-2xl border border-rose-900/40 my-6">
          <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
          <p className="text-sm font-semibold text-rose-200">Page {pageNumber} failed to load</p>
          <p className="text-xs text-slate-400 mt-1">
            Network glitch or CDN temporary timeout. Tap retry below.
          </p>
          <button
            onClick={handleRetry}
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Page {pageNumber}</span>
          </button>
        </div>
      )}

      {/* Main Image Container & Translation Layer */}
      <div
        className={`relative inline-block transition-opacity duration-300 ${
          imgStatus === 'loaded' ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'
        }`}
        style={{
          maxWidth: fitMode === 'contain' ? 'fit-content' : '100%',
        }}
      >
        {/* The Base Manga Artwork Image */}
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
          loading={pageNumber <= 3 ? 'eager' : 'lazy'}
          onLoad={handleImageLoad}
          onError={handleError}
          className={`${
            fitMode === 'contain' ? 'max-h-[90vh] w-auto' : 'w-full max-w-4xl h-auto'
          } object-contain block mx-auto transition-transform duration-150`}
        />

        {/* GOOGLE LENS OVERLAY LAYER */}
        {isTranslatedView && hasTranslations && (
          <div
            style={{ opacity: translationOpacity / 100 }}
            className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-150"
          >
            {dialogues.map((item) => {
              const adj = regionAdjustments[item.id] || { deltaX: 0, deltaY: 0, showOriginal: false };

              // Extract coordinates
              let top = item.top;
              let left = item.left;
              let width = item.width;
              let height = item.height;

              if (item.box) {
                top = item.box.ymin * 100;
                left = item.box.xmin * 100;
                width = (item.box.xmax - item.box.xmin) * 100;
                height = (item.box.ymax - item.box.ymin) * 100;
              }

              // Apply manual nudge offsets
              top += adj.deltaY;
              left += adj.deltaX;

              // Clamp coordinates within manga boundaries
              top = Math.max(0.2, Math.min(97.5, top));
              left = Math.max(0.2, Math.min(97.5, left));
              width = Math.max(5.5, Math.min(98 - left, width));
              height = Math.max(3.2, Math.min(98 - top, height));

              // Match translated lettering to the actual detected source rectangle.
              const imageRect = imgRef.current?.getBoundingClientRect();
              const regionWidthPx = Math.max(1, (imageRect?.width || 640) * width / 100);
              const regionHeightPx = Math.max(1, (imageRect?.height || 900) * height / 100);
              const displayText = adj.showOriginal ? item.originalText : adj.customText || item.translatedText;
              const isVertical = item.direction === 'vertical';
              const fontFamily = targetLangCode === 'bn'
                ? 'Noto Sans Bengali, sans-serif'
                : targetLangCode === 'hi' ? 'Noto Sans Devanagari, sans-serif' : 'system-ui, sans-serif';
              const hierarchyScale = item.fontSize === 'small' || item.type === 'caption' ? 0.88
                : item.fontSize === 'extra-large' || item.type === 'heading' ? 1.12
                : item.fontSize === 'large' ? 1.05 : 1;
              const fittedSize = fitOverlayFontSize(displayText || '', Math.max(8, regionWidthPx - 2), Math.max(8, regionHeightPx - 2), fontFamily, 500);\n              // Normal manga lettering, not oversized translated bubbles.\n              const fontSize = `${Math.max(6, Math.min(12, fittedSize * hierarchyScale * 0.82))}px`;

              const isDark = item.background === 'dark' || item.fontColor === 'white';
              const isRed = item.fontColor === 'red' || (isVertical && !isDark);

              // Google Lens style inpainting / seamless speech bubble matching
              let bubbleClasses =
                'bg-white/96 text-slate-950 rounded-none shadow-none border-0';

              if (isVertical) {
                // Vertical banner like "HE CRAVES MONEY!" ("সে টাকার জন্য আকুল!")
                bubbleClasses = isRed
                  ? 'bg-white/96 text-red-700 font-semibold rounded-none shadow-none border-0'
                  : 'bg-white/96 text-slate-950 font-semibold rounded-none shadow-none border-0';
              } else if (item.type === 'thought') {
                bubbleClasses = 'bg-white/96 text-slate-950 rounded-none shadow-none border-0';
              } else if (item.type === 'sfx') {
                bubbleClasses = isDark
                  ? 'bg-black/94 text-amber-200 font-semibold tracking-normal rounded-none shadow-none border-0'
                  : 'bg-white/96 text-red-700 font-semibold tracking-normal rounded-none shadow-none border-0';
              } else if (item.type === 'narration' || item.type === 'heading') {
                bubbleClasses = isDark
                  ? 'bg-slate-950/95 text-slate-100 rounded-md border border-slate-700/80 font-medium'
                  : 'bg-white/94 text-slate-950 rounded-sm border-0 font-medium';
              } else if (isDark) {
                bubbleClasses = 'bg-slate-950/95 text-slate-100 rounded-[35%] sm:rounded-[45%] shadow-sm border border-slate-800';
              }

              const isSelected = selectedDialogueId === item.id;

              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDialogueId(isSelected ? null : item.id);
                    setIsEditingText(false);
                    setTempEditText(adj.customText || item.translatedText);
                  }}
                  style={{
                    top: `${top}%`,
                    left: `${left}%`,
                    width: `${width}%`,
                    minHeight: `${height}%`,
                    writingMode: isVertical ? 'vertical-rl' : 'horizontal-tb',
                  }}
                  className={`absolute p-0 flex flex-col items-center justify-center text-center overflow-hidden pointer-events-auto leading-none cursor-pointer transition-colors ${bubbleClasses} ${fontClass} ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 shadow-xl z-30'
                      : ''
                  }`}
                  title="Tap to inspect original text or adjust alignment (Google Lens)"
                >
                  <span
                    style={{ fontSize, lineHeight: 1.08, letterSpacing: '-0.01em', overflowWrap: 'anywhere', textShadow: 'none' }}
                    className={`break-words w-full select-none ${
                      item.type === 'sfx' || item.type === 'heading' ? 'font-black' : 'font-bold'
                    } ${adj.showOriginal ? 'italic text-indigo-900 dark:text-indigo-200' : ''}`}
                  >
                    {displayText}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* GOOGLE LENS REGION INSPECTOR & ALIGNMENT MODAL / POPOVER */}
        {activeDialogue && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-slate-950/95 text-white border border-indigo-500/60 shadow-2xl rounded-2xl p-3 z-40 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-150"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Lens Region #{activeDialogue.id}</span>
                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 uppercase">
                  {activeDialogue.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedDialogueId(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Original vs Translated Content */}
            <div className="space-y-1.5 text-xs">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
                  <Languages className="w-3 h-3 text-slate-400" />
                  <span>Original ({activeDialogue.detectedLanguage || 'Source'}):</span>
                </div>
                <div className="text-slate-200 font-medium select-text break-words">
                  {activeDialogue.originalText || '(Visual gesture / SFX)'}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60">
                <div className="text-[10px] text-indigo-300 font-semibold mb-0.5 flex items-center justify-between">
                  <span>Translated ({targetLangCode.toUpperCase()}):</span>
                  {!isEditingText && (
                    <button
                      onClick={() => setIsEditingText(true)}
                      className="text-[10px] text-indigo-300 hover:text-white flex items-center gap-1 underline cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {isEditingText ? (
                  <div className="space-y-1.5 mt-1">
                    <input
                      type="text"
                      value={tempEditText}
                      onChange={(e) => setTempEditText(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-indigo-400 rounded text-xs text-white focus:outline-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setIsEditingText(false)}
                        className="px-2 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveCustomText}
                        className="px-2.5 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-500 rounded text-white font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-white font-semibold select-text break-words">
                    {regionAdjustments[activeDialogue.id]?.customText || activeDialogue.translatedText}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Bar: Toggle & Nudge Controls */}
            <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={handleToggleOriginal}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  regionAdjustments[activeDialogue.id]?.showOriginal
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title="Toggle between original script and translated overlay"
              >
                <Eye className="w-3 h-3" />
                <span>
                  {regionAdjustments[activeDialogue.id]?.showOriginal ? 'Show Translated' : 'Show Original'}
                </span>
              </button>

              {/* Nudge arrows for manual alignment calibration */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-400 mr-0.5">Nudge:</span>
                <button
                  onClick={() => handleNudge(0, -1)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Nudge Up 1%"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleNudge(0, 1)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Nudge Down 1%"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleNudge(-1, 0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Nudge Left 1%"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleNudge(1, 0)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                  title="Nudge Right 1%"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Page Status Badges */}
        {isTranslating ? (
          <div className="absolute top-3 right-3 bg-indigo-600/95 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 border border-indigo-400/40 z-20 pointer-events-none animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin text-yellow-300" />
            <span>Translating P.{pageNumber}...</span>
          </div>
        ) : isTranslatedView && !hasTranslations ? (
          <div className="absolute top-3 right-3 max-w-[85%] flex flex-col items-end gap-1.5 z-20">
            {translatedData?.rateLimited ? (
              <button
                onClick={handleTriggerTranslate}
                className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 border border-amber-400/40 cursor-pointer transition-transform active:scale-95"
                title={translatedData.notice || `Cooldown (${translatedData.retryInSeconds || 25}s). Tap to retry.`}
              >
                <RefreshCw className="w-3 h-3 text-yellow-200" />
                <span>Cooldown ({translatedData.retryInSeconds || 25}s) · Retry</span>
              </button>
            ) : translatedData?.provider === 'untranslated' ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-950/95 border border-rose-500/50 text-slate-100 rounded-xl px-3 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2.5 max-w-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div className="text-[11px] leading-snug text-left min-w-0">
                  <span className="font-semibold text-rose-200 block">
                    {translatedData.notice || 'Translation could not be completed.'}
                  </span>
                </div>
                <button
                  onClick={handleTriggerTranslate}
                  className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold shrink-0 cursor-pointer flex items-center gap-1"
                  title="Retry page translation"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleTriggerTranslate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-xl flex items-center gap-1.5 border border-indigo-400/40 cursor-pointer transition-transform active:scale-95"
                title={`Translate Page ${pageNumber}`}
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>
                  {translatedData?.provider === 'gemini-vision-empty'
                    ? `No Text · Re-scan P.${pageNumber}`
                    : `Translate Page ${pageNumber}`}
                </span>
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
