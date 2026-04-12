import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Download, Edit, Heart, RotateCw, ZoomIn, ZoomOut, Loader2, CheckCircle, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import {
  fetchBackendDesign,
  generateBackendSpec,
  generateBackendTechSheet,
  generateBackendSvg,
  generateBackendCad,
} from '../services/skygemsApi';

interface BackendDesignDetail {
  design?: {
    designId: string;
    displayName: string;
    promptSummary: string;
    designDna?: {
      jewelryType?: string;
      metal?: string;
      gemstones?: string[];
      style?: string;
      complexity?: number;
      bandStyle?: string;
      settingType?: string;
      stonePosition?: string;
      profile?: string;
      motif?: string;
    };
    pair?: {
      render?: { signedUrl?: string };
    } | null;
    createdAt?: string;
    latestSpecId?: string | null;
    latestTechnicalSheetId?: string | null;
    latestSvgAssetId?: string | null;
    latestCadJobId?: string | null;
  };
  latestSpec?: {
    summary?: string;
    materials?: {
      metal?: string;
      finish?: string | null;
      gemstones?: Array<{
        stoneType?: string;
        quantity?: number | null;
        carat?: { value?: number | null; unit?: string } | null;
      }>;
    };
    dimensions?: {
      overallWidth?: { value?: number | null; unit?: string } | null;
      overallHeight?: { value?: number | null; unit?: string } | null;
      bandWidth?: { value?: number | null; unit?: string } | null;
      bandThickness?: { value?: number | null; unit?: string } | null;
    };
    construction?: {
      settingType?: string | null;
      profile?: string | null;
      manufacturingMethod?: string | null;
      assemblyNotes?: string[];
    };
    riskFlags?: Array<{ severity?: string; message?: string }>;
    unknowns?: string[];
    humanReviewRequired?: boolean;
  } | null;
  latestTechSheet?: {
    geometryAndDimensions?: Array<{ label: string; value: string }>;
    materialsAndMetalDetails?: Array<{ material: string; weight_g: number; purity: string; finish: string }>;
    gemstoneSchedule?: Array<{ stone: string; cut: string; caratWeight: number; dimensions: string; setting: string }>;
    constructionNotes?: string[];
    billOfMaterials?: Array<{ item: string; quantity: number; unitCost: number; totalCost: number }>;
    estimatedRetailPrice?: { low: number; mid: number; high: number; currency: string };
    riskFlags?: string[];
  } | null;
  latestSvgAsset?: {
    views?: Array<{ view: string; description: string; svgContent?: string }>;
    manifestJson?: { viewCount: number; views: Array<{ view: string; widthMm: number; heightMm: number; strokeCount: number }> };
  } | null;
  latestCadJob?: {
    requestedFormats?: string[];
    modelingPlan?: {
      cleanupOperations?: string[];
      modelingSteps?: string[];
      qaChecks?: string[];
    };
    blockers?: Array<{ code: string; message: string; blocking: boolean }>;
    requiresHumanReview?: boolean;
  } | null;
}

type PipelineStage = 'spec' | 'techSheet' | 'svg' | 'cad';

