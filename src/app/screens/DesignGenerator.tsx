import React from 'react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, Copy, Check, Pencil, Wand2, Download, Share2, Eye, Undo, Redo, ZoomIn, ZoomOut, ChevronDown, Settings2, X, Crown, Gem, Palette, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateJewelryPrompt, RenderMode } from '../utils/promptGenerator';
import { fetchPromptPreview } from '../services/skygemsApi';
import { PipelineView } from '../components/pipeline/PipelineView';
import { Slider } from '../components/ui/slider';
import catalogData from '../../../jewelry-analysis-results.json';

/* ═══════════════════════════════════════════════
   JEWELRY TAXONOMY — Full customer-requested data
   ═══════════════════════════════════════════════ */

interface GroupedOption { group: string; items: { id: string; name: string }[] }

const PIECE_TYPES: GroupedOption[] = [
  { group: 'Core', items: [
    { id: 'ring', name: 'Ring' }, { id: 'earrings', name: 'Earrings' },
    { id: 'necklace', name: 'Necklace' }, { id: 'bracelet', name: 'Bracelet' },
    { id: 'pendant', name: 'Pendant' }, { id: 'anklet', name: 'Anklet' },
  ]},
  { group: 'Statement', items: [
    { id: 'brooch', name: 'Brooch' }, { id: 'tiara', name: 'Tiara' },
    { id: 'body-chain', name: 'Body Chain' }, { id: 'hair-jewelry', name: 'Hair Jewelry' },
  ]},
  { group: 'Specialty', items: [
    { id: 'cufflinks', name: 'Cufflinks' }, { id: 'nose-ring', name: 'Nose Ring' },
    { id: 'toe-ring', name: 'Toe Ring' },
  ]},
];

const MATERIALS: GroupedOption[] = [
  { group: 'Precious', items: [
    { id: 'gold', name: 'Yellow Gold' }, { id: 'white-gold', name: 'White Gold' },
    { id: 'rose-gold', name: 'Rose Gold' }, { id: 'platinum', name: 'Platinum' },
    { id: 'silver', name: 'Sterling Silver' },
  ]},
];

const STONES: GroupedOption[] = [
  { group: 'None', items: [{ id: 'none', name: 'No stones' }] },
  { group: 'Precious', items: [
    { id: 'diamond', name: 'Diamond' }, { id: 'ruby', name: 'Ruby' },
    { id: 'sapphire', name: 'Sapphire' }, { id: 'emerald', name: 'Emerald' },
  ]},
  { group: 'Semi-Precious', items: [
    { id: 'amethyst', name: 'Amethyst' }, { id: 'topaz', name: 'Topaz' },
    { id: 'garnet', name: 'Garnet' }, { id: 'aquamarine', name: 'Aquamarine' },
    { id: 'tourmaline', name: 'Tourmaline' }, { id: 'peridot', name: 'Peridot' },
    { id: 'citrine', name: 'Citrine' }, { id: 'tanzanite', name: 'Tanzanite' },
  ]},
  { group: 'Organic', items: [
    { id: 'pearl', name: 'Pearl' }, { id: 'coral', name: 'Coral' },
  ]},
  { group: 'Decorative', items: [
    { id: 'turquoise', name: 'Turquoise' }, { id: 'lapis-lazuli', name: 'Lapis Lazuli' },
    { id: 'opal', name: 'Opal' }, { id: 'onyx', name: 'Onyx' },
    { id: 'moonstone', name: 'Moonstone' }, { id: 'labradorite', name: 'Labradorite' },
  ]},
  { group: 'Lab-Grown', items: [
    { id: 'moissanite', name: 'Moissanite' }, { id: 'cubic-zirconia', name: 'Cubic Zirconia' },
    { id: 'lab-diamond', name: 'Lab Diamond' },
  ]},
];

const STYLES: GroupedOption[] = [
  { group: 'Classic', items: [
    { id: 'fine', name: 'Fine Jewelry' }, { id: 'vintage', name: 'Vintage' },
    { id: 'art-deco', name: 'Art Deco' }, { id: 'art-nouveau', name: 'Art Nouveau' },
  ]},
  { group: 'Modern', items: [
    { id: 'contemporary', name: 'Contemporary' }, { id: 'minimalist', name: 'Minimalist' },
    { id: 'futuristic', name: 'Futuristic' }, { id: 'geometric', name: 'Geometric' },
  ]},
  { group: 'Cultural', items: [
    { id: 'temple', name: 'Indian Temple' }, { id: 'kundan', name: 'Kundan' },
    { id: 'middle-eastern', name: 'Middle Eastern' }, { id: 'east-asian', name: 'East Asian' },
    { id: 'african-tribal', name: 'African Tribal' },
  ]},
  { group: 'Fashion', items: [
    { id: 'bohemian', name: 'Bohemian' }, { id: 'gothic', name: 'Gothic' },
    { id: 'punk', name: 'Punk / Edgy' }, { id: 'streetwear', name: 'Streetwear' },
  ]},
  { group: 'Niche', items: [
    { id: 'steampunk', name: 'Steampunk' }, { id: 'cyberpunk', name: 'Cyberpunk' },
    { id: 'cottagecore', name: 'Cottagecore' }, { id: 'spiritual', name: 'Spiritual' },
  ]},
];

