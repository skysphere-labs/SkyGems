import { useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Link } from "react-router";

import { ImageWithFallback, Input } from "@skygems/ui";

import { postGallerySearch } from "../contracts/api";
import type { GallerySearchResult } from "../contracts/types";
import { appRoutes } from "../lib/routes";

const TYPE_FILTERS = ["All", "Ring", "Necklace", "Earrings", "Bracelet", "Pendant"] as const;

export function GalleryScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GallerySearchResult[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    postGallerySearch({ query }).then((items) => {
      if (mounted) {
        setResults(items);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [query]);

  const filteredResults =
    activeFilter === "All"
      ? results
      : results.filter(
          (r) =>
            r.designDna.jewelryType.toLowerCase() ===
            activeFilter.toLowerCase(),
        );

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="animate-entrance space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1
              className="text-3xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Gallery
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Browse all designs across your projects.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search designs..."
              className="border-[var(--border-default)] bg-[var(--bg-elevated)] pl-10 text-[var(--text-primary)]"
              style={{ height: 44 }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor:
                  activeFilter === filter
                    ? "rgba(212,175,55,0.12)"
                    : "rgba(255,255,255,0.03)",
                border:
                  activeFilter === filter
                    ? "1px solid rgba(212,175,55,0.2)"
                    : "1px solid var(--border-default)",
                color:
                  activeFilter === filter
                    ? "var(--accent-gold)"
                    : "var(--text-secondary)",
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {filteredResults.length > 0 ? (
        <div className="stagger-children mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredResults.map((result) => (
            <Link
              key={result.designId}
              to={appRoutes.design(result.projectId, result.designId)}
              className="group relative overflow-hidden rounded-2xl border transition-all card-hover"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--bg-tertiary)",
              }}
            >
              {/* Pair thumbnails */}
              <div
                className="relative grid grid-cols-2 gap-px"
                style={{ backgroundColor: "var(--border-default)" }}
              >
                <div className="overflow-hidden bg-[var(--bg-primary)]">
                  <ImageWithFallback
                    src={result.sketchThumbnailUrl}
                    alt={`${result.displayName} sketch`}
                    className="aspect-square w-full object-cover img-hover-zoom"
                  />
                </div>
                <div className="overflow-hidden bg-[var(--bg-primary)]">
                  <ImageWithFallback
                    src={result.renderThumbnailUrl}
                    alt={`${result.displayName} render`}
                    className="aspect-square w-full object-cover img-hover-zoom"
                  />
                </div>
                {/* Hover overlay gradient */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(transparent 50%, rgba(10,10,10,0.85) 100%)",
                  }}
                />
                {/* Hover action hint */}
                <div className="pointer-events-none absolute bottom-3 left-4 flex items-center gap-1.5 text-sm font-medium text-[var(--accent-gold)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  Open design
                </div>
                <div className="absolute right-3 top-3">
                  <span
                    className="rounded-full border px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm"
                    style={{
                      borderColor:
                        result.selectionState === "selected"
                          ? "rgba(76,175,80,0.2)"
                          : "rgba(212,175,55,0.22)",
                      backgroundColor:
                        result.selectionState === "selected"
                          ? "rgba(76,175,80,0.14)"
                          : "rgba(10,10,10,0.45)",
                      color:
                        result.selectionState === "selected"
                          ? "var(--status-success)"
                          : "var(--accent-gold-light)",
                    }}
                  >
                    {result.selectionState}
                  </span>
                </div>
              </div>
              {/* Card info */}
              <div className="p-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {result.displayName}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)] line-clamp-2">
                  {result.summary}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[result.designDna.jewelryType, result.designDna.metal].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: "rgba(212,175,55,0.06)",
                          color: "var(--accent-gold-light)",
                        }}
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-20 text-center">
          {isLoading ? (
            <>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-gold)] border-t-transparent" />
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Loading gallery...
              </p>
            </>
          ) : (
            <>
              <Sparkles
                className="mx-auto size-10 text-[var(--accent-gold)]"
                style={{ opacity: 0.4 }}
              />
              <p className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
                No designs found
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {query
                  ? "Try a different search term."
                  : "Start creating to build your gallery."}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
