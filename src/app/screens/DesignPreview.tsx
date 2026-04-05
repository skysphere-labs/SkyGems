import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Download, Edit, RotateCw, ZoomIn, ZoomOut, Heart } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function DesignPreview() {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [favorite, setFavorite] = useState(false);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
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
            <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Diamond Solitaire Ring</h1>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Design #4127 &middot; Created 2 hours ago</p>
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
        {/* Main 3D Viewer */}
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
                  src="https://via.placeholder.com/1080x1080/1A1A1A/D4AF37?text=3D+Preview"
                  alt="3D Design Preview"
                  className="w-full h-full object-contain p-10"
                />
              </div>
            </div>

            {/* 3D Controls */}
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

        {/* Right Side Panel */}
        <div
          className="w-[350px] border-l p-5 overflow-y-auto"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>Design Specifications</h2>

          <div className="space-y-5">
            {/* Basic Info */}
            <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              {[
                ['Metal Type', 'Platinum 950'],
                ['Metal Weight', '4.2g'],
                ['Ring Size', 'US 7 (Adjustable)'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1.5 text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Gemstone Details */}
            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Gemstone Details</h3>
              <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {[
                  ['Primary Stone', 'Diamond'],
                  ['Carat Weight', '1.5 ct'],
                  ['Cut', 'Round Brilliant'],
                  ['Clarity', 'VS1'],
                  ['Color', 'D (Colorless)'],
                  ['Accent Stones', '12 diamonds (0.3ct)'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Design Metrics */}
            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Design Metrics</h3>
              <div className="space-y-3">
                {[
                  { label: 'Symmetry Rating', value: '98%', color: 'var(--accent-gold)' },
                  { label: 'Manufacturing Feasibility', value: '95%', color: 'var(--status-success)' },
                  { label: 'Durability Score', value: '92%', color: 'var(--status-info)' },
                ].map((metric) => (
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

            {/* Manufacturing Status */}
            <div
              className="rounded-md p-4 border"
              style={{ backgroundColor: 'rgba(76, 175, 80, 0.08)', borderColor: 'rgba(76, 175, 80, 0.2)' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--status-success)' }}></div>
                <h3 className="text-xs font-semibold" style={{ color: 'var(--status-success)' }}>Ready for Manufacturing</h3>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                This design meets all manufacturing requirements and is ready for CAD export and production.
              </p>
            </div>

            {/* Estimated Costs */}
            <div>
              <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Estimated Costs</h3>
              <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                {[
                  ['Material Cost', '$2,850'],
                  ['Manufacturing', '$450'],
                  ['Labor', '$300'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1 text-sm">
                    <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Total Estimated Cost</span>
                    <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>$3,600</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