// Advanced options (Layer 2)
const DESIGN_FORMS = [
  { id: 'minimalist', name: 'Minimalist' }, { id: 'statement', name: 'Statement / Bold' },
  { id: 'geometric', name: 'Geometric' }, { id: 'organic', name: 'Organic' },
  { id: 'modular', name: 'Modular' }, { id: 'kinetic', name: 'Kinetic' },
];
const INSPIRATIONS = [
  { id: 'nature', name: 'Nature' }, { id: 'architecture', name: 'Architecture' },
  { id: 'celestial', name: 'Celestial' }, { id: 'mythology', name: 'Mythology' },
  { id: 'cultural', name: 'Cultural Heritage' },
];
const FINISHES = [
  { id: 'high-polish', name: 'High Polish' }, { id: 'matte', name: 'Matte / Satin' },
  { id: 'hammered', name: 'Hammered' }, { id: 'brushed', name: 'Brushed' },
  { id: 'oxidized', name: 'Oxidized' }, { id: 'textured', name: 'Textured' },
  { id: 'engraved', name: 'Engraved' },
];
const STONE_CUTS = [
  { id: 'round-brilliant', name: 'Round Brilliant' }, { id: 'princess', name: 'Princess' },
  { id: 'oval', name: 'Oval' }, { id: 'emerald-cut', name: 'Emerald Cut' },
  { id: 'cushion', name: 'Cushion' }, { id: 'pear', name: 'Pear' },
  { id: 'marquise', name: 'Marquise' }, { id: 'cabochon', name: 'Cabochon' },
];
const STONE_SETTINGS = [
  { id: 'prong', name: 'Prong' }, { id: 'bezel', name: 'Bezel' },
  { id: 'pave', name: 'Pavé' }, { id: 'channel', name: 'Channel' },
  { id: 'tension', name: 'Tension' }, { id: 'halo', name: 'Halo' },
  { id: 'invisible', name: 'Invisible' },
];
const RENDER_OPTIONS = [
  { id: 'sketch', name: 'Sketch — Hand-drawn concept art' },
  { id: 'realistic', name: 'Realistic — Photorealistic render' },
  { id: 'both', name: 'Both — Sketch + Realistic split' },
];

/* ── Quick Start Presets ── */
const PRESETS = [
  { label: 'Bridal Ring', type: 'ring', metal: 'gold', stone: ['diamond'], style: 'fine', complexity: 60 },
  { label: 'Boho Necklace', type: 'necklace', metal: 'silver', stone: ['turquoise'], style: 'bohemian', complexity: 50 },
  { label: 'Minimal Studs', type: 'earrings', metal: 'gold', stone: ['diamond'], style: 'minimalist', complexity: 20 },
  { label: 'Temple Set', type: 'necklace', metal: 'gold', stone: ['ruby', 'pearl'], style: 'temple', complexity: 80 },
  { label: 'Gothic Cuff', type: 'bracelet', metal: 'silver', stone: ['onyx'], style: 'gothic', complexity: 70 },
  { label: 'Art Deco Pendant', type: 'pendant', metal: 'platinum', stone: ['emerald'], style: 'art-deco', complexity: 65 },
];

/* ── AI Suggestion pills (shown after generation) ── */
const AI_SUGGESTIONS = [
  'Make it bolder', 'Add filigree details', 'Switch to silver', 'More gemstones',
  'Simplify the design', 'Add engraving', 'Make it vintage', 'Add a halo setting',
];

/* ═══════════════════════════════════════════════
   ELEGANT COLLECTION — Brand DNA from catalog
   ═══════════════════════════════════════════════ */

interface CatalogProduct {
  product_code: string;
  analyzed_image: string;
  all_images: string[];
  image_count: number;
  attributes: {
    piece_type: string;
    style_era: string;
    silhouette_form: string;
    materials: string[];
    gemstones: string[];
    finish_texture: string[];
    motifs: string[];
    mood: string;
  };
}

const CATALOG_PRODUCTS = Object.values(catalogData.products) as CatalogProduct[];

const BRAND_DNA = {
  style: 'Contemporary / Modern',
  materials: 'White Gold, Yellow Gold, Platinum',
  gemstones: 'Diamonds (natural & lab-grown)',
  finish: 'High Polish',
  motifs: 'Pavé, Halo, Split Shank, Eternity, Cluster',
  mood: 'Elegant, Sparkling, Luxurious',
};

const BRAND_STYLE_GUIDE = `Brand consistency: contemporary clean lines, high-polish precious metal (white gold or yellow gold), diamond-focused pavé settings, elegant and sparkling mood. Ensure refined proportions, no ornate filigree unless specified. Maintain a luxurious, commercially viable aesthetic matching fine jewelry retail standards.`;

