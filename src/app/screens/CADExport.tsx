import React from 'react';
import { useState } from 'react';
import { Download, FileText, Check, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const exportFormats = [
  { id: 'svg', name: 'SVG', description: 'Vector graphics format for 2D views', size: '245 KB', icon: '📐' },
  { id: 'stl', name: 'STL', description: 'Standard 3D printing format', size: '1.8 MB', icon: '🖨️' },
  { id: 'step', name: 'STEP CAD', description: 'Professional CAD exchange format', size: '3.2 MB', icon: '⚙️' },
  { id: 'dxf', name: 'DXF', description: 'AutoCAD drawing exchange format', size: '890 KB', icon: '📏' },
  { id: 'rhino', name: 'Rhino 3DM', description: 'Rhinoceros 3D native format', size: '2.4 MB', icon: '🦏' },
  { id: 'obj', name: 'OBJ', description: 'Universal 3D model format', size: '2.1 MB', icon: '📦' },
];

const technicalSpecs = [
  { label: 'Design ID', value: '#4127' },
  { label: 'Created Date', value: 'March 15, 2026' },
  { label: 'Last Modified', value: '2 hours ago' },
  { label: 'Version', value: '1.0' },
  { label: 'Dimensions', value: '18.5 × 18.5 × 7.2 mm' },
  { label: 'Volume', value: '1,247 mm³' },
  { label: 'Surface Area', value: '892 mm²' },
  { label: 'Manufacturing Ready', value: 'Yes' },
];

export function CADExport() {
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const toggleFormat = (id: string) => {
    if (selectedFormats.includes(id)) {
      setSelectedFormats(selectedFormats.filter((f) => f !== id));
    } else {
      setSelectedFormats([...selectedFormats, id]);
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 2000);
  };

  return (
    <div className="h-full overflow-auto p-8 max-w-[1440px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>CAD Export Center</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Export production-ready CAD files in multiple formats
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left - 3D Preview + Specs + Formats */}
        <div className="col-span-2 space-y-6">
          {/* 3D Preview */}
          <div className="rounded-lg border overflow-hidden" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>3D Model Preview</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Diamond Solitaire Ring - Design #4127</p>
            </div>
            <div className="p-8 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div
                className="w-full max-w-[450px] aspect-square rounded-lg border overflow-hidden"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}
              >
                <ImageWithFallback
                  src="https://via.placeholder.com/1080x1080/1A1A1A/D4AF37?text=CAD+Model"
                  alt="3D Preview"
                  className="w-full h-full object-contain p-6"
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Technical Specifications</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {technicalSpecs.map((spec, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{spec.label}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Formats */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Export Formats</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Select one or more formats to export</p>
              </div>
              <button
                onClick={() => setSelectedFormats(exportFormats.map((f) => f.id))}
                className="text-xs font-medium" style={{ color: 'var(--accent-gold)' }}
              >
                Select All
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {exportFormats.map((format) => {
                const isSelected = selectedFormats.includes(format.id);
                return (
                  <button
                    key={format.id}
                    onClick={() => toggleFormat(format.id)}
                    className="relative p-4 rounded-md border transition-all text-left"
                    style={{
                      borderColor: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                      backgroundColor: isSelected ? 'var(--accent-gold-glow)' : 'var(--bg-elevated)',
                    }}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-gold)' }}>
                        <Check className="w-3 h-3" style={{ color: 'var(--text-inverse)' }} />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{format.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{format.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{format.description}</div>
                        <div className="text-xs font-medium mt-1" style={{ color: 'var(--accent-gold)' }}>{format.size}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Export Summary */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Export Summary</h2>
            <div className="space-y-3 mb-5">
              {[
                ['Selected Formats', selectedFormats.length.toString()],
                ['Total Size', selectedFormats.length > 0 ? `${(selectedFormats.length * 1.8).toFixed(1)} MB` : '0 MB'],
                ['Format', 'ZIP Archive'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={selectedFormats.length === 0 || exporting}
              className="w-full py-3 rounded-md font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
            >
              {exporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Exporting Files...</>
              ) : exported ? (
                <><Check className="w-4 h-4" /> Export Complete!</>
              ) : (
                <><Download className="w-4 h-4" /> Export Files</>
              )}
            </button>

            {selectedFormats.length === 0 && (
              <p className="text-xs text-center mt-3" style={{ color: 'var(--text-muted)' }}>
                Select at least one format to export
              </p>
            )}
          </div>

          {/* File Preview List */}
          {selectedFormats.length > 0 && (
            <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Files to Export</h2>
              <div className="space-y-2">
                {exportFormats
                  .filter((f) => selectedFormats.includes(f.id))
                  .map((format) => (
                    <div
                      key={format.id}
                      className="flex items-center gap-3 p-2.5 rounded-md"
                      style={{ backgroundColor: 'var(--bg-elevated)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center border"
                        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                      >
                        <FileText className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          design-4127.{format.id}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{format.size}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Export Guidelines */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'rgba(100, 181, 246, 0.08)', borderColor: 'rgba(100, 181, 246, 0.2)' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--status-info)' }}>Export Guidelines</h3>
            <ul className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {[
                'All files are production-ready and manufacturing validated',
                'STL and STEP formats recommended for 3D printing',
                'Rhino 3DM includes complete parametric data',
                'SVG and DXF suitable for 2D engraving',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span style={{ color: 'var(--status-info)' }}>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Manufacturing Notes */}
          <div className="rounded-lg border p-5" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Manufacturing Notes</h3>
            <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {['Design validated for casting', 'Wall thickness: 0.8mm minimum', 'Stone settings verified', 'No undercuts detected'].map((note, i) => (
                <p key={i}>
                  <span style={{ color: 'var(--status-success)' }}>✓</span> {note}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
