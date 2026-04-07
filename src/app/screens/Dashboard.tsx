import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, Gem, ChevronDown, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getAllDesigns, type DesignMetadata } from '../services/storageService';
import { listBackendDesigns } from '../services/skygemsApi';

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
    listBackendDesigns()
      .then(setAllDesigns)
      .catch(() => setAllDesigns(getAllDesigns()));
  }, []);

  const filteredDesigns = allDesigns.filter((d) => {
    const matchesSearch = searchQuery === '' ||
      d.features.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.features.metal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.features.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = typeFilter === 'all' || d.features.type.toLowerCase() === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full overflow-auto bg-background">
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, transparent 50%, rgba(37,99,235,0.03) 100%)' }} />
        <div className="relative max-w-3xl mx-auto pt-16 pb-10 px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-4xl font-semibold mb-8 text-foreground"
          >
            What will you <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">create</span> today?
          </motion.h1>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative max-w-xl mx-auto mb-10"
          >
            <div className="flex items-center gap-3 rounded-lg border border-border bg-input-background px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500 transition-all">
              <Search className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search designs, metals, styles..."
                className="flex-1 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
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
                onClick={() => navigate(`/app/create?type=${cat.id}`)}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-border bg-background hover:border-purple-500 hover:bg-purple-50 transition-all">
                  {cat.emoji}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">{cat.name}</span>
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + jewelryCategories.length * 0.04, duration: 0.25 }}
            >
              <Link to="/app/create" className="flex flex-col items-center gap-1.5">
                <motion.div
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-14 h-14 rounded-xl flex items-center justify-center border border-purple-300 text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
                <span className="text-[10px] font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Create</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Recents section */}
      <div className="max-w-6xl mx-auto px-8 pb-12">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 0.4 }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-foreground">Recents</h2>
            <div className="flex items-center gap-2">
              {/* Filter dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                    typeFilter !== 'all' ? 'border-purple-500 text-purple-600 bg-purple-50' : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {typeFilter === 'all' ? 'Jewelry Type' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {filterOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 rounded-md border border-border bg-background py-1 min-w-[140px] shadow-lg">
                      {['all', 'ring', 'necklace', 'earrings', 'bracelet', 'pendant'].map((t) => (
                        <button
                          key={t}
                          onClick={() => { setTypeFilter(t); setFilterOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs capitalize transition-all ${
                            typeFilter === t ? 'bg-purple-50 text-purple-600' : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          {t === 'all' ? 'All Types' : t}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Link to="/app/gallery" className="text-xs font-medium text-purple-600 hover:text-purple-700">View All →</Link>
            </div>
          </div>

          {/* Design grid */}
          {filteredDesigns.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))' }}>
                <Gem className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {searchQuery || typeFilter !== 'all' ? 'No matching designs' : 'No designs yet'}
              </p>
              <p className="text-xs mt-1 text-muted-foreground">
                {searchQuery || typeFilter !== 'all' ? 'Try a different search or filter' : 'Click a jewelry type above or Create to get started'}
              </p>
              <Link
                to="/app/create"
                className="mt-5 px-5 py-2.5 rounded-md text-xs font-medium text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}
              >
                <Sparkles className="w-3.5 h-3.5" /> Create Your First Design
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
                    className="group rounded-lg overflow-hidden border border-border hover:border-purple-300 hover:shadow-md transition-all block bg-card"
                  >
                    <div className="overflow-hidden bg-input-background">
                      {design.imageUrl ? (
                        <ImageWithFallback
                          src={design.imageUrl}
                          alt={design.features.type}
                          className="w-full h-auto object-contain group-hover:scale-[1.02] transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center text-muted-foreground">
                          <Gem className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-xs font-medium capitalize truncate text-foreground">
                        {design.features.type} — {design.features.style}
                      </h3>
                      <div className="flex items-center justify-between text-[10px] mt-1 text-muted-foreground">
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
