import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";

import { Button, Card, CardContent, CardHeader, CardTitle } from "@skygems/ui";

import { fetchDesign, postStartTechSheet } from "../contracts/api";
import type { Design } from "../contracts/types";
import { appRoutes } from "../lib/routes";

export function TechnicalSheetScreen() {
  const { designId, projectId } = useParams();
  const [design, setDesign] = useState<Design | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDesign = useCallback(() => {
    if (!designId) return;
    fetchDesign(designId).then(setDesign);
  }, [designId]);

  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  const handleGenerate = useCallback(async () => {
    if (!designId) return;
    setGenerating(true);
    setError(null);
    try {
      await postStartTechSheet(designId);
      // Reload design to get fresh tech sheet data
      const updated = await fetchDesign(designId);
      setDesign(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate technical sheet.");
    } finally {
      setGenerating(false);
    }
  }, [designId]);

  if (!projectId || !design) {
    return (
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="py-12 text-center text-[var(--text-secondary)]">
          Loading technical sheet...
        </CardContent>
      </Card>
    );
  }

  const sheet = design.technicalSheetData;
  const hasData = sheet.geometryAndDimensions.length > 0 || sheet.materialsAndMetalDetails.length > 0;
  const sections = [
    ["Geometry & Dimensions", sheet.geometryAndDimensions],
    ["Materials", sheet.materialsAndMetalDetails],
    ["Gemstone Schedule", sheet.gemstoneSchedule],
  ] as const;

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

  return (
    <div className="space-y-6">
      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div>
            <p className="eyebrow">Technical Sheet</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
              Manufacturing-facing review
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
              Present the approved design as a technical packet before vector generation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!hasData && (
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generate Tech Sheet
                  </>
                )}
              </Button>
            )}
            <Button asChild>
              <Link to={appRoutes.svg(projectId, design.id)}>
                Continue to SVG
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/20 bg-red-950/20">
          <CardContent className="py-4 text-sm text-red-300">{error}</CardContent>
        </Card>
      )}

      <Card className="border-white/6 bg-[var(--bg-secondary)]">
        <CardHeader>
          <CardTitle className="text-xl text-[var(--text-primary)]">
            {sheet.versionLabel}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {sections.map(([label, fields]) => (
              <div
                key={label}
                className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5"
              >
                <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {label}
                </p>
                <div className="mt-4 space-y-3">
                  {fields.length > 0 ? (
                    fields.map((field) => (
                      <div key={field.label} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-[var(--text-secondary)]">{field.label}</span>
                        <span className="text-right text-[var(--text-primary)]">{field.value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-[var(--text-secondary)]">Awaiting generated content.</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Construction & Assembly
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {sheet.constructionAndAssemblyNotes.length > 0 ? (
                  sheet.constructionAndAssemblyNotes.map((note) => <li key={note}>{note}</li>)
                ) : (
                  <li>No assembly notes yet.</li>
                )}
              </ul>
            </div>
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Tolerances & Constraints
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                {sheet.tolerancesAndConstraints.length > 0 ? (
                  sheet.tolerancesAndConstraints.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>No tolerance issues in the current technical sheet snapshot.</li>
                )}
              </ul>
            </div>
          </div>

          {/* Bill of Materials */}
          {sheet.billOfMaterials && sheet.billOfMaterials.length > 0 && (
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Bill of Materials
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6 text-left text-[var(--text-muted)]">
                      <th className="pb-2 pr-4 font-medium">Item</th>
                      <th className="pb-2 pr-4 font-medium text-right">Qty</th>
                      <th className="pb-2 pr-4 font-medium text-right">Unit Cost</th>
                      <th className="pb-2 pr-4 font-medium text-right">Total</th>
                      <th className="pb-2 font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.billOfMaterials.map((line) => (
                      <tr key={line.item} className="border-b border-white/4">
                        <td className="py-2 pr-4 text-[var(--text-primary)]">{line.item}</td>
                        <td className="py-2 pr-4 text-right text-[var(--text-secondary)]">
                          {line.quantity}
                        </td>
                        <td className="py-2 pr-4 text-right text-[var(--text-secondary)]">
                          {formatCurrency(line.unitCost)}
                        </td>
                        <td className="py-2 pr-4 text-right text-[var(--text-primary)]">
                          {formatCurrency(line.totalCost)}
                        </td>
                        <td className="py-2 text-[var(--text-muted)]">{line.source}</td>
                      </tr>
                    ))}
                    <tr className="font-medium">
                      <td colSpan={3} className="pt-3 text-right text-[var(--text-secondary)]">
                        Materials Total
                      </td>
                      <td className="pt-3 text-right text-[var(--text-primary)]">
                        {formatCurrency(
                          sheet.billOfMaterials.reduce((s, l) => s + l.totalCost, 0),
                        )}
                      </td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Estimated Retail Price */}
          {sheet.estimatedRetailPrice && sheet.estimatedRetailPrice.mid > 0 && (
            <div className="rounded-3xl border border-white/6 bg-[rgba(255,255,255,0.02)] p-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Estimated Retail Price Range
              </p>
              <div className="mt-4 flex items-end gap-8">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Low</p>
                  <p className="text-lg text-[var(--text-secondary)]">
                    {formatCurrency(sheet.estimatedRetailPrice.low, sheet.estimatedRetailPrice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">Mid</p>
                  <p className="text-2xl font-semibold text-[var(--text-primary)]">
                    {formatCurrency(sheet.estimatedRetailPrice.mid, sheet.estimatedRetailPrice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted)]">High</p>
                  <p className="text-lg text-[var(--text-secondary)]">
                    {formatCurrency(sheet.estimatedRetailPrice.high, sheet.estimatedRetailPrice.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
