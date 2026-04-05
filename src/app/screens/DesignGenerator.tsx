import { useState, useEffect, useMemo } from 'react';
import { Sparkles, Copy, Check, Pencil, Image } from 'lucide-react';
import { motion } from 'motion/react';
import { generateJewelryPrompt } from '../utils/promptGenerator';

const jewelryTypes = [
  { id: 'ring', name: 'Ring', icon: '💍' },
  { id: 'necklace', name: 'Necklace', icon: '📿' },
  { id: 'earrings', name: 'Earrings', icon: '👂' },
  { id: 'bracelet', name: 'Bracelet', icon: '⌚' },
  { id: 'pendant', name: 'Pendant', icon: '🔆' },
];

const metals = [
  { id: 'gold', name: 'Gold', color: 'from-yellow-400 to-yellow-600' },
  { id: 'silver', name: 'Silver', color: 'from-gray-300 to-gray-500' },
  { id: 'platinum', name: 'Platinum', color: 'from-slate-200 to-slate-400' },
  { id: 'rose-gold', name: 'Rose Gold', color: 'from-rose-300 to-rose-500' },
];

const gemstones = [
  { id: 'diamond', name: 'Diamond', icon: '💎' },
  { id: 'ruby', name: 'Ruby', icon: '🔴' },
  { id: 'emerald', name: 'Emerald', icon: '🟢' },
  { id: 'sapphire', name: 'Sapphire', icon: '🔵' },
  { id: 'pearl', name: 'Pearl', icon: '⚪' },
];

const styles = [
  { id: 'temple', name: 'Temple' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'floral', name: 'Floral' },
  { id: 'geometric', name: 'Geometric' },
  { id: 'contemporary', name: 'Contemporary' },
  { id: 'minimalist', name: 'Minimalist' },
];

