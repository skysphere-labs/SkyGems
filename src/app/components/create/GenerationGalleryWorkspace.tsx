import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import {
  CalendarDays,
  Check,
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

function getActivityStepIndex(activity: GenerationActivitySummary | null) {
  if (!activity || activity.status === 'idle') {
    return -1;
  }

  if (activity.status === 'error') {
    return 1;
  }

  if (activity.status === 'completed') {
    return 3;
  }

  if (activity.completedCount === 0) {
    return 1;
  }

  if (activity.pendingCount > 0) {
    return 2;
  }

  return 3;
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
  const variationRows = [
    design.features.variation.bandStyle,
    design.features.variation.settingType,
    design.features.variation.stonePosition,
    design.features.variation.profile,
    design.features.variation.motif,
  ].filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-5"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="flex h-full max-h-[calc(100vh-40px)] w-full max-w-6xl overflow-hidden rounded-[28px] border bg-white shadow-2xl"
          style={{ borderColor: 'rgba(124, 58, 237, 0.16)' }}
          onClick={(event) => event.stopPropagation()}
        >
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6"
            style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 55%, #eff6ff 100%)' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border bg-white/85 transition-all hover:bg-white"
              style={{ borderColor: 'rgba(124, 58, 237, 0.18)', color: '#374151' }}
            >
              <X className="h-4 w-4" />
            </button>

            <div
              className="w-full max-w-3xl overflow-hidden rounded-[24px] border bg-white p-4 shadow-[0_32px_80px_rgba(15,23,42,0.12)]"
              style={{ borderColor: 'rgba(124, 58, 237, 0.16)' }}
            >
              <ImageWithFallback
                src={design.imageUrl}
                alt={buildDesignTitle(design)}
                className="max-h-[70vh] w-full rounded-[18px] object-contain"
                style={{ backgroundColor: '#f8fafc' }}
              />
            </div>
          </div>

          <div className="w-full max-w-[380px] overflow-y-auto border-l p-6" style={{ borderColor: 'rgba(124, 58, 237, 0.12)' }}>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: '#7c3aed' }}>
                  Design Popup
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                  {buildDesignTitle(design)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Saved to your profile gallery on {formatDate(design.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onLikeToggle(design)}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    borderColor: design.liked ? 'rgba(239, 68, 68, 0.28)' : 'rgba(124, 58, 237, 0.16)',
                    backgroundColor: design.liked ? 'rgba(254, 226, 226, 0.7)' : 'rgba(124, 58, 237, 0.06)',
                    color: design.liked ? '#dc2626' : '#5b21b6',
                  }}
                >
                  <Heart className={`h-4 w-4 ${design.liked ? 'fill-current' : ''}`} />
                  {design.liked ? 'Favorited' : 'Add to Favorites'}
                </button>

                <button
                  type="button"
                  onClick={() => downloadImage(design.imageUrl, `${design.id}.png`)}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                  style={{ borderColor: 'rgba(148, 163, 184, 0.28)' }}
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>

                <Link
                  to={`/app/preview/${design.id}`}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
                  style={{ borderColor: 'rgba(148, 163, 184, 0.28)' }}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Preview
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Type', titleize(design.features.type)],
                  ['Metal', titleize(design.features.metal)],
                  ['Style', titleize(design.features.style)],
                  ['Complexity', `${design.features.complexity}%`],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border p-3"
                    style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#faf5ff' }}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border p-4" style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#f8fafc' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Gemstones
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {design.features.gemstones.length > 0 ? (
                    design.features.gemstones.map((gem) => (
                      <span
                        key={gem}
                        className="rounded-full border px-3 py-1 text-xs font-medium"
                        style={{ borderColor: 'rgba(124, 58, 237, 0.16)', backgroundColor: '#ffffff', color: '#6d28d9' }}
                      >
                        {titleize(gem)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No gemstones selected.</span>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border p-4" style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#f8fafc' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Prompt
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  {design.prompt || 'Prompt summary will appear here when available.'}
                </p>
              </div>

              <div className="rounded-3xl border p-4" style={{ borderColor: 'rgba(124, 58, 237, 0.12)', backgroundColor: '#f8fafc' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Design Features
                </p>
                <div className="mt-3 space-y-2">
                  {variationRows.length > 0 ? (
                    variationRows.map((row) => (
                      <div key={row} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="h-2 w-2 rounded-full bg-violet-500" />
                        <span>{titleize(row)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">Variation details will populate after the design DNA syncs.</p>
                  )}
                </div>
              </div>
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
  const session = useMemo(() => readStoredSession(), []);
  const [designs, setDesigns] = useState<DesignMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [granularity, setGranularity] = useState<DateGranularity>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDesigns = async () => {
      try {
        setLoading(true);
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
        }
      }
    };

    const handleRefresh = () => {
      void loadDesigns();
    };

    void loadDesigns();
    window.addEventListener(DESIGNS_UPDATED_EVENT, handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      cancelled = true;
      window.removeEventListener(DESIGNS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener('focus', handleRefresh);
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

  const activitySteps = useMemo(
    () => ['Agent running', 'Generating concepts', 'Loading into gallery', 'Saved to your profile'],
    [],
  );
  const currentActivityStep = getActivityStepIndex(activity);

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
      {/* Compact activity bar — only shows during/after generation */}
      {(activity && activity.status !== 'idle') || pendingItems.length > 0 ? (
        <div
          className="flex items-center gap-3 border-b px-5 py-2.5 flex-shrink-0"
          style={{
            borderColor: 'rgba(124, 58, 237, 0.12)',
            background: activity?.status === 'error'
              ? 'linear-gradient(135deg, rgba(254,242,242,0.95), rgba(255,255,255,0.96))'
              : 'linear-gradient(135deg, rgba(124,58,237,0.04), rgba(255,255,255,0.98))',
          }}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {activity?.status === 'running' ? (
              <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: '#6d28d9' }} />
            ) : (
              <Sparkles className="h-4 w-4 flex-shrink-0" style={{ color: activity?.status === 'error' ? '#dc2626' : '#6d28d9' }} />
            )}
            <span className="text-sm font-medium text-slate-900 truncate">
              {activity?.headline || 'Preparing'}
            </span>
            {activity?.detail && (
              <span className="text-xs text-slate-500 truncate hidden sm:inline">
                — {activity.detail}
              </span>
            )}
            {activity?.errorMessage && (
              <span className="text-xs font-medium text-red-600 truncate">{activity.errorMessage}</span>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 text-xs">
            <span className="text-slate-500"><span className="font-semibold text-slate-900">{activity?.completedCount ?? 0}</span>/{activity?.totalCount ?? pendingItems.length} ready</span>
            {activitySteps.map((step, index) => {
              const isComplete = currentActivityStep > index || activity?.status === 'completed';
              const isCurrent = currentActivityStep === index && activity?.status !== 'completed';
              return (
                <span
                  key={step}
                  className="hidden lg:inline-flex items-center gap-1"
                  style={{ color: isComplete ? '#6d28d9' : isCurrent ? '#7c3aed' : '#94a3b8' }}
                >
                  {isCurrent ? <Loader2 className="h-3 w-3 animate-spin" /> : isComplete ? <Check className="h-3 w-3" /> : null}
                  <span className="text-[11px]">{step}</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="border-b px-5 py-2.5 flex-shrink-0" style={{ borderColor: 'rgba(124, 58, 237, 0.08)', backgroundColor: 'rgba(255,255,255,0.82)' }}>
        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search prompts, rings, metals, styles, gemstones..."
              className="w-full rounded-xl border py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:ring-2"
              style={{
                borderColor: 'rgba(124, 58, 237, 0.12)',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border px-3 py-2 text-sm text-slate-700 outline-none"
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
              className="rounded-xl border px-3 py-2 text-sm text-slate-700 outline-none"
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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing {filteredDesigns.length} saved design{filteredDesigns.length === 1 ? '' : 's'}
            {query.trim() ? ` matching "${query.trim()}"` : ''}.
          </p>
          {pendingItems.length > 0 ? (
            <p className="text-sm font-medium text-violet-700">
              {pendingItems.length} new {pendingItems.length === 1 ? 'image is' : 'images are'} still generating in this grid.
            </p>
          ) : null}
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
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {pendingItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="overflow-hidden rounded-[28px] border border-dashed bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]"
                style={{ borderColor: 'rgba(124, 58, 237, 0.22)' }}
              >
                <div
                  className="flex aspect-square flex-col items-center justify-center gap-4 px-6 text-center"
                  style={{ background: 'radial-gradient(circle at top, rgba(124,58,237,0.14), rgba(255,255,255,0.92) 65%)' }}
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-white/75" style={{ borderColor: 'rgba(124, 58, 237, 0.22)' }}>
                    <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Generating image {item.order + 1}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">{item.message}</p>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-slate-950">
                      {titleize(item.type)} Concept
                    </p>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700">
                      Live
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[item.metal, item.style, ...item.gemstones].filter(Boolean).slice(0, 4).map((value) => (
                      <span
                        key={value}
                        className="rounded-full border px-3 py-1 text-[11px] font-medium"
                        style={{ borderColor: 'rgba(124, 58, 237, 0.14)', backgroundColor: '#faf5ff', color: '#6d28d9' }}
                      >
                        {titleize(value)}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500">
                    Placeholder added to the gallery while the render spins up.
                  </p>
                </div>
              </motion.div>
            ))}

            {filteredDesigns.map((design) => (
              <motion.div
                key={design.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group cursor-pointer overflow-hidden rounded-[28px] border bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_24px_54px_rgba(79,70,229,0.14)]"
                style={{ borderColor: 'rgba(124, 58, 237, 0.12)' }}
                onClick={() => setSelectedDesignId(design.id)}
              >
                <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#f8fafc' }}>
                  <ImageWithFallback
                    src={design.imageUrl}
                    alt={buildDesignTitle(design)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />

                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-800 shadow-sm">
                      {titleize(design.features.type)}
                    </span>
                    {design.liked ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-600 shadow-sm">
                        Favorite
                      </span>
                    ) : null}
                  </div>

                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleLikeToggle(design);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition-all hover:bg-white"
                    >
                      <Heart className={`h-3.5 w-3.5 ${design.liked ? 'fill-current text-red-500' : 'text-slate-500'}`} />
                      {design.liked ? 'Liked' : 'Like'}
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        downloadImage(design.imageUrl, `${design.id}.png`);
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition-all hover:bg-white"
                    >
                      <Download className="h-3.5 w-3.5 text-emerald-600" />
                      Download
                    </button>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-slate-950">{buildDesignTitle(design)}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDate(design.createdAt)}</p>
                    </div>
                    <span className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ backgroundColor: 'rgba(124, 58, 237, 0.08)', color: '#6d28d9' }}>
                      Open
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[design.features.metal, design.features.style, ...design.features.gemstones]
                      .filter(Boolean)
                      .slice(0, 4)
                      .map((value) => (
                        <span
                          key={value}
                          className="rounded-full border px-3 py-1 text-[11px] font-medium"
                          style={{ borderColor: 'rgba(124, 58, 237, 0.14)', backgroundColor: '#faf5ff', color: '#6d28d9' }}
                        >
                          {titleize(value)}
                        </span>
                      ))}
                  </div>

                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                    {design.prompt || 'Prompt summary unavailable for this design.'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {selectedDesign ? (
        <GenerationDetailModal
          design={selectedDesign}
          onClose={() => setSelectedDesignId(null)}
          onLikeToggle={handleLikeToggle}
        />
      ) : null}
    </div>
  );
}
