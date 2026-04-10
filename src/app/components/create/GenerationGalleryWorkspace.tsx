import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Gem,
  Heart,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';

import { ImageWithFallback } from '../figma/ImageWithFallback';
import {
  DESIGNS_UPDATED_EVENT,
  readStoredSession,
  searchBackendGallery,
} from '../../services/skygemsApi';
import {
  type DesignMetadata,
  getCachedDesigns,
  getAllDesigns,
  likeDesign,
  unlikeDesign,
} from '../../services/storageService';

export interface PendingGalleryItem {
  id: string;
  order: number;
  requestedAt: number;
  type: string;
  metal: string;
  gemstones: string[];
  style: string;
  message: string;
}

export interface GenerationActivitySummary {
  status: 'idle' | 'running' | 'completed' | 'error';
  totalCount: number;
  completedCount: number;
  pendingCount: number;
  headline: string;
  detail: string;
  errorMessage?: string;
}

type DateGranularity = 'all' | 'year' | 'month' | 'day';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function titleize(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDate(value: number) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function downloadImage(url?: string, filename = 'skygems-design.png') {
  if (!url) {
    return;
  }

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function matchesDateFilter(
  timestamp: number,
  granularity: DateGranularity,
  yearFilter: string,
  monthFilter: string,
  dayFilter: string,
) {
  if (granularity === 'all') {
    return true;
  }

  const date = new Date(timestamp);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());

  if (granularity === 'year') {
    return yearFilter === 'all' ? true : year === yearFilter;
  }

  if (granularity === 'month') {
    const matchesYear = yearFilter === 'all' ? true : year === yearFilter;
    const matchesMonth = monthFilter === 'all' ? true : month === monthFilter;
    return matchesYear && matchesMonth;
  }

  const matchesYear = yearFilter === 'all' ? true : year === yearFilter;
  const matchesMonth = monthFilter === 'all' ? true : month === monthFilter;
  const matchesDay = dayFilter === 'all' ? true : day === dayFilter;
  return matchesYear && matchesMonth && matchesDay;
}

function buildDesignTitle(design: DesignMetadata) {
  return `${titleize(design.features.type)} · ${titleize(design.features.style)}`;
}

function GenerationDetailModal({
  design,
  onClose,
  onLikeToggle,
}: {
  design: DesignMetadata;
  onClose: () => void;
  onLikeToggle: (design: DesignMetadata) => void;
}) {
  const [promptExpanded, setPromptExpanded] = useState(false);

  const variationRows = [
    design.features.variation.bandStyle,
    design.features.variation.settingType,
    design.features.variation.stonePosition,
    design.features.variation.profile,
    design.features.variation.motif,
  ].filter(Boolean);

  const promptText = design.prompt || 'Prompt summary will appear here when available.';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative flex w-full max-w-5xl mx-4"
          style={{ maxHeight: 'calc(100vh - 64px)' }}
          onClick={(event) => event.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute -right-2 -top-10 z-20 flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-all hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          {/* LEFT — Image centered on dark background */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden rounded-l-xl bg-black"
            style={{ minWidth: 0 }}
          >
            {design.imageUrl ? (
              <ImageWithFallback
                src={design.imageUrl}
                alt={buildDesignTitle(design)}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Gem className="h-16 w-16 text-slate-700" />
              </div>
            )}

            {/* Bottom bar on image — like/download icons */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLikeToggle(design)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              >
                <Heart className={`h-4 w-4 ${design.liked ? 'fill-current text-red-400' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => downloadImage(design.imageUrl, `${design.id}.png`)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>

            {/* ID badge bottom right */}
            <div className="absolute bottom-3 right-3">
              <span className="text-[10px] text-white/40">Created {formatDate(design.createdAt)}</span>
            </div>
          </div>

          {/* RIGHT — Compact details panel */}
          <div
            className="flex w-[280px] flex-col overflow-hidden rounded-r-xl bg-[#1a1a1a]"
            style={{ flexShrink: 0 }}
          >
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h2 className="text-sm font-semibold text-white leading-snug">
                    {buildDesignTitle(design)}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/40">
                    {formatDate(design.createdAt)}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-px bg-white/10" />

                {/* Settings as compact rows */}
                <div className="space-y-2">
                  {[
                    ['Type', titleize(design.features.type)],
                    ['Metal', titleize(design.features.metal)],
                    ['Style', titleize(design.features.style)],
                    ['Complexity', `${design.features.complexity}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-white/40">{label}</span>
                      <span className="font-medium text-white/80">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Gemstones */}
                {design.features.gemstones.length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
                        Gemstones
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {design.features.gemstones.map((gem) => (
                          <span
                            key={gem}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/70"
                            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                          >
                            {titleize(gem)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Design Features / Variations */}
                {variationRows.length > 0 && (
                  <>
                    <div className="h-px bg-white/10" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-1.5">
                        Features
                      </p>
                      <div className="space-y-1">
                        {variationRows.map((row) => (
                          <div key={row} className="flex items-center gap-1.5 text-[11px] text-white/60">
                            <span className="h-1 w-1 rounded-full bg-violet-400 flex-shrink-0" />
                            <span>{titleize(row)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Prompt (collapsible) */}
                <div className="h-px bg-white/10" />
                <div>
                  <button
                    type="button"
                    onClick={() => setPromptExpanded(!promptExpanded)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                      Prompt
                    </p>
                    {promptExpanded ? (
                      <ChevronUp className="h-3 w-3 text-white/30" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-white/30" />
                    )}
                  </button>
                  <p className={`mt-1.5 text-[11px] leading-4 text-white/50 ${promptExpanded ? '' : 'line-clamp-3'}`}>
                    {promptText}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom actions */}
            <div className="border-t border-white/10 p-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLikeToggle(design)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all"
                style={{
                  backgroundColor: design.liked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.06)',
                  color: design.liked ? '#f87171' : 'rgba(255,255,255,0.6)',
                }}
              >
                <Heart className={`h-3.5 w-3.5 ${design.liked ? 'fill-current' : ''}`} />
                {design.liked ? 'Favorited' : 'Favorite'}
              </button>
              <button
                type="button"
                onClick={() => downloadImage(design.imageUrl, `${design.id}.png`)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white/60 transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <Download className="h-3.5 w-3.5" />
                Save
              </button>
              <Link
                to={`/app/preview/${design.id}`}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium text-white/60 transition-all"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </Link>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function GenerationGalleryWorkspace({
  pendingItems,
  activity,
}: {
  pendingItems: PendingGalleryItem[];
  activity: GenerationActivitySummary | null;
}) {
  const session = readStoredSession();
  const [designs, setDesigns] = useState<DesignMetadata[]>(() => getCachedDesigns('mine'));
  const [loading, setLoading] = useState(() => getCachedDesigns('mine').length === 0);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [granularity, setGranularity] = useState<DateGranularity>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDesigns = async (options: { silent?: boolean } = {}) => {
      try {
        if (options.silent) {
          if (!cancelled) {
            setRefreshing(true);
          }
        } else if (!cancelled) {
          setLoading(true);
        }
        const loaded = await searchBackendGallery('', 'mine');
        if (!cancelled) {
          setDesigns(loaded);
        }
      } catch (error) {
        console.warn('[SkyGems] Falling back to local gallery cache:', error);
        if (!cancelled) {
          setDesigns(getAllDesigns());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    const handleRefresh = () => {
      void loadDesigns({ silent: true });
    };

    void loadDesigns();
    window.addEventListener(DESIGNS_UPDATED_EVENT, handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(DESIGNS_UPDATED_EVENT, handleRefresh);
    };
  }, []);

  const selectedDesign = useMemo(
    () => designs.find((design) => design.id === selectedDesignId) ?? null,
    [designs, selectedDesignId],
  );

  const years = useMemo(() => {
    const allDates = [...designs.map((design) => design.createdAt), ...pendingItems.map((item) => item.requestedAt)];
    return Array.from(new Set(allDates.map((value) => String(new Date(value).getFullYear())))).sort(
      (left, right) => Number(right) - Number(left),
    );
  }, [designs, pendingItems]);

  const designTypes = useMemo(() => {
    return Array.from(
      new Set([
        ...designs.map((design) => design.features.type),
        ...pendingItems.map((item) => item.type),
      ]),
    ).sort((left, right) => left.localeCompare(right));
  }, [designs, pendingItems]);

  const filteredDesigns = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return designs.filter((design) => {
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : [
              design.prompt,
              design.features.type,
              design.features.metal,
              design.features.style,
              ...design.features.gemstones,
              ...(design.tags ?? []),
            ]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery);

      const matchesType = typeFilter === 'all' ? true : design.features.type === typeFilter;
      const matchesDate = matchesDateFilter(
        design.createdAt,
        granularity,
        yearFilter,
        monthFilter,
        dayFilter,
      );

      return matchesQuery && matchesType && matchesDate;
    });
  }, [dayFilter, designs, granularity, monthFilter, query, typeFilter, yearFilter]);

  const handleLikeToggle = (design: DesignMetadata) => {
    if (design.liked) {
      unlikeDesign(design.id);
    } else {
      likeDesign(design.id);
    }

    setDesigns((previous) =>
      previous.map((candidate) =>
        candidate.id === design.id
          ? { ...candidate, liked: !candidate.liked, updatedAt: Date.now() }
          : candidate,
      ),
    );
  };

  const resultCountLabel = `${designs.length} total design${designs.length === 1 ? '' : 's'}`;
  const pendingCountLabel = `${pendingItems.length} generating`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className="border-b px-5 py-2.5"
        style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ borderColor: 'rgba(124, 58, 237, 0.16)', color: '#6d28d9', backgroundColor: 'rgba(124, 58, 237, 0.06)' }}>
              <Sparkles className="h-3 w-3" />
              Gallery
            </div>
            <span className="text-sm text-slate-500">{resultCountLabel}</span>
            {pendingItems.length > 0 && <span className="text-sm font-medium text-violet-600">{pendingCountLabel}</span>}
          </div>
          <span className="text-xs text-slate-400">{session?.tenantName || 'My profile'}</span>
        </div>
      </div>


      <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: 'rgba(255,255,255,0.82)' }}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts, rings, metals, styles, gemstones..."
              className="w-full rounded-2xl border py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:ring-2"
              style={{
                borderColor: 'rgba(124, 58, 237, 0.12)',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none"
              style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#ffffff' }}
            >
              <option value="all">All types</option>
              {designTypes.map((type) => (
                <option key={type} value={type}>
                  {titleize(type)}
                </option>
              ))}
            </select>

            <select
              value={granularity}
              onChange={(event) => setGranularity(event.target.value as DateGranularity)}
              className="rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none"
              style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#ffffff' }}
            >
              <option value="all">All dates</option>
              <option value="year">Filter by year</option>
              <option value="month">Filter by month</option>
              <option value="day">Filter by day</option>
            </select>

            {granularity !== 'all' ? (
              <select
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
                className="rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none"
                style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#ffffff' }}
              >
                <option value="all">Any year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            ) : null}

            {granularity === 'month' || granularity === 'day' ? (
              <select
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
                className="rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none"
                style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#ffffff' }}
              >
                <option value="all">Any month</option>
                {MONTH_LABELS.map((month, index) => (
                  <option key={month} value={String(index + 1)}>
                    {month}
                  </option>
                ))}
              </select>
            ) : null}

            {granularity === 'day' ? (
              <select
                value={dayFilter}
                onChange={(event) => setDayFilter(event.target.value)}
                className="rounded-2xl border px-4 py-3 text-sm text-slate-700 outline-none"
                style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#ffffff' }}
              >
                <option value="all">Any day</option>
                {Array.from({ length: 31 }, (_, index) => (
                  <option key={index + 1} value={String(index + 1)}>
                    {index + 1}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="mb-3 flex items-center gap-3 text-xs text-slate-400">
          <span>Showing {filteredDesigns.length} saved</span>
          {refreshing && <span>· Syncing...</span>}
        </div>

        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
              <p className="mt-3 text-sm font-medium text-slate-700">Loading your profile gallery...</p>
            </div>
          </div>
        ) : pendingItems.length === 0 && filteredDesigns.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md rounded-[32px] border bg-white/80 px-8 py-10 text-center shadow-[0_12px_48px_rgba(15,23,42,0.06)]" style={{ borderColor: 'rgba(124, 58, 237, 0.12)' }}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#6d28d9' }}>
                <Gem className="h-7 w-7" />
              </div>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">Your create-page gallery is ready</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Generated images will show up here immediately, stay attached to your profile, and remain filterable by date and jewelry type.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
            {pendingItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-lg border border-dashed"
                style={{ borderColor: 'rgba(124, 58, 237, 0.22)' }}
              >
                <div
                  className="flex aspect-square flex-col items-center justify-center gap-3 px-4 text-center"
                  style={{ background: 'radial-gradient(circle at top, rgba(124,58,237,0.14), rgba(255,255,255,0.92) 65%)' }}
                >
                  <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                  <p className="text-xs font-medium text-slate-600">
                    {titleize(item.type)} · {titleize(item.style)}
                  </p>
                </div>
              </motion.div>
            ))}

            {filteredDesigns.map((design) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group cursor-pointer overflow-hidden rounded-lg border transition-all hover:-translate-y-0.5 hover:shadow-lg"
                style={{ borderColor: 'rgba(0,0,0,0.08)' }}
                onClick={() => setSelectedDesignId(design.id)}
              >
                <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
                  <ImageWithFallback
                    src={design.imageUrl}
                    alt={buildDesignTitle(design)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  {design.liked && (
                    <div className="absolute right-2 top-2 z-10">
                      <Heart className="h-4 w-4 fill-current text-red-500 drop-shadow" />
                    </div>
                  )}

                  {/* Hover actions */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%)' }}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleLikeToggle(design);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:bg-white"
                    >
                      <Heart className={`h-3.5 w-3.5 ${design.liked ? 'fill-current text-red-500' : 'text-slate-600'}`} />
                    </button>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        downloadImage(design.imageUrl, `${design.id}.png`);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:bg-white"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-600" />
                    </button>
                  </div>

                  {/* Tags overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 px-2 py-1.5 z-10">
                    <div className="flex flex-wrap gap-1">
                      {[
                        titleize(design.features.type),
                        titleize(design.features.metal),
                        titleize(design.features.style),
                        ...design.features.gemstones.map((g) => titleize(g)),
                      ].map((tag) => (
                        <span
                          key={tag}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm"
                          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedDesign
        ? createPortal(
            <GenerationDetailModal
              design={selectedDesign}
              onClose={() => setSelectedDesignId(null)}
              onLikeToggle={handleLikeToggle}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