export function DesignGenerator() {
  const [selectedType, setSelectedType] = useState('ring');
  const [selectedMetal, setSelectedMetal] = useState('gold');
  const [selectedGemstones, setSelectedGemstones] = useState<string[]>(['diamond']);
  const [selectedStyle, setSelectedStyle] = useState('contemporary');
  const [complexity, setComplexity] = useState(50);
  const [variations, setVariations] = useState(4);
  const [copied, setCopied] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [promptEdited, setPromptEdited] = useState(false);

  const toggleGemstone = (id: string) => {
    if (selectedGemstones.includes(id)) {
      setSelectedGemstones(selectedGemstones.filter((g) => g !== id));
    } else {
      setSelectedGemstones([...selectedGemstones, id]);
    }
  };

  const generatedPrompt = useMemo(() => {
    return generateJewelryPrompt({
      type: selectedType,
      metal: selectedMetal,
      gemstones: selectedGemstones,
      style: selectedStyle,
      complexity,
      variations,
    });
  }, [selectedType, selectedMetal, selectedGemstones, selectedStyle, complexity, variations]);

  useEffect(() => {
    if (!promptEdited) {
      setPromptText(generatedPrompt);
    }
  }, [generatedPrompt, promptEdited]);

  const handlePromptChange = (value: string) => {
    setPromptText(value);
    setPromptEdited(true);
  };

  const handleResetPrompt = () => {
    setPromptText(generatedPrompt);
    setPromptEdited(false);
  };

  const handleGenerate = () => {
    const config = {
      type: selectedType,
      metal: selectedMetal,
      gemstones: selectedGemstones,
      style: selectedStyle,
      complexity,
      variations,
      prompt: promptText,
    };
    // TODO: Wire up image generation service here
    console.log('Generate designs with config:', config);
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedBorder = 'var(--accent-gold)';
  const defaultBorder = 'rgba(255, 255, 255, 0.06)';
  const selectedBg = 'var(--accent-gold-glow)';

  return (
    <div className="h-full flex overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Left Configuration Panel */}
      <div
        className="w-[300px] flex-shrink-0 border-r flex flex-col min-h-0"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        {/* Fixed header */}
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Design Generator</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Configure design parameters</p>
        </div>

        {/* Scrollable config area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
          <div className="space-y-3">
            {/* Jewelry Type */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Type</label>
              <div className="grid grid-cols-5 gap-1">
                {jewelryTypes.map((type) => (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    whileTap={{ scale: 0.98 }}
                    className="p-1.5 rounded-md border transition-all flex flex-col items-center"
                    style={{
                      borderColor: selectedType === type.id ? selectedBorder : defaultBorder,
                      backgroundColor: selectedType === type.id ? selectedBg : 'var(--bg-tertiary)',
                    }}
                  >
                    <div className="text-base">{type.icon}</div>
                    <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{type.name}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Metal Selector */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Metal</label>
              <div className="grid grid-cols-2 gap-1">
                {metals.map((metal) => (
                  <motion.button
                    key={metal.id}
                    onClick={() => setSelectedMetal(metal.id)}
                    whileTap={{ scale: 0.98 }}
                    className="p-2 rounded-md border flex items-center gap-2 transition-all"
                    style={{
                      borderColor: selectedMetal === metal.id ? selectedBorder : defaultBorder,
                      backgroundColor: selectedMetal === metal.id ? selectedBg : 'var(--bg-tertiary)',
                    }}
                  >
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${metal.color} flex-shrink-0`}></div>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{metal.name}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Gemstone Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Gemstones
                </label>
                <button
                  onClick={() => setSelectedGemstones(selectedGemstones.length > 0 ? [] : ['diamond'])}
                  className="text-[10px] font-medium transition-colors"
                  style={{ color: selectedGemstones.length === 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}
                >
                  {selectedGemstones.length === 0 ? 'Add gems' : 'None'}
                </button>
              </div>
              {selectedGemstones.length === 0 ? (
                <div
                  className="rounded-md border p-2.5 flex items-center gap-2 cursor-pointer transition-all"
                  style={{
                    borderColor: selectedBorder,
                    backgroundColor: selectedBg,
                  }}
                  onClick={() => setSelectedGemstones(['diamond'])}
                >
                  <span className="text-sm">🚫</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--accent-gold)' }}>No gemstones — plain metal design</span>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-1">
                  {gemstones.map((gem) => (
                    <button
                      key={gem.id}
                      onClick={() => toggleGemstone(gem.id)}
                      className="p-1.5 rounded-md border transition-all flex flex-col items-center"
                      style={{
                        borderColor: selectedGemstones.includes(gem.id) ? selectedBorder : defaultBorder,
                        backgroundColor: selectedGemstones.includes(gem.id) ? selectedBg : 'var(--bg-tertiary)',
                      }}
                    >
                      <div className="text-sm">{gem.icon}</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{gem.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Design Style */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Style</label>
              <div className="grid grid-cols-3 gap-1">
                {styles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className="py-1.5 px-2 rounded-md border transition-all"
                    style={{
                      borderColor: selectedStyle === style.id ? selectedBorder : defaultBorder,
                      backgroundColor: selectedStyle === style.id ? selectedBg : 'var(--bg-tertiary)',
                    }}
                  >
                    <div className="text-[11px] font-medium" style={{ color: 'var(--text-primary)' }}>{style.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Complexity Slider */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Complexity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={complexity}
                onChange={(e) => setComplexity(Number(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-hover)', accentColor: 'var(--accent-gold)' }}
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>Simple</span>
                <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>{complexity}%</span>
                <span>Complex</span>
              </div>
            </div>

            {/* Variations Count */}
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Variations
              </label>
              <input
                type="range"
                min="1"
                max="8"
                value={variations}
                onChange={(e) => setVariations(Number(e.target.value))}
                className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                style={{ backgroundColor: 'var(--bg-hover)', accentColor: 'var(--accent-gold)' }}
              />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>1</span>
                <span className="font-semibold" style={{ color: 'var(--accent-gold)' }}>{variations} designs</span>
                <span>8</span>
              </div>
            </div>

            {/* Prompt Preview & Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Prompt
                </label>
                {promptEdited && (
                  <button
                    onClick={handleResetPrompt}
                    className="text-[10px] font-medium transition-colors"
                    style={{ color: 'var(--accent-gold)' }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="relative">
                <textarea
                  value={promptText}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  className="w-full rounded-md border text-xs leading-relaxed resize-none p-2.5 pr-8 focus:outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: promptEdited ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-primary)',
                    minHeight: '80px',
                    maxHeight: '140px',
                  }}
                  rows={4}
                  onFocus={(e) => {
                    if (!promptEdited) e.currentTarget.style.borderColor = 'var(--accent-gold)';
                  }}
                  onBlur={(e) => {
                    if (!promptEdited) e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                />
                <Pencil
                  className="absolute top-2.5 right-2.5 w-3 h-3 pointer-events-none"
                  style={{ color: promptEdited ? 'var(--accent-gold)' : 'var(--text-muted)' }}
                />
              </div>
              {promptEdited && (
                <p className="text-[10px] mt-1" style={{ color: 'var(--accent-gold)' }}>
                  Manually edited — config changes won't overwrite
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Fixed bottom actions */}
        <div className="px-4 py-3 space-y-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <button
            onClick={copyPromptToClipboard}
            className="w-full py-2 rounded-md font-medium text-xs transition-all flex items-center justify-center gap-1.5 border"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-primary)',
            }}
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" /> Copied!</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copy Prompt</>
            )}
          </button>

          <motion.button
            onClick={handleGenerate}
            whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-md font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Designs
          </motion.button>
        </div>
      </div>

      {/* Right — Results Area (ready for integration) */}
      <div className="flex-1 overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="text-center space-y-4">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255, 255, 255, 0.06)' }}
          >
            <Image className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Ready to Generate</h2>
            <p className="text-sm mt-1 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Configure your design parameters and click Generate to create AI-powered jewelry concepts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