// Presets derived from actual catalog products
const ELEGANT_PRESETS: { label: string; code: string; type: string; metal: string; stone: string[]; style: string; complexity: number; motifs: string }[] = [
  { label: 'Pavé Solitaire', code: 'GR0324JS', type: 'ring', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 60, motifs: 'pavé setting, split shank' },
  { label: 'Diamond Hoops', code: 'VE2966L', type: 'earrings', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 50, motifs: 'pavé setting' },
  { label: 'Eternity Band', code: 'ZR0233P', type: 'ring', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 55, motifs: 'eternity loop' },
  { label: 'Halo Cluster', code: 'ZR0085NE', type: 'ring', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 75, motifs: 'cluster, halo, pavé setting' },
  { label: 'Cross Pendant', code: 'KP0960H', type: 'pendant', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 55, motifs: 'cross, pavé setting' },
  { label: 'Two-Tone Band', code: 'GR2970H-TT', type: 'ring', metal: 'gold', stone: ['diamond'], style: 'contemporary', complexity: 50, motifs: 'linear arrangement, prong-set' },
  { label: 'Chain Link Drops', code: 'WE0072Z', type: 'earrings', metal: 'silver', stone: ['diamond'], style: 'contemporary', complexity: 65, motifs: 'chain links, pavé' },
  { label: 'Wave Hoops', code: 'WE0094K', type: 'earrings', metal: 'gold', stone: ['diamond'], style: 'contemporary', complexity: 55, motifs: 'crescent waves, pavé setting' },
  { label: 'Dome Studs', code: 'VE2993D', type: 'earrings', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 45, motifs: 'pavé dome' },
  { label: 'Wide Pavé Band', code: 'ZR0071K', type: 'ring', metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 70, motifs: 'rows of round brilliants, pavé' },
];

/* ── Figma Colors ── */
const c = {
  bg: '#ffffff', bgInput: '#f3f3f5', fg: '#030213', fgMuted: '#717182',
  border: 'rgba(0, 0, 0, 0.1)', accent: '#e9ebef',
  gradFrom: '#7c3aed', gradTo: '#2563eb', ring: 'rgba(124, 58, 237, 0.3)',
};

/* ═══════════════════════════════════
   COMPONENT
   ═══════════════════════════════════ */

