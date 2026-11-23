import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Split,
  Columns,
  Layers,
  Sparkles,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Sliders,
  MessageSquare,
  Globe,
  ArrowRight,
  Maximize2,
  Minimize2,
  CheckCircle2,
} from 'lucide-react';
import { ALL_WORLD_LANGUAGES } from './GoogleAITranslator';
import {
  translateMangaPage,
  TranslatedMangaPageResult,
  MangaPageDialogue,
} from '../services/translator';

interface Props {
  pages: string[];
  initialPageNumber?: number;
  mangaTitle: string;
  chapterNumber: string;
  defaultTargetLang?: string;
  onClose: () => void;
  onSelectPage?: (pageIndex: number) => void;
}

type DiffMode = 'split' | 'side-by-side' | 'overlay' | 'blend';

export const MangaPageDifferenceViewer: React.FC<Props> = ({
  pages,
  initialPageNumber = 1,
  mangaTitle,
  chapterNumber,
  defaultTargetLang = 'bn',
  onClose,
  onSelectPage,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(
    Math.min(pages.length, Math.max(1, initialPageNumber))
  );
  const [targetLang, setTargetLang] = useState<string>(defaultTargetLang);
  const [diffMode, setDiffMode] = useState<DiffMode>('split');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0 to 100
  const [blendOpacity, setBlendOpacity] = useState<number>(100); // 0 to 100
  const [loading, setLoading] = useState<boolean>(false);
  const [pageData, setPageData] = useState<TranslatedMangaPageResult | null>(null);
  const [activeDialogueId, setActiveDialogueId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [translatedPagesSet, setTranslatedPagesSet] = useState<Set<number>>(new Set());
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef<boolean>(false);

  const currentImageUrl = pages[currentPage - 1] || '';
  const totalPages = pages.length;

  const currentLangObj =
    ALL_WORLD_LANGUAGES.find((l) => l.code === targetLang) || ALL_WORLD_LANGUAGES[0];

  const [reloadNonce, setReloadNonce] = useState(0);

  // Load / translate current page
  useEffect(() => {
    let isMounted = true;
    if (!currentImageUrl) return;

    setLoading(true);
    setActiveDialogueId(null);

    const isInlineData = currentImageUrl.startsWith('data:image/');

    translateMangaPage({
      imageUrl: isInlineData ? '' : currentImageUrl,
      imageDataBase64: isInlineData ? currentImageUrl : undefined,
      pageNumber: currentPage,
      chapterNumber,
      mangaTitle,
      targetLanguage: targetLang,
      force: reloadNonce > 0,
    })
      .then((data) => {
        if (isMounted) {
          setPageData(data);
          setLoading(false);
          if (data.dialogues && data.dialogues.length > 0 && data.provider !== 'untranslated') {
            setTranslatedPagesSet((prev) => new Set(prev).add(currentPage));
          }
        }
      })
      .catch((err) => {
        console.warn('Page translation error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, targetLang, currentImageUrl, chapterNumber, mangaTitle, reloadNonce]);

  // Handle keyboard navigation (Left/Right arrow keys for page turning)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onSelectPage?.(newPage);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onSelectPage?.(newPage);
    }
  };

  // Dragging split comparison slider
  const handleSplitMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplit.current = true;
  };

  const handleSplitMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSplit.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handleSplitMouseUp = () => {
    isDraggingSplit.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPos(pct);
  };

  const handleCopyDialogue = (dialogue: MangaPageDialogue) => {
    navigator.clipboard.writeText(dialogue.translatedText);
    setCopiedId(dialogue.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakDialogue = (dialogue: MangaPageDialogue) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (speakingId === dialogue.id) {
      setSpeakingId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(dialogue.translatedText);
    utterance.lang = currentLangObj.speechLang || 'bn-BD';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(dialogue.id);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden text-white font-sans animate-in fade-in duration-200">
      {/* 1. Header Toolbar */}
      <header className="px-3 sm:px-6 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                Full Manga Page AI Translator & Difference
              </h2>
              <span className="hidden md:inline px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-700/60 text-[10px] font-semibold text-indigo-300">
                Visual OCR & Diff
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {mangaTitle} · Ch. {chapterNumber} · Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {/* Center / Right Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Target Language Dropdown */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
              title="Target Language (e.g. Bangla, Hindi, English)"
            >
              {ALL_WORLD_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-slate-900 text-white">
                  {lang.flag} {lang.name} ({lang.nativeName})
                </option>
              ))}
            </select>
          </div>

          {/* Difference Mode Switcher */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setDiffMode('split')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                diffMode === 'split' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Split Comparison Slider (Interactive Before/After difference)"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Split Diff</span>
            </button>
            <button
              onClick={() => setDiffMode('overlay')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                diffMode === 'overlay' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Translated Speech Bubbles Overlay"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Overlay</span>
            </button>
            <button
              onClick={() => setDiffMode('side-by-side')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                diffMode === 'side-by-side' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Dual Side-by-Side View"
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Side-by-Side</span>
            </button>
            <button
              onClick={() => setDiffMode('blend')}
              className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-colors ${
                diffMode === 'blend' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title="Opacity Difference Blend"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Blend</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Difference Inspector (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Page Navigation Bar (Pages 1 to 56 / 1 to N) */}
      <div className="px-3 sm:px-6 py-2 bg-slate-900/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Prev / Next / Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            title="Previous Page (Left Arrow)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Prev Page</span>
          </button>

          {/* Quick Page Jump Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
            <span className="text-[11px] font-mono text-slate-400 font-semibold">Page:</span>
            <select
              value={currentPage}
              onChange={(e) => {
                const p = parseInt(e.target.value, 10);
                setCurrentPage(p);
                onSelectPage?.(p);
              }}
              className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p} className="bg-slate-900 text-white">
                  Page {p} {translatedPagesSet.has(p) ? '✓ Translated' : ''}
                </option>
              ))}
            </select>
            <span className="text-[11px] font-mono text-slate-400">/ {totalPages}</span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-xs font-semibold text-white flex items-center gap-1 transition-colors shadow cursor-pointer"
            title="Next Page (Right Arrow)"
          >
            <span className="hidden xs:inline">Next Page</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Thumbnails Drawer Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              showThumbnails
                ? 'bg-indigo-950 border-indigo-700 text-indigo-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
            title="Show All Pages 1-56 Grid"
          >
            All {totalPages} Pages
          </button>
        </div>

        {/* Right: Difference Hint / Slider Bar */}
        <div className="flex items-center gap-3 text-xs">
          {diffMode === 'split' && (
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[11px] text-slate-400 hidden md:inline">Drag divider:</span>
              <span className="font-mono text-[11px] text-indigo-300 font-bold">{Math.round(splitPos)}%</span>
              <input
                type="range"
                min="0"
                max="100"
                value={splitPos}
                onChange={(e) => setSplitPos(Number(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-lg accent-indigo-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">
                <span className="text-emerald-400">Original</span> ◄► <span className="text-indigo-400">Translated</span>
              </span>
            </div>
          )}

          {diffMode === 'blend' && (
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[11px] text-slate-400">Overlay Blend:</span>
              <input
                type="range"
                min="0"
                max="100"
                value={blendOpacity}
                onChange={(e) => setBlendOpacity(Number(e.target.value))}
                className="w-24 sm:w-32 h-1.5 bg-slate-800 rounded-lg accent-indigo-500 cursor-pointer"
              />
              <span className="font-mono text-[11px] text-indigo-300 font-bold">{blendOpacity}%</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 animate-pulse font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Translating Page {currentPage}...</span>
            </div>
          )}
        </div>
      </div>

      {/* Pages 1-56 Quick Drawer */}
      {showThumbnails && (
        <div className="p-3 bg-slate-900 border-b border-slate-800 max-h-36 overflow-x-auto overflow-y-hidden flex items-center gap-2.5 shrink-0">
          {pages.map((imgUrl, idx) => {
            const pageNum = idx + 1;
            const isSelected = pageNum === currentPage;
            const isTranslated = translatedPagesSet.has(pageNum);
            return (
              <button
                key={pageNum}
                onClick={() => {
                  setCurrentPage(pageNum);
                  onSelectPage?.(pageNum);
                }}
                className={`flex-shrink-0 flex flex-col items-center p-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/80 ring-2 ring-indigo-500/50 scale-105'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="w-14 h-20 bg-slate-800 rounded overflow-hidden relative flex items-center justify-center">
                  <img
                    src={imgUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isTranslated && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500" title="Translated" />
                  )}
                </div>
                <span className="text-[10px] font-mono mt-1 text-slate-300 font-semibold">
                  P.{pageNum}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Main Difference Canvas & Dialogue Breakdown */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left/Main: Visual Difference Canvas */}
        <div
          ref={containerRef}
          onMouseMove={handleSplitMouseMove}
          onMouseUp={handleSplitMouseUp}
          onTouchMove={handleTouchMove}
          className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center select-none p-2 sm:p-4 min-h-[50vh]"
        >
          {loading && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center z-30">
              <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-bold text-white">
                Reading Manga Page {currentPage} with AI Vision...
              </p>
              <p className="text-xs text-indigo-300 mt-1">
                Translating dialogues & SFX into {currentLangObj.name} ({currentLangObj.nativeName})
              </p>
            </div>
          )}

          {/* MODE 1: Split Difference Slider (interactive before/after) */}
          {diffMode === 'split' && (
            <div className="relative max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-slate-800">
              {/* Layer 1 (Full): Original Manga Page */}
              <img
                src={currentImageUrl}
                alt={`Original Page ${currentPage}`}
                className="max-h-[75vh] w-auto object-contain block pointer-events-none"
              />

              {/* Layer 2 (Clipped): Translated Page with Overlays */}
              <div
                style={{
                  clipPath: `polygon(${splitPos}% 0, 100% 0, 100% 100%, ${splitPos}% 100%)`,
                }}
                className="absolute inset-0 w-full h-full pointer-events-none transition-none"
              >
                {/* Background image identical for alignment */}
                <img
                  src={currentImageUrl}
                  alt={`Translated Page ${currentPage}`}
                  className="w-full h-full object-contain block opacity-95"
                />

                {/* Overlaid translated speech bubbles with clean background covering original text */}
                {pageData?.dialogues.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      top: `${item.top}%`,
                      left: `${item.left}%`,
                      width: `${item.width}%`,
                      minHeight: `${item.height}%`,
                    }}
                    className={`absolute p-2 rounded-2xl leading-snug flex items-center justify-center text-center shadow-lg pointer-events-auto transition-transform manga-bubble-text ${
                      item.type === 'thought'
                        ? 'bg-white text-slate-950 border border-slate-300'
                        : item.type === 'sfx'
                        ? 'bg-amber-100/90 text-amber-950 font-black tracking-wide'
                        : item.type === 'narration'
                        ? 'bg-slate-950/90 text-slate-100 border border-slate-700 font-serif'
                        : 'bg-white text-slate-950 border border-slate-200'
                    }`}
                  >
                    <span
                      style={{
                        fontSize: item.width > 25 ? '13px' : '11px',
                        lineHeight: '1.25',
                      }}
                      className="font-semibold block"
                    >
                      {item.translatedText}
                    </span>
                  </div>
                ))}
              </div>

              {/* Draggable Divider Handle */}
              <div
                style={{ left: `${splitPos}%` }}
                onMouseDown={handleSplitMouseDown}
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-40 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.7)]"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold">
                  ◄►
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: Overlay Mode (Full image with speech bubbles in place) */}
          {diffMode === 'overlay' && (
            <div className="relative max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-slate-800">
              <img
                src={currentImageUrl}
                alt={`Page ${currentPage}`}
                className="max-h-[75vh] w-auto object-contain block"
              />

              {pageData?.dialogues.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveDialogueId(item.id)}
                  style={{
                    top: `${item.top}%`,
                    left: `${item.left}%`,
                    width: `${item.width}%`,
                    minHeight: `${item.height}%`,
                  }}
                  className={`absolute p-2 rounded-2xl leading-snug flex items-center justify-center text-center shadow-md cursor-pointer transition-all manga-bubble-text ${
                    activeDialogueId === item.id ? 'ring-2 ring-indigo-500 scale-102 z-30' : 'z-20 hover:scale-101'
                  } ${
                    item.type === 'thought'
                      ? 'bg-white text-slate-950 border border-slate-300'
                      : item.type === 'sfx'
                      ? 'bg-amber-100/90 text-amber-950 font-black'
                      : item.type === 'narration'
                      ? 'bg-slate-950/90 text-slate-100 border border-slate-700 font-serif'
                      : 'bg-white text-slate-950 border border-slate-200'
                  }`}
                  title={`Original: "${item.originalText}"`}
                >
                  <span
                    style={{
                      fontSize: item.width > 25 ? '13px' : '11px',
                      lineHeight: '1.25',
                    }}
                    className="font-semibold block"
                  >
                    {item.translatedText}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* MODE 3: Dual Side-by-Side View */}
          {diffMode === 'side-by-side' && (
            <div className="w-full h-full flex items-center justify-center gap-3 sm:gap-6 overflow-auto p-2">
              {/* Left Column: Original Scan */}
              <div className="flex-1 flex flex-col items-center max-w-[48%]">
                <div className="rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
                  <img
                    src={currentImageUrl}
                    alt="Original"
                    className="max-h-[70vh] w-auto object-contain block"
                  />
                </div>
              </div>

              {/* Right Column: Translated Overlay */}
              <div className="flex-1 flex flex-col items-center max-w-[48%] relative">
                <div className="rounded-xl overflow-hidden border border-indigo-700/60 shadow-xl bg-slate-900 relative">
                  <img
                    src={currentImageUrl}
                    alt="Translated"
                    className="max-h-[70vh] w-auto object-contain block"
                  />

                  {pageData?.dialogues.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        top: `${item.top}%`,
                        left: `${item.left}%`,
                        width: `${item.width}%`,
                        minHeight: `${item.height}%`,
                      }}
                      className={`absolute p-1 sm:p-2 rounded-xl text-[10px] sm:text-xs font-semibold leading-tight flex flex-col justify-center text-center shadow-xl bg-white/95 text-slate-950 border-2 border-slate-900 ${
                        targetLang === 'bn' ? 'font-bengali' : targetLang === 'hi' ? 'font-devanagari' : 'manga-bubble-text'
                      }`}
                    >
                      <span>{item.translatedText}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: Opacity Blend Mode */}
          {diffMode === 'blend' && (
            <div className="relative max-h-full max-w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-slate-800">
              <img
                src={currentImageUrl}
                alt={`Blend Page ${currentPage}`}
                className="max-h-[75vh] w-auto object-contain block"
              />

              <div
                style={{ opacity: blendOpacity / 100 }}
                className="absolute inset-0 w-full h-full pointer-events-none transition-opacity"
              >
                {pageData?.dialogues.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      top: `${item.top}%`,
                      left: `${item.left}%`,
                      width: `${item.width}%`,
                      minHeight: `${item.height}%`,
                    }}
                    className="absolute p-1.5 rounded-xl text-xs font-semibold leading-tight text-center bg-white/95 text-slate-950 border-2 border-slate-900 shadow-xl pointer-events-auto"
                  >
                    <span>{item.translatedText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right / Bottom: Extracted Dialogue Script & Speech Breakdown */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 max-h-64 lg:max-h-full overflow-hidden">
          {/* Header */}
          <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">
                Detected Dialogues ({pageData?.dialogues.length || 0})
              </span>
            </div>
            {pageData?.summaryTranslated && (
              <span className="text-[10px] text-indigo-300 font-medium truncate max-w-[180px]">
                {pageData.summaryTranslated}
              </span>
            )}
          </div>

          {/* Dialogue List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/60">
            {pageData?.dialogues && pageData.dialogues.length > 0 ? (
              pageData.dialogues.map((dialogue) => {
                const isActive = activeDialogueId === dialogue.id;
                const isSpeaking = speakingId === dialogue.id;
                const isCopied = copiedId === dialogue.id;

                return (
                  <div
                    key={dialogue.id}
                    onClick={() => setActiveDialogueId(dialogue.id)}
                    className={`pt-2.5 first:pt-0 cursor-pointer rounded-lg p-2 transition-all ${
                      isActive ? 'bg-indigo-950/60 ring-1 ring-indigo-500' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Badge & Speaker */}
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                          #{dialogue.id}
                        </span>
                        <span className="text-indigo-300 font-semibold text-[11px]">
                          {dialogue.speaker || 'Character'}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-mono font-semibold ${
                            dialogue.type === 'thought'
                              ? 'bg-blue-950 text-blue-300'
                              : dialogue.type === 'sfx'
                              ? 'bg-amber-950 text-amber-300'
                              : dialogue.type === 'narration'
                              ? 'bg-purple-950 text-purple-300'
                              : 'bg-emerald-950 text-emerald-300'
                          }`}
                        >
                          {dialogue.type}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeakDialogue(dialogue);
                          }}
                          className={`p-1 rounded hover:bg-slate-700 transition-colors ${
                            isSpeaking ? 'text-indigo-400 animate-pulse' : 'text-slate-400'
                          }`}
                          title="Listen pronunciation"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyDialogue(dialogue);
                          }}
                          className="p-1 rounded hover:bg-slate-700 text-slate-400 transition-colors"
                          title="Copy translated dialogue"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Translated Text (Bangla / Hindi / etc.) */}
                    <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                      {dialogue.translatedText}
                    </p>

                    {/* Original Transcribed Text */}
                    <p className="text-[11px] text-slate-400 mt-1 font-serif italic">
                      "{dialogue.originalText}"
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 px-3 text-center text-xs text-slate-400 space-y-3">
                <p className={pageData?.provider === 'untranslated' ? 'text-rose-300 font-semibold' : 'text-slate-300'}>
                  {pageData?.notice || 'No dialogues detected yet for this page.'}
                </p>
                <button
                  onClick={() => setReloadNonce((n) => n + 1)}
                  disabled={loading}
                  className="mx-auto px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Retry Translation</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Quick Action */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400">
              Provider: <span className="font-mono text-indigo-400">{pageData?.provider || 'Gemini Vision'}</span>
            </span>

            {currentPage < totalPages && (
              <button
                onClick={goToNextPage}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
              >
                <span>Next: P.{currentPage + 1}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
