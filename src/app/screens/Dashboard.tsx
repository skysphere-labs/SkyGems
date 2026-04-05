import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Gem, ChevronDown, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getAllDesigns, DesignMetadata } from '../services/storageService';

const jewelryCategories = [
  { id: 'ring', name: 'Ring', emoji: '💍' },
  { id: 'necklace', name: 'Necklace', emoji: '📿' },
  { id: 'earrings', name: 'Earrings', emoji: '✨' },
  { id: 'bracelet', name: 'Bracelet', emoji: '⌚' },
  { id: 'pendant', name: 'Pendant', emoji: '🔆' },
  { id: 'brooch', name: 'Brooch', emoji: '🪻' },
  { id: 'anklet', name: 'Anklet', emoji: '💫' },
  { id: 'tiara', name: 'Tiara', emoji: '👑' },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [allDesigns, setAllDesigns] = useState<DesignMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setAllDesigns(getAllDesigns());
  }, []);

  // Filter designs
  const filteredDesigns = allDesigns.filter((d) => {
    const matchesSearch = searchQuery === '' ||
      d.features.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.features.metal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.features.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || d.features.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleCategoryClick = (id: string) => {
    navigate(`/app/create?type=${id}`);
  };

  return (
    <div className="h-full overflow-auto">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        {/* Subtle gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 50%, rgba(212,175,55,0.03) 100%)',
          }}
        />

        <div className="relative max-w-3xl mx-auto pt-16 pb-10 px-8 text-center">
          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-display mb-8"
            style={{ color: 'var(--text-primary)' }}
          >
            What will you <span style={{ color: 'var(--accent-gold)' }}>create</span> today?
          </motion.h1>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative max-w-xl mx-auto mb-10"
          >
            <div
              className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-all"
              style={{
                backgroundColor: 'var(--bg-tertiary)',
                borderColor: 'rgba(255, 255, 255, 0.06)',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-gold)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.06)';
              }}
            >
              <Search className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search designs, metals, styles..."
                className="flex-1 bg-transparent text-sm focus:outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </motion.div>

          {/* Jewelry type icons */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            {jewelryCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.04, duration: 0.25 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all border"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-gold)';
                    e.currentTarget.style.backgroundColor = 'var(--accent-gold-glow)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  }}
                >
                  {cat.emoji}
                </div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  {cat.name}
                </span>
              </motion.button>
            ))}

            {/* Create custom */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + jewelryCategories.length * 0.04, duration: 0.25 }}
            >
              <Link
                to="/app/create"
                className="flex flex-col items-center gap-1.5 group"
              >
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-xl flex items-center justify-center border transition-all"
                  style={{
                    backgroundColor: 'var(--accent-gold-glow)',
                    borderColor: 'rgba(212, 175, 55, 0.3)',
                    color: 'var(--accent-gold)',
                  }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <span className="text-[10px] font-medium" style={{ color: 'var(--accent-gold)' }}>
                  Create
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Recents section */}
      <div className="max-w-6xl mx-auto px-8 pb-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {/* Section header with filter */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recents
            </h2>
            <div className="flex items-center gap-2">
              {/* Type filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: typeFilter !== 'all' ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.06)',
                    color: typeFilter !== 'all' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  }}
                >
                  {typeFilter === 'all' ? 'Jewelry Type' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <div
                      className="absolute right-0 top-full mt-1 z-20 rounded-md border py-1 min-w-[140px]"
                      style={{
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <button
                        onClick={() => { setTypeFilter('all'); setFilterOpen(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs transition-all"
                        style={{
                          color: typeFilter === 'all' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                          backgroundColor: typeFilter === 'all' ? 'var(--accent-gold-glow)' : 'transparent',
                        }}
                      >
                        All Types
                      </button>
                      {['ring', 'necklace', 'earrings', 'bracelet', 'pendant'].map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTypeFilter(t); setFilterOpen(false); }}
                          className="w-full text-left px-3 py-1.5 text-xs capitalize transition-all"
                          style={{
                            color: typeFilter === t ? 'var(--accent-gold)' : 'var(--text-secondary)',
                            backgroundColor: typeFilter === t ? 'var(--accent-gold-glow)' : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (typeFilter !== t) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                          }}
                          onMouseLeave={(e) => {
                            if (typeFilter !== t) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Link
                to="/app/gallery"
                className="text-xs font-medium"
                style={{ color: 'var(--accent-gold)' }}
              >
                View All →
              </Link>
            </div>
          </div>

          {/* Design grid */}
          {filteredDesigns.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: 'var(--accent-gold-glow)' }}
              >
                <Gem className="w-8 h-8" style={{ color: 'var(--accent-gold)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {searchQuery || typeFilter !== 'all' ? 'No matching designs' : 'No designs yet'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {searchQuery || typeFilter !== 'all'
                  ? 'Try a different search or filter'
                  : 'Click a jewelry type above or Create to get started'}
              </p>
              <Link
                to="/app/create"
                className="mt-5 px-5 py-2.5 rounded-md text-xs font-medium flex items-center gap-2"
                style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Create Your First Design
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredDesigns.map((design, idx) => (
                <motion.div
                  key={design.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(idx, 5), duration: 0.25 }}
                >
                  <Link
                    to={`/app/preview/${design.id}`}
                    className="group rounded-lg overflow-hidden border transition-all block"
                    style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'}
                  >
                    <div className="overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                      {design.imageUrl ? (
                        <ImageWithFallback
                          src={design.imageUrl}
                          alt={design.features.type}
                          className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div
                          className="w-full aspect-square flex items-center justify-center"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Gem className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                      <h3
                        className="text-xs font-medium capitalize truncate"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {design.features.type} — {design.features.style}
                      </h3>
                      <div
                        className="flex items-center justify-between text-[10px] mt-1"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <span className="capitalize">{design.features.metal}</span>
                        <span>{new Date(design.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
