import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Hash, ArrowRight } from 'lucide-react';

export interface PaginationWithJumpProps {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  hasNextPage: boolean;
  onPageChange: (newPage: number) => void;
  targetScrollId?: string;
  itemName?: string;
}

export const PaginationWithJump: React.FC<PaginationWithJumpProps> = ({
  currentPage,
  totalPages,
  totalItems,
  hasNextPage,
  onPageChange,
  targetScrollId = 'catalog-grid-top',
  itemName = 'anime',
}) => {
  const [jumpInput, setJumpInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const effectiveTotalPages = totalPages && totalPages > 0 ? totalPages : (hasNextPage ? currentPage + 1 : currentPage);

  const scrollToTarget = () => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById(targetScrollId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handlePageSelect = (page: number) => {
    if (page === currentPage || page < 1) return;
    if (totalPages && page > totalPages) return;
    onPageChange(page);
    scrollToTarget();
  };

  const handleJumpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const target = parseInt(jumpInput.trim(), 10);
    if (isNaN(target) || target < 1) {
      setInputError('Enter a valid page number (1+)');
      return;
    }
    if (totalPages && target > totalPages) {
      setInputError(`Maximum page is ${totalPages}`);
      return;
    }
    if (target > 5000) {
      setInputError('Maximum page is 5000');
      return;
    }
    setJumpInput('');
    onPageChange(target);
    scrollToTarget();
  };

  // Generate dynamic smart page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    const maxVisible = 5;

    if (!totalPages || totalPages <= 7) {
      const max = totalPages || (hasNextPage ? currentPage + 1 : currentPage);
      for (let i = 1; i <= max; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Always include page 1
    pages.push(1);

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) {
      pages.push('ellipsis-start');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('ellipsis-end');
    }

    // Always include last page
    pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col items-center justify-center gap-3.5 pt-8 pb-4 border-t border-slate-800/80 w-full animate-in fade-in duration-200">
      {/* Total Count and Page Status Indicator */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <span>Page <strong className="text-white font-bold">{currentPage}</strong> of <strong className="text-indigo-300 font-bold">{effectiveTotalPages}</strong></span>
        {totalItems !== undefined && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-slate-300 font-medium">
              {totalItems >= 50000
                ? '50,000+'
                : totalItems === 45000
                ? '45,000+'
                : totalItems === 30000
                ? '30,000+'
                : totalItems.toLocaleString()}{' '}
              {itemName} total
            </span>
          </>
        )}
      </div>

      {/* Primary pagination row: First, Prev, Direct page buttons, Next, Last */}
      <div className="flex items-center justify-center flex-wrap gap-1 sm:gap-1.5">
        {/* First Page Button */}
        <button
          onClick={() => handlePageSelect(1)}
          disabled={currentPage <= 1}
          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
          title="First Page"
          aria-label="First Page"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">First</span>
        </button>

        {/* Prev Page Button */}
        <button
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
          title="Previous Page"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        {/* Page Number Buttons with Ellipsis */}
        {pageNumbers.map((p, idx) => {
          if (p === 'ellipsis-start' || p === 'ellipsis-end') {
            return (
              <span
                key={`${p}-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-slate-500 font-mono text-xs select-none"
              >
                ···
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={p}
              onClick={() => handlePageSelect(p)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'bg-indigo-600 text-white border border-indigo-400/50 shadow-md shadow-indigo-600/30 ring-2 ring-indigo-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 active:scale-95'
              }`}
              title={`Page ${p}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {p}
            </button>
          );
        })}

        {/* Next Page Button */}
        <button
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={totalPages ? currentPage >= totalPages : !hasNextPage}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
          title="Next Page"
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page Button */}
        {totalPages && totalPages > 1 && (
          <button
            onClick={() => handlePageSelect(totalPages)}
            disabled={currentPage >= totalPages}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
            title={`Last Page (Page ${totalPages})`}
            aria-label="Last Page"
          >
            <span className="hidden sm:inline text-[11px]">Last</span>
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Interactive Jump to Page Control */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs text-slate-400">
        <form
          onSubmit={handleJumpSubmit}
          className="flex items-center gap-1.5 bg-slate-900/95 border border-slate-800 hover:border-slate-700 rounded-xl px-2.5 py-1.5 shadow-inner transition-colors"
        >
          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
            <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Jump to:</span>
          </div>
          <input
            type="number"
            min={1}
            max={effectiveTotalPages}
            value={jumpInput}
            onChange={(e) => {
              setJumpInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            placeholder={String(currentPage)}
            className="w-16 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-lg px-2 py-0.5 text-xs text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
            aria-label="Page number to jump to"
          />
          <button
            type="submit"
            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
            title="Jump to specified page"
          >
            <span>Jump</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </form>

        {/* Quick jump presets */}
        {effectiveTotalPages > 3 && (
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
            <span className="mr-0.5 font-medium">Quick:</span>
            {[1, Math.min(5, effectiveTotalPages), Math.min(10, effectiveTotalPages), effectiveTotalPages]
              .filter((val, i, arr) => arr.indexOf(val) === i)
              .map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => handlePageSelect(quick)}
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-colors cursor-pointer ${
                    quick === currentPage
                      ? 'bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/60'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  P.{quick}
                </button>
              ))}
          </div>
        )}
      </div>

      {inputError && (
        <p className="text-[11px] text-rose-400 font-medium animate-in fade-in" role="alert">
          {inputError}
        </p>
      )}
    </div>
  );
};
