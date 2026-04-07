"use client";

import { useState } from "react";

import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@skygems/ui";

const TYPE_FILTERS = ["All", "Ring", "Necklace", "Earrings", "Bracelet", "Pendant"] as const;
const METAL_FILTERS = ["Gold", "Silver", "Platinum", "Rose Gold"] as const;
const SORT_OPTIONS = ["Newest", "Oldest", "A-Z"] as const;

export function GalleryTab({
  searchQuery,
  onSearchChange,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}) {
  const [activeType, setActiveType] = useState<string>("All");
  const [activeMetals, setActiveMetals] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("Newest");

  const toggleMetal = (metal: string) => {
    setActiveMetals((prev) =>
      prev.includes(metal)
        ? prev.filter((m) => m !== metal)
        : [...prev, metal],
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Gallery
          </h2>
          <SlidersHorizontal
            className="size-4"
            style={{ color: "var(--text-muted)" }}
          />
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <Input
            placeholder="Search designs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border pl-10 text-sm"
            style={{
              background: "var(--bg-tertiary)",
              borderColor: "var(--border-default)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Filter by Type */}
        <div className="mb-6 space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Filter by Type
          </p>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((type) => {
              const active = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    borderColor: active
                      ? "var(--accent-gold)"
                      : "var(--border-default)",
                    backgroundColor: active
                      ? "rgba(212,175,55,0.12)"
                      : "var(--bg-tertiary)",
                    color: active
                      ? "var(--accent-gold)"
                      : "var(--text-secondary)",
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by Metal */}
        <div className="mb-6 space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Filter by Metal
          </p>
          <div className="flex flex-wrap gap-2">
            {METAL_FILTERS.map((metal) => {
              const active = activeMetals.includes(metal);
              return (
                <button
                  key={metal}
                  type="button"
                  onClick={() => toggleMetal(metal)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    borderColor: active
                      ? "var(--accent-gold)"
                      : "var(--border-default)",
                    backgroundColor: active
                      ? "rgba(212,175,55,0.12)"
                      : "var(--bg-tertiary)",
                    color: active
                      ? "var(--accent-gold)"
                      : "var(--text-secondary)",
                  }}
                >
                  {metal}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-3">
          <p
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Sort by
          </p>
          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => {
              const active = sortBy === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSortBy(option)}
                  className="rounded-full border px-3 py-1.5 text-xs font-medium transition-all"
                  style={{
                    borderColor: active
                      ? "var(--accent-gold)"
                      : "var(--border-default)",
                    backgroundColor: active
                      ? "rgba(212,175,55,0.12)"
                      : "var(--bg-tertiary)",
                    color: active
                      ? "var(--accent-gold)"
                      : "var(--text-secondary)",
                  }}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