export function DesignGenerator() {
  // Core state
  const [selectedType, setSelectedType] = useState('ring');
  const [selectedMetal, setSelectedMetal] = useState('gold');
  const [selectedStones, setSelectedStones] = useState<string[]>(['diamond']);
  const [selectedStyle, setSelectedStyle] = useState('contemporary');
  const [complexity, setComplexity] = useState(50);
  const [renderMode, setRenderMode] = useState<RenderMode>('sketch');
  const [variations, setVariations] = useState(4);

  // Advanced (Layer 2)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [designForm, setDesignForm] = useState('');
  const [inspiration, setInspiration] = useState<string[]>([]);
  const [finish, setFinish] = useState('');
  const [stoneCut, setStoneCut] = useState('');
  const [stoneSetting, setStoneSetting] = useState('');

  // UI state
  const [copied, setCopied] = useState(false);
  const [pipelineRunCount, setPipelineRunCount] = useState(0);
  const [promptText, setPromptText] = useState('');
  const [promptEdited, setPromptEdited] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'prompt' | 'elegant'>('generate');
  const [hasGenerated, setHasGenerated] = useState(false);

  // Elegant tab state
  const [brandGuideEnabled, setBrandGuideEnabled] = useState(false);
  const [selectedCatalogRef, setSelectedCatalogRef] = useState<string | null>(null);
  const [elegantExpandedProduct, setElegantExpandedProduct] = useState<string | null>(null);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const designConfigRef = useRef({
    type: selectedType, metal: selectedMetal, gemstones: selectedStones,
    style: selectedStyle, complexity, variations,
  });

  // Config history for undo/redo
  const [configHistory, setConfigHistory] = useState<Array<typeof designConfigRef.current>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ── Prompt state — only populated when user clicks Generate ──
  const [promptSource, setPromptSource] = useState<'agent' | 'fallback' | 'idle'>('idle');

  const handlePromptChange = (v: string) => { setPromptText(v); setPromptEdited(true); };
  const handleResetPrompt = () => { setPromptEdited(false); };

  const handleGenerate = async () => {
    designConfigRef.current = { type: selectedType, metal: selectedMetal, gemstones: selectedStones, style: selectedStyle, complexity, variations };
    // Save to history
    setConfigHistory(prev => [...prev.slice(0, historyIndex + 1), designConfigRef.current]);
    setHistoryIndex(prev => prev + 1);

    // Ask the prompt-agent to craft the prompt BEFORE running the pipeline
    setPromptSource('idle');
    const notesParts: string[] = [];
    if (designForm) notesParts.push(`Design form: ${designForm}`);
    if (inspiration.length) notesParts.push(`Inspired by: ${inspiration.join(', ')}`);
    if (finish) notesParts.push(`Surface finish: ${finish}`);
    if (stoneCut) notesParts.push(`Stone cut: ${stoneCut}`);
    if (stoneSetting) notesParts.push(`Setting type: ${stoneSetting}`);

    try {
      const result = await fetchPromptPreview({
        type: selectedType,
        metal: selectedMetal,
        gemstones: selectedStones,
        style: selectedStyle,
        complexity,
        userNotes: notesParts.length > 0 ? notesParts.join('. ') : undefined,
      });
      setPromptText(result.promptText);
      setPromptSource(result.source === 'live' ? 'agent' : 'fallback');
      if (result.source === 'fallback' && result.errorMessage) {
        console.warn('[SkyGems] Prompt agent fallback:', result.errorMessage);
      }
    } catch (err) {
      console.error('[SkyGems] Prompt preview failed:', err);
      setPromptSource('fallback');
    }

    setPipelineRunCount(cnt => cnt + 1);
    setHasGenerated(true);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = configHistory[historyIndex - 1];
      setSelectedType(prev.type); setSelectedMetal(prev.metal);
      setSelectedStones(prev.gemstones); setSelectedStyle(prev.style);
      setComplexity(prev.complexity); setVariations(prev.variations);
      setHistoryIndex(i => i - 1);
    }
  };
  const handleRedo = () => {
    if (historyIndex < configHistory.length - 1) {
      const next = configHistory[historyIndex + 1];
      setSelectedType(next.type); setSelectedMetal(next.metal);
      setSelectedStones(next.gemstones); setSelectedStyle(next.style);
      setComplexity(next.complexity); setVariations(next.variations);
      setHistoryIndex(i => i + 1);
    }
  };

  const copyPromptToClipboard = () => { navigator.clipboard.writeText(promptText); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedType(preset.type); setSelectedMetal(preset.metal);
    setSelectedStones(preset.stone); setSelectedStyle(preset.style);
    setComplexity(preset.complexity); setPromptEdited(false);
  };

  const applySuggestion = (suggestion: string) => {
    setPromptText(prev => prev + `\n\n${suggestion}.`);
    setPromptEdited(true);
  };

  const applyElegantPreset = (preset: typeof ELEGANT_PRESETS[0]) => {
    setSelectedType(preset.type); setSelectedMetal(preset.metal);
    setSelectedStones(preset.stone); setSelectedStyle(preset.style);
    setComplexity(preset.complexity); setPromptEdited(false);
    setSelectedCatalogRef(preset.code);
    setBrandGuideEnabled(true);
    setStoneSetting('pave'); setFinish('high-polish');
    setActiveTab('generate');
  };

  const toggleStone = (id: string) => {
    if (id === 'none') { setSelectedStones([]); return; }
    setSelectedStones(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleInspiration = (id: string) => {
    setInspiration(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  // ── Grouped Dropdown ──
  const GroupedSelect = ({ id, label, value, groups, onSelect }: {
    id: string; label: string; value: string; groups: GroupedOption[]; onSelect: (v: string) => void;
  }) => {
    const isOpen = openDropdown === id;
    const allItems = groups.flatMap(g => g.items);
    const displayName = allItems.find(i => i.id === value)?.name || value;
    return (
      <div className="space-y-1.5">
        <label style={{ fontSize: 14, fontWeight: 500, color: c.fg }}>{label}</label>
        <div className="relative">
          <button onClick={() => setOpenDropdown(isOpen ? null : id)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm text-left"
            style={{ backgroundColor: c.bgInput, borderColor: c.border, color: c.fg }}>
            <span>{displayName}</span>
            <ChevronDown className="w-3 h-3" style={{ color: c.fgMuted }} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-md border shadow-xl max-h-[280px] overflow-y-auto" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                {groups.map(group => (
                  <div key={group.group}>
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.fgMuted, backgroundColor: c.bgInput }}>
                      {group.group}
                    </div>
                    {group.items.map(item => (
                      <button key={item.id} onClick={() => { onSelect(item.id); setOpenDropdown(null); }}
                        className="w-full text-left px-3 py-1.5 text-sm transition-all"
                        style={{ backgroundColor: value === item.id ? `${c.gradFrom}08` : 'transparent', color: c.fg }}
                        onMouseEnter={e => { if (value !== item.id) e.currentTarget.style.backgroundColor = c.bgInput; }}
                        onMouseLeave={e => { if (value !== item.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                        {item.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Grouped Multi-Select ──
  const GroupedMultiSelect = ({ id, label, selected, groups, onToggle }: {
    id: string; label: string; selected: string[]; groups: GroupedOption[]; onToggle: (v: string) => void;
  }) => {
    const isOpen = openDropdown === id;
    const allItems = groups.flatMap(g => g.items);
    const display = selected.length === 0 ? 'None' : selected.map(s => allItems.find(i => i.id === s)?.name || s).join(', ');
    return (
      <div className="space-y-1.5">
        <label style={{ fontSize: 14, fontWeight: 500, color: c.fg }}>{label}</label>
        <div className="relative">
          <button onClick={() => setOpenDropdown(isOpen ? null : id)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md border text-sm text-left"
            style={{ backgroundColor: c.bgInput, borderColor: c.border, color: c.fg }}>
            <span className="truncate">{display}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: c.fgMuted }} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-md border shadow-xl max-h-[280px] overflow-y-auto" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                {groups.map(group => (
                  <div key={group.group}>
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.fgMuted, backgroundColor: c.bgInput }}>
                      {group.group}
                    </div>
                    {group.items.map(item => {
                      const active = item.id === 'none' ? selected.length === 0 : selected.includes(item.id);
                      return (
                        <button key={item.id} onClick={() => onToggle(item.id)}
                          className="w-full text-left px-3 py-1.5 text-sm transition-all flex items-center gap-2"
                          style={{ backgroundColor: active ? `${c.gradFrom}08` : 'transparent', color: c.fg }}
                          onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = c.bgInput; }}
                          onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = active ? `${c.gradFrom}08` : 'transparent'; }}>
                          <span className="w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0"
                            style={{ borderColor: active ? c.gradFrom : c.border, backgroundColor: active ? c.gradFrom : 'transparent' }}>
                            {active && <Check className="w-2 h-2 text-white" />}
                          </span>
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Simple Select ──
  const SimpleSelect = ({ id, label, value, options, onSelect }: {
    id: string; label: string; value: string; options: { id: string; name: string }[]; onSelect: (v: string) => void;
  }) => {
    const isOpen = openDropdown === id;
    return (
      <div className="space-y-1.5">
        <label style={{ fontSize: 13, fontWeight: 500, color: c.fg }}>{label}</label>
        <div className="relative">
          <button onClick={() => setOpenDropdown(isOpen ? null : id)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md border text-xs text-left"
            style={{ backgroundColor: c.bgInput, borderColor: c.border, color: c.fg }}>
            <span>{options.find(o => o.id === value)?.name || value || 'Select...'}</span>
            <ChevronDown className="w-3 h-3" style={{ color: c.fgMuted }} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpenDropdown(null)} />
              <div className="absolute left-0 right-0 top-full mt-1 z-40 rounded-md border shadow-lg max-h-[200px] overflow-y-auto" style={{ backgroundColor: c.bg, borderColor: c.border }}>
                {options.map(opt => (
                  <button key={opt.id} onClick={() => { onSelect(opt.id); setOpenDropdown(null); }}
                    className="w-full text-left px-3 py-1.5 text-xs transition-all"
                    style={{ backgroundColor: value === opt.id ? `${c.gradFrom}08` : 'transparent', color: c.fg }}
                    onMouseEnter={e => { if (value !== opt.id) e.currentTarget.style.backgroundColor = c.bgInput; }}
                    onMouseLeave={e => { if (value !== opt.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    {opt.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Prompt Chips ──
  const PromptChips = () => {
    const allTypes = PIECE_TYPES.flatMap(g => g.items);
    const allMaterials = MATERIALS.flatMap(g => g.items);
    const allStyles = STYLES.flatMap(g => g.items);
    const chips = [
      { label: allTypes.find(t => t.id === selectedType)?.name || selectedType, onClick: () => setOpenDropdown('type') },
      { label: allMaterials.find(m => m.id === selectedMetal)?.name || selectedMetal, onClick: () => setOpenDropdown('metal') },
      { label: selectedStones.length === 0 ? 'No stones' : selectedStones.slice(0, 2).join(', ') + (selectedStones.length > 2 ? '...' : ''), onClick: () => setOpenDropdown('stones') },
      { label: allStyles.find(s => s.id === selectedStyle)?.name || selectedStyle, onClick: () => setOpenDropdown('style') },
      { label: renderMode.charAt(0).toUpperCase() + renderMode.slice(1), onClick: () => setOpenDropdown('render') },
    ];
    return (
      <div className="flex flex-wrap gap-1">
        {chips.map((chip, i) => (
          <button key={i} onClick={chip.onClick}
            className="px-2 py-0.5 rounded text-[10px] font-medium border transition-all"
            style={{ borderColor: c.border, color: c.gradFrom, backgroundColor: `${c.gradFrom}06` }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = `${c.gradFrom}12`}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = `${c.gradFrom}06`}>
            {chip.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: c.bg, color: c.fg }}>
      {/* ═══ Toolbar ═══ */}
      <div className="px-4 py-2 flex items-center justify-between flex-shrink-0 border-b" style={{ backgroundColor: `${c.bg}cc`, borderColor: c.border, backdropFilter: 'blur(8px)' }}>
        <div className="flex items-center gap-1">
          <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-md transition-colors disabled:opacity-30" style={{ color: c.fgMuted }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c.accent} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Undo className="w-4 h-4" />
          </button>
          <button onClick={handleRedo} disabled={historyIndex >= configHistory.length - 1} className="p-2 rounded-md transition-colors disabled:opacity-30" style={{ color: c.fgMuted }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = c.accent} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <Redo className="w-4 h-4" />
          </button>
          <div className="mx-2 h-5 w-px" style={{ backgroundColor: c.border }} />
          <PromptChips />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white" style={{ background: `linear-gradient(to right, ${c.gradFrom}, ${c.gradTo})` }}>
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ═══ Sidebar ═══ */}
        <div className="w-80 border-r flex flex-col h-full min-h-0" style={{ backgroundColor: c.bg, borderColor: c.border }}>
          {/* Header */}
          <div className="p-4 border-b" style={{ borderColor: c.border }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: c.fg, marginBottom: 12 }}>AI Design Generator</h2>
            <motion.button onClick={handleGenerate} whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-md font-medium text-sm text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(to right, ${c.gradFrom}, ${c.gradTo})` }}>
              <Wand2 className="w-4 h-4" /> Generate with AI
            </motion.button>
          </div>

          {/* Quick Start Presets */}
          <div className="px-4 py-3 border-b" style={{ borderColor: c.border }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: c.fgMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Start</label>
            <div className="flex flex-wrap gap-1 mt-2">
              {PRESETS.map(preset => (
                <button key={preset.label} onClick={() => applyPreset(preset)}
                  className="px-2 py-1 rounded text-[10px] font-medium border transition-all"
                  style={{ borderColor: c.border, color: c.fg }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = c.gradFrom; e.currentTarget.style.backgroundColor = `${c.gradFrom}06`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = c.border; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="mx-4 mt-3 flex rounded-md p-0.5" style={{ backgroundColor: c.bgInput }}>
            {(['generate', 'prompt', 'elegant'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-1.5 rounded text-xs font-medium transition-all capitalize"
                style={{ backgroundColor: activeTab === tab ? c.bg : 'transparent', color: activeTab === tab ? c.fg : c.fgMuted, boxShadow: activeTab === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none' }}>
                {tab === 'elegant' ? <span className="flex items-center justify-center gap-1"><Crown className="w-3 h-3" />Elegant</span> : tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'elegant' ? (
              /* ═══ Elegant Collection Tab ═══ */
              <div className="p-4 space-y-4">
                {/* Brand DNA Summary */}
                <div className="rounded-md border p-3" style={{ borderColor: `${c.gradFrom}30`, background: `linear-gradient(135deg, ${c.gradFrom}04, ${c.gradTo}04)` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.gradFrom}, ${c.gradTo})` }}>
                      <Gem className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: c.fg }}>Brand DNA</span>
                    <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: `${c.gradFrom}10`, color: c.gradFrom }}>{CATALOG_PRODUCTS.length} Products</span>
                  </div>
                  <div className="space-y-1.5">
                    {Object.entries(BRAND_DNA).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="capitalize" style={{ color: c.fgMuted }}>{key}</span>
                        <span className="font-medium text-right max-w-[55%]" style={{ color: c.fg }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Style Guide Toggle */}
                <div className="flex items-center justify-between py-2 px-3 rounded-md border" style={{ borderColor: c.border, backgroundColor: brandGuideEnabled ? `${c.gradFrom}06` : 'transparent' }}>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" style={{ color: brandGuideEnabled ? c.gradFrom : c.fgMuted }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: c.fg }}>Brand Style Guide</p>
                      <p style={{ fontSize: 10, color: c.fgMuted }}>Inject brand DNA into every prompt</p>
                    </div>
                  </div>
                  <button onClick={() => setBrandGuideEnabled(!brandGuideEnabled)}
                    className="w-9 h-5 rounded-full relative transition-colors"
                    style={{ backgroundColor: brandGuideEnabled ? c.gradFrom : '#cbced4' }}>
                    <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all"
                      style={{ left: brandGuideEnabled ? '18px' : '2px' }} />
                  </button>
                </div>

                {/* Catalog Presets */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: c.fgMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Collection Presets</label>
                  <p style={{ fontSize: 10, color: c.fgMuted, marginTop: 2 }}>Based on analyzed catalog — click to apply</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {ELEGANT_PRESETS.map(preset => (
                      <button key={preset.code} onClick={() => applyElegantPreset(preset)}
                        className="text-left px-2.5 py-2 rounded-md border transition-all"
                        style={{ borderColor: selectedCatalogRef === preset.code ? c.gradFrom : c.border, backgroundColor: selectedCatalogRef === preset.code ? `${c.gradFrom}06` : 'transparent' }}
                        onMouseEnter={e => { if (selectedCatalogRef !== preset.code) e.currentTarget.style.borderColor = `${c.gradFrom}60`; }}
                        onMouseLeave={e => { if (selectedCatalogRef !== preset.code) e.currentTarget.style.borderColor = c.border; }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: c.fg }}>{preset.label}</p>
                        <p style={{ fontSize: 9, color: c.fgMuted, marginTop: 1 }}>{preset.code}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catalog Reference Selector */}
                <div className="h-px" style={{ backgroundColor: c.border }} />
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: c.fgMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference Products</label>
                  <p style={{ fontSize: 10, color: c.fgMuted, marginTop: 2 }}>Select a product to guide generation style</p>
                  <div className="mt-2 space-y-1">
                    {CATALOG_PRODUCTS.map(product => {
                      const isSelected = selectedCatalogRef === product.product_code;
                      const isExpanded = elegantExpandedProduct === product.product_code;
                      return (
                        <div key={product.product_code} className="rounded-md border transition-all"
                          style={{ borderColor: isSelected ? c.gradFrom : c.border, backgroundColor: isSelected ? `${c.gradFrom}04` : 'transparent' }}>
                          <button className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                            onClick={() => {
                              setSelectedCatalogRef(isSelected ? null : product.product_code);
                              setElegantExpandedProduct(isExpanded ? null : product.product_code);
                            }}>
                            <span className="w-5 h-5 rounded border flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: isSelected ? c.gradFrom : c.border, backgroundColor: isSelected ? c.gradFrom : 'transparent' }}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span style={{ fontSize: 11, fontWeight: 600, color: c.fg }}>{product.product_code}</span>
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-medium capitalize" style={{ backgroundColor: c.bgInput, color: c.fgMuted }}>
                                  {product.attributes.piece_type}
                                </span>
                              </div>
                              <p className="truncate" style={{ fontSize: 10, color: c.fgMuted }}>{product.attributes.silhouette_form}</p>
                            </div>
                            <ChevronDown className={`w-3 h-3 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} style={{ color: c.fgMuted }} />
                          </button>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }} className="overflow-hidden">
                                <div className="px-2.5 pb-2.5 space-y-1.5">
                                  <div className="rounded border p-2 space-y-1" style={{ borderColor: c.border, backgroundColor: c.bgInput }}>
                                    {[
                                      ['Materials', product.attributes.materials.join(', ')],
                                      ['Gemstones', product.attributes.gemstones.join(', ')],
                                      ['Finish', product.attributes.finish_texture.join(', ')],
                                      ['Motifs', product.attributes.motifs.join(', ')],
                                      ['Mood', product.attributes.mood],
                                    ].map(([k, v]) => (
                                      <div key={k} className="flex justify-between text-[10px]">
                                        <span style={{ color: c.fgMuted }}>{k}</span>
                                        <span className="font-medium text-right max-w-[60%] capitalize" style={{ color: c.fg }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="flex gap-1">
                                    <button onClick={(e) => { e.stopPropagation(); applyElegantPreset(ELEGANT_PRESETS.find(p => p.code === product.product_code) || { label: product.product_code, code: product.product_code, type: product.attributes.piece_type, metal: 'white-gold', stone: ['diamond'], style: 'contemporary', complexity: 60, motifs: product.attributes.motifs.join(', ') }); }}
                                      className="flex-1 py-1.5 rounded text-[10px] font-medium text-white text-center"
                                      style={{ background: `linear-gradient(to right, ${c.gradFrom}, ${c.gradTo})` }}>
                                      Use as Reference
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); setPromptText(prev => prev + `\n\nInspired by ${product.product_code}: ${product.attributes.silhouette_form}. Motifs: ${product.attributes.motifs.join(', ')}. Mood: ${product.attributes.mood}.`); setPromptEdited(true); }}
                                      className="px-2 py-1.5 rounded text-[10px] font-medium border"
                                      style={{ borderColor: c.border, color: c.fg }}
                                      onMouseEnter={e => e.currentTarget.style.borderColor = c.gradFrom}
                                      onMouseLeave={e => e.currentTarget.style.borderColor = c.border}>
                                      Add to Prompt
                                    </button>
                                  </div>
                                  <p style={{ fontSize: 9, color: c.fgMuted }}>{product.image_count} images in catalog</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Reference Indicator */}
                {selectedCatalogRef && (
                  <>
                    <div className="h-px" style={{ backgroundColor: c.border }} />
                    <div className="flex items-center justify-between px-2.5 py-2 rounded-md" style={{ backgroundColor: `${c.gradFrom}06` }}>
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5" style={{ color: c.gradFrom }} />
                        <span style={{ fontSize: 11, fontWeight: 500, color: c.fg }}>Ref: <span className="font-semibold">{selectedCatalogRef}</span></span>
                      </div>
                      <button onClick={() => setSelectedCatalogRef(null)} style={{ fontSize: 10, fontWeight: 500, color: c.gradFrom }}>Clear</button>
                    </div>
                  </>
                )}
              </div>
            ) : activeTab === 'generate' ? (
              <div className="p-4 space-y-4">
                {/* Layer 1 — Essential fields */}
                <GroupedSelect id="type" label="Piece Type" value={selectedType} groups={PIECE_TYPES} onSelect={setSelectedType} />
                <GroupedSelect id="metal" label="Material" value={selectedMetal} groups={MATERIALS} onSelect={setSelectedMetal} />
                <GroupedMultiSelect id="stones" label="Stones" selected={selectedStones} groups={STONES} onToggle={toggleStone} />
                <GroupedSelect id="style" label="Style" value={selectedStyle} groups={STYLES} onSelect={setSelectedStyle} />

                {/* Render */}
                <SimpleSelect id="render" label="Render Output" value={renderMode} options={RENDER_OPTIONS} onSelect={v => setRenderMode(v as RenderMode)} />

                {/* Sliders */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: 14, fontWeight: 500, color: c.fg }}>Complexity</label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.gradFrom }}>{complexity}%</span>
                  </div>
                  <Slider value={[complexity]} onValueChange={([v]) => setComplexity(v)} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: 14, fontWeight: 500, color: c.fg }}>Variations</label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: c.gradFrom }}>{variations}</span>
                  </div>
                  <Slider value={[variations]} onValueChange={([v]) => setVariations(v)} min={1} max={8} step={1} />
                </div>

                {/* Layer 2 — Customize expander */}
                <div className="h-px" style={{ backgroundColor: c.border }} />
                <button onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between py-1 text-xs font-medium transition-colors"
                  style={{ color: showAdvanced ? c.gradFrom : c.fgMuted }}>
                  <span className="flex items-center gap-1.5">
                    <Settings2 className="w-3.5 h-3.5" /> Advanced Options
                  </span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }} className="overflow-hidden space-y-3">
                      <SimpleSelect id="form" label="Design Form" value={designForm} options={[{ id: '', name: 'Any' }, ...DESIGN_FORMS]} onSelect={setDesignForm} />
                      <div className="space-y-1.5">
                        <label style={{ fontSize: 13, fontWeight: 500, color: c.fg }}>Inspiration</label>
                        <div className="flex flex-wrap gap-1">
                          {INSPIRATIONS.map(insp => {
                            const active = inspiration.includes(insp.id);
                            return (
                              <button key={insp.id} onClick={() => toggleInspiration(insp.id)}
                                className="px-2 py-1 rounded text-[10px] font-medium border transition-all"
                                style={{ borderColor: active ? c.gradFrom : c.border, backgroundColor: active ? `${c.gradFrom}08` : 'transparent', color: active ? c.gradFrom : c.fg }}>
                                {insp.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <SimpleSelect id="finish" label="Surface Finish" value={finish} options={[{ id: '', name: 'Any' }, ...FINISHES]} onSelect={setFinish} />
                      <SimpleSelect id="cut" label="Stone Cut" value={stoneCut} options={[{ id: '', name: 'Any' }, ...STONE_CUTS]} onSelect={setStoneCut} />
                      <SimpleSelect id="setting" label="Stone Setting" value={stoneSetting} options={[{ id: '', name: 'Any' }, ...STONE_SETTINGS]} onSelect={setStoneSetting} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Suggestions — shown after first generation */}
                {hasGenerated && (
                  <>
                    <div className="h-px" style={{ backgroundColor: c.border }} />
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: c.fgMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Try These</label>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {AI_SUGGESTIONS.map(s => (
                          <button key={s} onClick={() => applySuggestion(s)}
                            className="px-2 py-1 rounded text-[10px] font-medium border transition-all"
                            style={{ borderColor: `${c.gradFrom}30`, color: c.gradFrom, backgroundColor: `${c.gradFrom}04` }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = `${c.gradFrom}10`}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = `${c.gradFrom}04`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Prompt tab */
              <div className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label style={{ fontSize: 14, fontWeight: 500, color: c.fg }}>Full Prompt</label>
                    <div className="flex items-center gap-2">
                      {promptEdited && <button onClick={handleResetPrompt} style={{ fontSize: 10, fontWeight: 500, color: c.gradFrom }}>Reset</button>}
                      <button onClick={copyPromptToClipboard} className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 500, color: c.fgMuted }}>
                        {copied ? <><Check className="w-2.5 h-2.5" /> Copied</> : <><Copy className="w-2.5 h-2.5" /> Copy</>}
                      </button>
                    </div>
                  </div>
                  <textarea value={promptText} onChange={e => handlePromptChange(e.target.value)}
                    className="w-full min-h-[280px] px-3 py-2 text-xs leading-relaxed rounded-md border resize-none focus:outline-none focus:ring-2 font-mono"
                    style={{ backgroundColor: c.bgInput, borderColor: c.border, color: c.fg, '--tw-ring-color': c.ring } as React.CSSProperties} />
                  {promptEdited && <p style={{ fontSize: 10, color: c.gradFrom }}>Manually edited — config changes won't overwrite</p>}
                </div>
                <div className="h-px" style={{ backgroundColor: c.border }} />
                <div className="space-y-1.5">
                  <label style={{ fontSize: 14, fontWeight: 500, color: c.fg }}>Current Config</label>
                  <div className="rounded-md border p-3 space-y-1.5 text-xs" style={{ backgroundColor: c.bgInput, borderColor: c.border }}>
                    {[
                      ['Type', selectedType], ['Metal', selectedMetal],
                      ['Stones', selectedStones.length > 0 ? selectedStones.join(', ') : 'None'],
                      ['Style', selectedStyle], ['Render', renderMode],
                      ['Complexity', `${complexity}%`], ['Variations', String(variations)],
                      ...(designForm ? [['Form', designForm]] : []),
                      ...(finish ? [['Finish', finish]] : []),
                      ...(stoneCut ? [['Cut', stoneCut]] : []),
                      ...(stoneSetting ? [['Setting', stoneSetting]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span style={{ color: c.fgMuted }}>{k}</span>
                        <span className="font-medium capitalize" style={{ color: c.fg }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ Canvas ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8f9fa, #f0f1f3)' }}>
          <div className="flex-1 overflow-hidden">
            <PipelineView isRunning={pipelineRunCount > 0} runKey={pipelineRunCount}
              designConfigs={designConfigRef.current}
              promptText={promptText}
              promptMode={promptEdited ? 'override' : 'synced'}
              layoutMode="graph"
              onComplete={results => console.log('Designs generated:', results)} />
          </div>

          {/* Agent Prompt Panel — shows after generation so user can see & tweak */}
          {promptSource !== 'idle' && promptText && (
            <div className="border-t px-5 py-3 space-y-2 flex-shrink-0" style={{ borderColor: c.border, backgroundColor: '#fff' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" style={{ color: c.gradFrom }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.fg }}>Agent Prompt</span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
                    backgroundColor: promptSource === 'agent' ? '#dcfce7' : '#fef3c7',
                    color: promptSource === 'agent' ? '#166534' : '#92400e',
                  }}>
                    {promptSource === 'agent' ? 'AI-crafted' : 'Fallback'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {promptEdited && <button onClick={handleResetPrompt} style={{ fontSize: 10, fontWeight: 500, color: c.gradFrom }}>Reset</button>}
                  <button onClick={copyPromptToClipboard} className="flex items-center gap-1" style={{ fontSize: 10, fontWeight: 500, color: c.fgMuted }}>
                    {copied ? <><Check className="w-2.5 h-2.5" /> Copied</> : <><Copy className="w-2.5 h-2.5" /> Copy</>}
                  </button>
                </div>
              </div>
              <textarea value={promptText} onChange={e => handlePromptChange(e.target.value)}
                className="w-full min-h-[48px] max-h-[120px] px-3 py-2 text-xs leading-relaxed rounded-md border resize-none focus:outline-none focus:ring-2 font-mono"
                style={{ backgroundColor: c.bgInput, borderColor: promptEdited ? c.gradFrom + '40' : c.border, color: c.fg, '--tw-ring-color': c.ring } as React.CSSProperties} />
              {promptEdited && <p style={{ fontSize: 10, color: c.gradFrom }}>Edited — next generation will use your version</p>}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Status Bar ═══ */}
      <div className="px-4 py-1.5 flex items-center justify-between flex-shrink-0 border-t" style={{ backgroundColor: `${c.bg}cc`, borderColor: c.border, backdropFilter: 'blur(8px)' }}>
        <div className="flex gap-5" style={{ fontSize: 11, color: c.fgMuted }}>
          <span>Type: {selectedType}</span>
          <span>Size: 1024 × 1024</span>
          {brandGuideEnabled && <span style={{ color: c.gradFrom }}>Brand Guide ON</span>}
          {selectedCatalogRef && <span style={{ color: c.gradFrom }}>Ref: {selectedCatalogRef}</span>}
        </div>
        <div className="flex items-center gap-1.5" style={{ fontSize: 11, color: c.fgMuted }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }} />
          All changes saved
        </div>
      </div>
    </div>
  );
}