function formatRelativeTime(value?: string) {
  if (!value) return 'Created recently';
  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) return 'Created recently';
  const diffHours = Math.max(1, Math.round((Date.now() - createdAt) / (1000 * 60 * 60)));
  return `Created ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
}

function formatCreatedLabel(designId: string, createdAt?: string) {
  return `Design ${designId.slice(-4).toUpperCase()} · ${formatRelativeTime(createdAt)}`;
}

function formatWeight(value?: number | null, unit?: string) {
  if (value == null) return 'Pending';
  return `${value}${unit ? ` ${unit}` : ''}`;
}

export function DesignPreview() {
  const { id } = useParams();
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [favorite, setFavorite] = useState(false);
  const [detail, setDetail] = useState<BackendDesignDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runningStage, setRunningStage] = useState<PipelineStage | null>(null);
  const [stageError, setStageError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ spec: true });

  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  useEffect(() => {
    if (!id) { setErrorMessage('Missing design ID.'); return; }
    let cancelled = false;
    fetchBackendDesign(id)
      .then((data) => { if (!cancelled) { setDetail(data); setErrorMessage(null); } })
      .catch((error) => { if (!cancelled) setErrorMessage(error instanceof Error ? error.message : 'Unable to load design.'); });
    return () => { cancelled = true; };
  }, [id]);

  const refreshDesign = async () => {
    if (!id) return;
    try {
      const data = await fetchBackendDesign(id);
      setDetail(data);
    } catch { /* ignore refresh errors */ }
  };

  const runStage = async (stage: PipelineStage) => {
    if (!id || runningStage) return;
    setRunningStage(stage);
    setStageError(null);
    try {
      if (stage === 'spec') await generateBackendSpec(id);
      else if (stage === 'techSheet') await generateBackendTechSheet(id);
      else if (stage === 'svg') await generateBackendSvg(id);
      else if (stage === 'cad') await generateBackendCad(id);
      await refreshDesign();
      setExpandedSections((prev) => ({ ...prev, [stage]: true }));
    } catch (error) {
      setStageError(error instanceof Error ? error.message : `Failed to run ${stage}`);
    } finally {
      setRunningStage(null);
    }
  };

  const design = detail?.design;
  const spec = detail?.latestSpec;
  const techSheet = detail?.latestTechSheet;
  const svgAsset = detail?.latestSvgAsset;
  const cadJob = detail?.latestCadJob;

  const hasSpec = Boolean(spec || design?.latestSpecId);
  const hasTechSheet = Boolean(techSheet || design?.latestTechnicalSheetId);
  const hasSvg = Boolean(svgAsset || design?.latestSvgAssetId);
  const hasCad = Boolean(cadJob || design?.latestCadJobId);

  const primaryStone = spec?.materials?.gemstones?.[0];
  const renderImage = design?.pair?.render?.signedUrl ?? '';

  const detailRows = useMemo(
    () => [
      ['Metal Type', spec?.materials?.metal ?? design?.designDna?.metal ?? 'Pending'],
      ['Metal Weight', formatWeight(spec?.dimensions?.overallHeight?.value, spec?.dimensions?.overallHeight?.unit)],
      ['Piece Type', design?.designDna?.jewelryType ?? 'Pending'],
    ],
    [design?.designDna?.jewelryType, design?.designDna?.metal, spec?.dimensions?.overallHeight?.unit, spec?.dimensions?.overallHeight?.value, spec?.materials?.metal],
  );

  const gemstoneRows = useMemo(
    () => [
      ['Primary Stone', String(primaryStone?.stoneType ?? design?.designDna?.gemstones?.[0] ?? 'Pending')],
      ['Carat Weight', primaryStone?.carat?.value != null ? `${primaryStone.carat.value} ${primaryStone.carat.unit ?? ''}`.trim() : 'Pending'],
      ['Cut', spec?.construction?.settingType ?? design?.designDna?.settingType ?? 'Pending'],
      ['Profile', spec?.construction?.profile ?? design?.designDna?.profile ?? 'Pending'],
      ['Accent Stones', `${Math.max(0, (spec?.materials?.gemstones?.length ?? design?.designDna?.gemstones?.length ?? 1) - 1)}`],
    ],
    [design?.designDna?.gemstones, design?.designDna?.profile, design?.designDna?.settingType, primaryStone?.carat?.unit, primaryStone?.carat?.value, primaryStone?.stoneType, spec?.construction?.profile, spec?.construction?.settingType, spec?.materials?.gemstones?.length],
  );

  if (errorMessage) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center space-y-3">
          <p className="text-sm font-medium" style={{ color: 'var(--status-error)' }}>{errorMessage}</p>
          <Link to="/app/gallery" className="text-sm font-medium" style={{ color: 'var(--accent-gold)' }}>Back to gallery</Link>
        </div>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Loading design preview...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="px-6 py-3 flex items-center justify-between border-b"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Link to="/app/gallery" className="w-9 h-9 rounded-md flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{design.displayName}</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatCreatedLabel(design.designId, design.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFavorite(!favorite)} className="px-4 py-2 rounded-md text-sm font-medium border transition-all flex items-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: favorite ? 'var(--status-error)' : 'rgba(255,255,255,0.06)', color: favorite ? 'var(--status-error)' : 'var(--text-primary)' }}>
            <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
            {favorite ? 'Favorited' : 'Favorite'}
          </button>
          <Link to="/app/copilot" className="px-4 py-2 rounded-md text-sm font-medium border transition-all flex items-center gap-2" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>
            <Edit className="w-4 h-4" />
            Edit Design
          </Link>
          <Link to="/app/export" className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2" style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}>
            <Download className="w-4 h-4" />
            Export Files
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Image preview */}
        <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="relative">
            <div className="w-[550px] h-[550px] rounded-lg border overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)', transform: `scale(${zoom / 100})` }}>
              <div className="relative w-full h-full flex items-center justify-center" style={{ transform: `rotateY(${rotation}deg)` }}>
                <ImageWithFallback src={renderImage} alt={design.displayName} className="w-full h-full object-contain p-10" />
              </div>
            </div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-xl rounded-lg px-4 py-3 border" style={{ backgroundColor: 'rgba(17, 17, 17, 0.9)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setRotation(rotation - 45)} className="w-8 h-8 rounded-md flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}><RotateCw className="w-4 h-4" style={{ transform: 'scaleX(-1)' }} /></button>
                  <button onClick={() => setRotation(rotation + 45)} className="w-8 h-8 rounded-md flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}><RotateCw className="w-4 h-4" /></button>
                </div>
                <div className="w-px h-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setZoom(Math.max(50, zoom - 10))} className="w-8 h-8 rounded-md flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}><ZoomOut className="w-4 h-4" /></button>
                  <span className="text-xs font-medium min-w-[40px] text-center" style={{ color: 'var(--text-secondary)' }}>{zoom}%</span>
                  <button onClick={() => setZoom(Math.min(200, zoom + 10))} className="w-8 h-8 rounded-md flex items-center justify-center transition-all" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}><ZoomIn className="w-4 h-4" /></button>
                </div>
                <div className="w-px h-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
                <button onClick={() => { setRotation(0); setZoom(100); }} className="px-3 py-1.5 rounded-md text-xs font-medium transition-all" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Reset</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[380px] border-l p-5 overflow-y-auto" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Design Details</h2>

          {/* Design DNA */}
          <div className="rounded-md p-4 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            {detailRows.map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Gemstone Details */}
          <div className="rounded-md p-4 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Gemstone Details</h3>
            {gemstoneRows.map(([label, value]) => (
              <div key={label} className="flex justify-between py-1.5 text-sm">
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Error display */}
          {stageError && (
            <div className="rounded-md p-3 mb-4 border" style={{ backgroundColor: 'rgba(239, 83, 80, 0.08)', borderColor: 'rgba(239, 83, 80, 0.3)' }}>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--status-error)' }} />
                <p className="text-xs" style={{ color: 'var(--status-error)' }}>{stageError}</p>
              </div>
            </div>
          )}

          {/* Pipeline Header */}
          <h2 className="text-sm font-semibold mb-3 mt-2" style={{ color: 'var(--text-primary)' }}>Production Pipeline</h2>

          {/* Stage 1: Spec */}
          <PipelineStageSection
            title="Specification"
            stageKey="spec"
            hasData={hasSpec}
            isRunning={runningStage === 'spec'}
            canRun={!runningStage}
            expanded={expandedSections.spec}
            onToggle={() => toggleSection('spec')}
            onRun={() => runStage('spec')}
          >
            {spec ? (
              <div className="space-y-2">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{spec.summary}</p>
                {spec.construction?.manufacturingMethod && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Manufacturing</span>
                    <span style={{ color: 'var(--text-primary)' }}>{spec.construction.manufacturingMethod}</span>
                  </div>
                )}
                {spec.dimensions?.bandWidth?.value != null && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Band Width</span>
                    <span style={{ color: 'var(--text-primary)' }}>{spec.dimensions.bandWidth.value} {spec.dimensions.bandWidth.unit}</span>
                  </div>
                )}
                {spec.construction?.assemblyNotes && spec.construction.assemblyNotes.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Notes:</span>
                    {spec.construction.assemblyNotes.map((note, i) => (
                      <p key={i} className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>- {note}</p>
                    ))}
                  </div>
                )}
                {spec.humanReviewRequired && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <AlertTriangle className="w-3 h-3" style={{ color: 'var(--status-warning)' }} />
                    <span className="text-xs" style={{ color: 'var(--status-warning)' }}>Human review required</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No spec generated yet.</p>
            )}
          </PipelineStageSection>

          {/* Stage 2: Tech Sheet */}
          <PipelineStageSection
            title="Technical Sheet"
            stageKey="techSheet"
            hasData={hasTechSheet}
            isRunning={runningStage === 'techSheet'}
            canRun={!runningStage && hasSpec}
            expanded={expandedSections.techSheet}
            onToggle={() => toggleSection('techSheet')}
            onRun={() => runStage('techSheet')}
            disabledReason={!hasSpec ? 'Requires spec first' : undefined}
          >
            {techSheet ? (
              <div className="space-y-3">
                {techSheet.geometryAndDimensions && techSheet.geometryAndDimensions.length > 0 && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Dimensions</span>
                    {techSheet.geometryAndDimensions.map((d, i) => (
                      <div key={i} className="flex justify-between text-xs py-0.5">
                        <span style={{ color: 'var(--text-muted)' }}>{d.label}</span>
                        <span style={{ color: 'var(--text-primary)' }}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                )}
                {techSheet.estimatedRetailPrice && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-muted)' }}>Est. Retail</span>
                    <span style={{ color: 'var(--accent-gold)' }}>
                      {techSheet.estimatedRetailPrice.currency} {techSheet.estimatedRetailPrice.low} - {techSheet.estimatedRetailPrice.high}
                    </span>
                  </div>
                )}
                {techSheet.riskFlags && techSheet.riskFlags.length > 0 && (
                  <div className="mt-1">
                    {techSheet.riskFlags.map((flag, i) => (
                      <p key={i} className="text-xs" style={{ color: 'var(--status-warning)' }}>- {flag}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tech sheet generated yet.</p>
            )}
          </PipelineStageSection>

          {/* Stage 3: SVG */}
          <PipelineStageSection
            title="SVG Technical Drawings"
            stageKey="svg"
            hasData={hasSvg}
            isRunning={runningStage === 'svg'}
            canRun={!runningStage && hasTechSheet}
            expanded={expandedSections.svg}
            onToggle={() => toggleSection('svg')}
            onRun={() => runStage('svg')}
            disabledReason={!hasTechSheet ? 'Requires tech sheet first' : undefined}
          >
            {svgAsset ? (
              <div className="space-y-2">
                {svgAsset.views?.map((v, i) => (
                  <div key={i}>
                    <span className="text-xs font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{v.view} view</span>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.description}</p>
                    {v.svgContent && (
                      <div className="mt-1 rounded border p-2" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'var(--bg-primary)' }} dangerouslySetInnerHTML={{ __html: v.svgContent }} />
                    )}
                  </div>
                ))}
                {svgAsset.manifestJson && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{svgAsset.manifestJson.viewCount} views generated</p>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No SVG drawings generated yet.</p>
            )}
          </PipelineStageSection>

          {/* Stage 4: CAD */}
          <PipelineStageSection
            title="CAD Export"
            stageKey="cad"
            hasData={hasCad}
            isRunning={runningStage === 'cad'}
            canRun={!runningStage && hasSvg}
            expanded={expandedSections.cad}
            onToggle={() => toggleSection('cad')}
            onRun={() => runStage('cad')}
            disabledReason={!hasSvg ? 'Requires SVG first' : undefined}
          >
            {cadJob ? (
              <div className="space-y-2">
                {cadJob.requestedFormats && (
                  <div className="flex gap-1.5 flex-wrap">
                    {cadJob.requestedFormats.map((f) => (
                      <span key={f} className="px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--accent-gold)' }}>{f.toUpperCase()}</span>
                    ))}
                  </div>
                )}
                {cadJob.modelingPlan?.modelingSteps && (
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Modeling Steps</span>
                    {cadJob.modelingPlan.modelingSteps.slice(0, 4).map((step, i) => (
                      <p key={i} className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{i + 1}. {step}</p>
                    ))}
                    {cadJob.modelingPlan.modelingSteps.length > 4 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>+{cadJob.modelingPlan.modelingSteps.length - 4} more steps</p>
                    )}
                  </div>
                )}
                {cadJob.blockers && cadJob.blockers.length > 0 && (
                  <div className="mt-1">
                    {cadJob.blockers.map((b, i) => (
                      <div key={i} className="flex items-start gap-1.5 mt-1">
                        <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: b.blocking ? 'var(--status-error)' : 'var(--status-warning)' }} />
                        <span className="text-xs" style={{ color: b.blocking ? 'var(--status-error)' : 'var(--status-warning)' }}>{b.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                {cadJob.requiresHumanReview && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <AlertTriangle className="w-3 h-3" style={{ color: 'var(--status-warning)' }} />
                    <span className="text-xs" style={{ color: 'var(--status-warning)' }}>Human review required before manufacturing</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No CAD job generated yet.</p>
            )}
          </PipelineStageSection>

          {/* Bottom actions */}
          <div className="space-y-2 pt-4 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <Link to="/app/copilot" className="w-full py-2.5 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}>
              <Edit className="w-4 h-4" />
              Modify with AI Co-Pilot
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStageSection({
  title, stageKey, hasData, isRunning, canRun, expanded, onToggle, onRun, disabledReason, children,
}: {
  title: string;
  stageKey: string;
  hasData: boolean;
  isRunning: boolean;
  canRun: boolean;
  expanded?: boolean;
  onToggle: () => void;
  onRun: () => void;
  disabledReason?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3 rounded-md border" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />}
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
          {hasData && <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--status-success)' }} />}
        </div>
        {!hasData && (
          <button
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            disabled={!canRun || isRunning}
            className="px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40"
            style={{ backgroundColor: canRun ? 'var(--accent-gold)' : 'var(--bg-hover)', color: canRun ? 'var(--text-inverse)' : 'var(--text-muted)' }}
            title={disabledReason}
          >
            {isRunning ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : 'Generate'}
          </button>
        )}
        {hasData && (
          <button
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            disabled={!canRun || isRunning}
            className="px-2.5 py-1 rounded text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-40"
            style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
          >
            {isRunning ? <><Loader2 className="w-3 h-3 animate-spin" /> Running...</> : 'Regenerate'}
          </button>
        )}
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          {children}
        </div>
      )}
    </div>
  );
}
