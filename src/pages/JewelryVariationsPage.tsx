import React from 'react';
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ImageIcon,
  X,
  Loader2,
} from 'lucide-react';
import { analyzeJewelryImage, type JewelryAttributes } from '../lib/jewelryAnalysis';
import { buildVariationPrompts, type VariationPrompt } from '../lib/jewelryPromptBuilder';
import { generateAllVariations, type VariationResult, generateXaiImage } from '../lib/xaiImageGeneration';

type InputMode = 'upload' | 'url';

const AXIS_COLORS: Record<string, string> = {
  material_swap: '#7c3aed',
  era_transposition: '#2563eb',
  finish_contrast: '#059669',
  scale_shift: '#d97706',
};

export function JewelryVariationsPage() {
  const [inputMode, setInputMode] = useState<InputMode>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<{ data: string; mediaType: string } | null>(null);
  const [urlError, setUrlError] = useState('');
  const [fileError, setFileError] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [attributes, setAttributes] = useState<JewelryAttributes | null>(null);

  const [generating, setGenerating] = useState(false);
  const [variations, setVariations] = useState<VariationResult[]>([]);
  const [expandedPrompt, setExpandedPrompt] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // ── File handling ──

  const processFile = useCallback((file: File) => {
    setFileError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Only JPG, PNG, and WebP files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('File must be under 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      const [header, data] = result.split(',');
      const mediaType = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
      setImageBase64({ data, mediaType });
      setAttributes(null);
      setVariations([]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleUrlSubmit = () => {
    setUrlError('');
    try {
      new URL(imageUrl);
    } catch {
      setUrlError('Please enter a valid URL.');
      return;
    }
    if (!/\.(jpg|jpeg|png|webp|gif)/i.test(imageUrl) && !imageUrl.includes('unsplash') && !imageUrl.includes('imgen.x.ai')) {
      setUrlError('URL should point to an image file (jpg, png, webp).');
      return;
    }
    setImagePreview(imageUrl);
    setImageBase64(null);
    setAttributes(null);
    setVariations([]);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageUrl('');
    setAttributes(null);
    setVariations([]);
    setAnalysisError('');
  };

  // ── Step 1: Analyze ──

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setAnalyzing(true);
    setAnalysisError('');
    setAttributes(null);
    setVariations([]);

    try {
      const input = imageBase64
        ? { type: 'base64' as const, data: imageBase64.data, mediaType: imageBase64.mediaType }
        : { type: 'url' as const, url: imagePreview };
      const result = await analyzeJewelryImage(input);
      setAttributes(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Step 2+3: Generate variations ──

  const handleGenerate = async () => {
    if (!attributes) return;
    setGenerating(true);

    const prompts = buildVariationPrompts(attributes);
    const initialResults: VariationResult[] = prompts.map((p) => ({
      ...p,
      imageUrl: null,
      error: null,
      status: 'loading' as const,
    }));
    setVariations(initialResults);

    await generateAllVariations(prompts, (index, result) => {
      setVariations((prev) => {
        const next = [...prev];
        next[index] = result;
        return next;
      });
    });

    setGenerating(false);
  };

  // ── Regenerate single ──

  const handleRegenerate = async (index: number) => {
    const variation = variations[index];
    if (!variation) return;

    setVariations((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'loading', error: null, imageUrl: null };
      return next;
    });

    try {
      const imageUrl = await generateXaiImage(variation.prompt);
      setVariations((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], imageUrl, status: 'success', error: null };
        return next;
      });
    } catch (err) {
      setVariations((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], status: 'error', error: err instanceof Error ? err.message : 'Failed' };
        return next;
      });
    }
  };

  const handleDownload = (url: string, label: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `variation-${label.toLowerCase().replace(/\s/g, '-')}.jpg`;
    a.click();
  };

  return (
    <div className="h-full overflow-auto bg-background">
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Jewelry Variations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a jewelry image, analyze its attributes, and generate 4 AI variations
          </p>
        </div>

        {/* ═══ Input Section ═══ */}
        <div className="rounded-xl border border-border bg-card p-6 mb-6">
          {/* Mode toggle */}
          <div className="flex rounded-md p-0.5 mb-5 w-fit" style={{ backgroundColor: '#f3f3f5' }}>
            {(['upload', 'url'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => { setInputMode(mode); setFileError(''); setUrlError(''); }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-all capitalize"
                style={{
                  backgroundColor: inputMode === mode ? '#ffffff' : 'transparent',
                  color: inputMode === mode ? '#030213' : '#717182',
                  boxShadow: inputMode === mode ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {mode === 'upload' ? <Upload className="w-3.5 h-3.5" /> : <LinkIcon className="w-3.5 h-3.5" />}
                {mode === 'upload' ? 'Upload Image' : 'Image URL'}
              </button>
            ))}
          </div>

          {!imagePreview ? (
            <>
              {inputMode === 'upload' ? (
                /* Drop zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: isDragOver ? '#7c3aed' : 'rgba(0,0,0,0.1)',
                    backgroundColor: isDragOver ? 'rgba(124,58,237,0.04)' : '#f3f3f5',
                  }}
                >
                  <ImageIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    Drop your jewelry image here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP — max 10MB</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.[0]) processFile(e.target.files[0]); }}
                  />
                </div>
              ) : (
                /* URL input */
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => { setImageUrl(e.target.value); setUrlError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSubmit(); }}
                    placeholder="https://example.com/jewelry-image.jpg"
                    className="flex-1 px-3 py-2.5 text-sm rounded-md border border-border bg-input-background text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 placeholder:text-muted-foreground"
                  />
                  <button
                    onClick={handleUrlSubmit}
                    className="px-4 py-2.5 rounded-md text-sm font-medium text-white"
                    style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
                  >
                    Load
                  </button>
                </div>
              )}
              {fileError && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fileError}</p>}
              {urlError && <p className="text-xs text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{urlError}</p>}
            </>
          ) : (
            /* Image preview */
            <div className="relative">
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 z-10 w-7 h-7 rounded-md flex items-center justify-center bg-white border border-border text-muted-foreground hover:text-foreground shadow-sm transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <img
                src={imagePreview}
                alt="Jewelry preview"
                className="w-full max-h-[360px] object-contain rounded-lg bg-input-background"
              />
              {!attributes && !analyzing && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleAnalyze}
                    className="px-5 py-2.5 rounded-md text-sm font-medium text-white flex items-center gap-2"
                    style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
                  >
                    <Sparkles className="w-4 h-4" /> Analyze with AI
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Analyzing state */}
          {analyzing && (
            <div className="mt-4 flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              <span className="text-sm text-muted-foreground">Analyzing jewelry attributes...</span>
            </div>
          )}

          {/* Analysis error */}
          {analysisError && (
            <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-700">{analysisError}</span>
              </div>
              <button
                onClick={handleAnalyze}
                className="px-3 py-1 rounded-md text-xs font-medium text-red-600 border border-red-300 hover:bg-red-100 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {/* Detected attributes */}
          {attributes && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5"
            >
              <label className="text-xs font-medium text-foreground mb-2 block">Detected Attributes</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Type', value: attributes.piece_type },
                  { label: 'Era', value: attributes.style_era },
                  { label: 'Form', value: attributes.silhouette_form },
                  { label: 'Mood', value: attributes.mood },
                  ...attributes.materials.map((m) => ({ label: 'Material', value: m })),
                  ...attributes.gemstones.map((g) => ({ label: 'Gem', value: g })),
                  ...attributes.finish_texture.map((f) => ({ label: 'Finish', value: f })),
                  ...attributes.motifs.map((m) => ({ label: 'Motif', value: m })),
                ].map((attr, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border border-border bg-input-background"
                  >
                    <span className="text-muted-foreground">{attr.label}:</span>
                    <span className="font-medium text-foreground">{attr.value}</span>
                  </span>
                ))}
              </div>

              {/* Generate button */}
              {variations.length === 0 && (
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={handleGenerate}
                    className="px-5 py-2.5 rounded-md text-sm font-medium text-white flex items-center gap-2"
                    style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
                  >
                    <Sparkles className="w-4 h-4" /> Generate 4 Variations
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* ═══ Output Grid ═══ */}
        {variations.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">Variations</h2>
              {!generating && (
                <button
                  onClick={handleGenerate}
                  className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Regenerate All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {variations.map((v, index) => (
                  <motion.div
                    key={v.axis}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    {/* Image / Loading / Error */}
                    <div className="aspect-square relative bg-input-background">
                      {v.status === 'loading' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-12 h-12 rounded-lg mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ backgroundColor: `${AXIS_COLORS[v.axis]}15` }}>
                              <Loader2 className="w-5 h-5 animate-spin" style={{ color: AXIS_COLORS[v.axis] }} />
                            </div>
                            <p className="text-xs text-muted-foreground">Generating {v.label}...</p>
                          </div>
                          {/* Shimmer overlay */}
                          <div className="absolute inset-0 overflow-hidden">
                            <div
                              className="absolute inset-0"
                              style={{
                                background: 'linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 1.5s infinite ease-in-out',
                              }}
                            />
                          </div>
                        </div>
                      )}
                      {v.status === 'success' && v.imageUrl && (
                        <img
                          src={v.imageUrl}
                          alt={v.label}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {v.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div className="text-center">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
                            <p className="text-xs text-red-500 mb-3">{v.error}</p>
                            <button
                              onClick={() => handleRegenerate(index)}
                              className="px-3 py-1.5 rounded-md text-xs font-medium text-red-600 border border-red-300 bg-white hover:bg-red-50 transition-colors flex items-center gap-1 mx-auto"
                            >
                              <RefreshCw className="w-3 h-3" /> Regenerate
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Axis badge */}
                      <div
                        className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-semibold text-white shadow-sm"
                        style={{ backgroundColor: AXIS_COLORS[v.axis] || '#7c3aed' }}
                      >
                        {v.label}
                      </div>

                      {/* Download button */}
                      {v.status === 'success' && v.imageUrl && (
                        <button
                          onClick={() => handleDownload(v.imageUrl!, v.label)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-md flex items-center justify-center bg-white border border-border text-muted-foreground hover:text-foreground shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3.5">
                      <p className="text-xs text-foreground font-medium mb-1">{v.description}</p>

                      {/* Collapsible prompt */}
                      <button
                        onClick={() => setExpandedPrompt(expandedPrompt === index ? null : index)}
                        className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors mt-1"
                      >
                        {expandedPrompt === index ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        {expandedPrompt === index ? 'Hide prompt' : 'Show prompt'}
                      </button>
                      <AnimatePresence>
                        {expandedPrompt === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="text-[10px] text-muted-foreground mt-2 p-2 rounded bg-input-background leading-relaxed font-mono">
                              {v.prompt}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Shimmer animation CSS */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
