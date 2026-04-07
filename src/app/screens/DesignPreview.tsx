import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Download, Edit, Heart, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { fetchBackendDesign } from '../services/skygemsApi';

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
      assemblyNotes?: string[];
    };
  } | null;
}

function formatRelativeTime(value?: string) {
  if (!value) {
    return 'Created recently';
  }

  const createdAt = new Date(value).getTime();
  if (Number.isNaN(createdAt)) {
    return 'Created recently';
  }

  const diffHours = Math.max(1, Math.round((Date.now() - createdAt) / (1000 * 60 * 60)));
  return `Created ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
}

function formatCreatedLabel(designId: string, createdAt?: string) {
  return `Design ${designId.slice(-4).toUpperCase()} · ${formatRelativeTime(createdAt)}`;
}

function formatWeight(value?: number | null, unit?: string) {
  if (value == null) {
    return 'Pending';
  }

  return `${value}${unit ? ` ${unit}` : ''}`;
}

export function DesignPreview() {
  const { id } = useParams();
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [favorite, setFavorite] = useState(false);
  const [detail, setDetail] = useState<BackendDesignDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setErrorMessage('Missing design ID.');
      return;
    }

    let cancelled = false;

    fetchBackendDesign(id)
      .then((data) => {
        if (!cancelled) {
          setDetail(data);
          setErrorMessage(null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : 'Unable to load design.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const design = detail?.design;
  const spec = detail?.latestSpec;

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

  const metricRows = useMemo(
    () => [
      { label: 'Complexity', value: `${design?.designDna?.complexity ?? 0}%`, color: 'var(--accent-gold)' },
      { label: 'Spec Ready', value: spec ? '100%' : '40%', color: spec ? 'var(--status-success)' : 'var(--status-warning)' },
      { label: 'Render Ready', value: renderImage ? '100%' : '0%', color: renderImage ? 'var(--status-info)' : 'var(--status-error)' },
    ],
    [design?.designDna?.complexity, renderImage, spec],
  );

  if (errorMessage) {
    return (
      <div className="h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center space-y-3">
          <p className="text-sm font-medium" style={{ color: 'var(--status-error)' }}>{errorMessage}</p>
          <Link to="/app/gallery" className="text-sm font-medium" style={{ color: 'var(--accent-gold)' }}>
            Back to gallery
          </Link>
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
      <div
        className="px-6 py-3 flex items-center justify-between border-b"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            to="/app/gallery"
            className="w-9 h-9 rounded-md flex items-center justify-center transition-all"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {design.displayName}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {formatCreatedLabel(design.designId, design.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFavorite(!favorite)}
            className="px-4 py-2 rounded-md text-sm font-medium border transition-all flex items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: favorite ? 'var(--status-error)' : 'rgba(255,255,255,0.06)',
              color: favorite ? 'var(--status-error)' : 'var(--text-primary)',
            }}
          >
            <Heart className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
            {favorite ? 'Favorited' : 'Favorite'}
          </button>
          <Link
            to="/app/copilot"
            className="px-4 py-2 rounded-md text-sm font-medium border transition-all flex items-center gap-2"
            style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }}
          >
            <Edit className="w-4 h-4" />
            Edit Design
          </Link>
          <Link
            to="/app/export"
            className="px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2"
            style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
          >
            <Download className="w-4 h-4" />
            Export Files
          </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 p-6 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="relative">
            <div
              className="w-[550px] h-[550px] rounded-lg border overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'rgba(255,255,255,0.06)',
                transform: `scale(${zoom / 100})`,
              }}
            >
              <div
                className="relative w-full h-full flex items-center justify-center"
                style={{ transform: `rotateY(${rotation}deg)` }}
              >
                <ImageWithFallback
                  src={renderImage}
                  alt={design.displayName}
                  className="w-full h-full object-contain p-10"
                />
              </div>
            </div>

            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-xl rounded-lg px-4 py-3 border"
              style={{ backgroundColor: 'rgba(17, 17, 17, 0.9)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRotation(rotation - 45)}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    <RotateCw className="w-4 h-4" style={{ transform: 'scaleX(-1)' }} />
                  </button>
                  <button
                    onClick={() => setRotation(rotation + 45)}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-px h-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}></div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setZoom(Math.max(50, zoom - 10))}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-medium min-w-[40px] text-center" style={{ color: 'var(--text-secondary)' }}>
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                    className="w-8 h-8 rounded-md flex items-center justify-center transition-all"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-px h-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}></div>
                <button
                  onClick={() => { setRotation(0); setZoom(100); }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                  style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          className="w-[350px] border-l p-5 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Design Specifications</h2>

          <div className="space-y-5">
            <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {detailRows.map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Gemstone Details</h3>
              <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {gemstoneRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Design Metrics</h3>
              <div className="space-y-3">
                {metricRows.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{metric.label}</span>
                      <span className="text-xs font-semibold" style={{ color: metric.color }}>{metric.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: metric.value, backgroundColor: metric.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="rounded-md p-4 border"
              style={{ backgroundColor: 'rgba(76, 175, 80, 0.08)', borderColor: 'rgba(76, 175, 80, 0.2)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--status-success)' }}></div>
                <h3 className="text-xs font-semibold" style={{ color: 'var(--status-success)' }}>
                  {spec ? 'Ready for Manufacturing' : 'Spec Pending'}
                </h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {spec?.summary ?? design.promptSummary}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Design Variations</h3>
              <div className="rounded-md p-4 space-y-1.5 text-xs" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                <p>• {design.designDna?.bandStyle ?? 'Pending band style'}</p>
                <p>• {design.designDna?.settingType ?? 'Pending setting type'}</p>
                <p>• {design.designDna?.stonePosition ?? 'Pending stone position'}</p>
                <p>• {design.designDna?.profile ?? 'Pending profile'}</p>
                <p>• {design.designDna?.motif ?? 'Pending motif'}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3">
              <Link
                to="/app/export"
                className="w-full py-2.5 rounded-md font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
              >
                <Download className="w-4 h-4" />
                Generate CAD Files
              </Link>
              <Link
                to="/app/copilot"
                className="w-full py-2.5 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-primary)',
                }}
              >
                <Edit className="w-4 h-4" />
                Modify with AI Co-Pilot
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
