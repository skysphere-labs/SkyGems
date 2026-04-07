import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle, ImageWithFallback, Input } from "@skygems/ui";

import { postGallerySearch } from "../contracts/api";
import type { GallerySearchResult } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function GalleryScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GallerySearchResult[]>([]);

  useEffect(() => {
    let mounted = true;

    postGallerySearch({ query }).then((items) => {
      if (mounted) {
        setResults(items);
      }
    });

    return () => {
      mounted = false;
    };
  }, [query]);

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="space-y-5 py-6">
          <div>
            <p className="eyebrow">Gallery</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Reopen saved directions
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Search across generated work and jump back into the correct project
              context without losing the selected-design workflow.
            </p>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search designs, styles, or metals"
              className="border-white/6 bg-[var(--bg-tertiary)] pl-11 text-[var(--text-primary)]"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {results.map((result) => (
          <Card key={result.designId} className="border-white/6 bg-[var(--bg-secondary)]">
            <CardHeader>
              <CardTitle className="text-lg text-[var(--text-primary)]">
                {result.displayName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)]">
                  <ImageWithFallback
                    src={result.sketchThumbnailUrl}
                    alt={`${result.displayName} sketch`}
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)]">
                  <ImageWithFallback
                    src={result.renderThumbnailUrl}
                    alt={`${result.displayName} render`}
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                </div>
              </div>
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {result.summary}
              </p>
              <Link
                to={appRoutes.design(result.projectId, result.designId)}
                className="inline-flex items-center text-sm font-medium text-[var(--accent-gold)]"
              >
                Open in workspace
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
