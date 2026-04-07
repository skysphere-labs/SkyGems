import React from 'react';
import { useState, useEffect } from 'react';
import { Heart, Download, Trash2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  getAllDesigns,
  getLikedDesigns,
  likeDesign,
  unlikeDesign,
  deleteDesign,
  addDesignTags,
  DesignMetadata,
  getStorageStats,
} from '../services/storageService';
import { DESIGNS_UPDATED_EVENT, listBackendDesigns } from '../services/skygemsApi';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface GalleryTab {
  id: 'all' | 'liked';
  label: string;
}

export function DesignGallery() {
  const [activeTab, setActiveTab] = useState<'all' | 'liked'>('all');
  const [designs, setDesigns] = useState<DesignMetadata[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<DesignMetadata | null>(null);
  const [stats, setStats] = useState({ total: 0, liked: 0, generated: 0, byType: {}, byMetal: {}, byStyle: {} });
  const [newTag, setNewTag] = useState('');

  const tabs: GalleryTab[] = [
    { id: 'all', label: 'All Designs' },
    { id: 'liked', label: 'Liked Designs' },
  ];

  const loadStats = () => {
    setStats(getStorageStats());
  };

  useEffect(() => {
    loadDesigns();
    loadStats();

    const handleRefresh = () => {
      loadDesigns();
      loadStats();
    };

    window.addEventListener(DESIGNS_UPDATED_EVENT, handleRefresh);
    window.addEventListener('focus', handleRefresh);

    return () => {
      window.removeEventListener(DESIGNS_UPDATED_EVENT, handleRefresh);
      window.removeEventListener('focus', handleRefresh);
    };
  }, [activeTab]);

  const loadDesigns = () => {
    if (activeTab === 'liked') {
      const loaded = getLikedDesigns();
      setDesigns(loaded);
      loadStats();
      if (loaded.length === 0) setSelectedDesign(null);
      return;
    }
    listBackendDesigns()
      .then((loaded) => {
        setDesigns(loaded);
        loadStats();
        if (loaded.length === 0) setSelectedDesign(null);
      })
      .catch(() => {
        const loaded = getAllDesigns();
        setDesigns(loaded);
        loadStats();
        if (loaded.length === 0) setSelectedDesign(null);
      });
  };

  const handleLikeToggle = (designId: string, currentLiked: boolean) => {
    if (currentLiked) {
      unlikeDesign(designId);
    } else {
      likeDesign(designId);
    }
    loadDesigns();
    loadStats();
    if (selectedDesign?.id === designId) {
      setSelectedDesign({ ...selectedDesign, liked: !currentLiked });
    }
  };

  const handleDelete = (designId: string) => {
    if (window.confirm('Are you sure you want to delete this design?')) {
      deleteDesign(designId);
      loadDesigns();
      loadStats();
      setSelectedDesign(null);
    }
  };

  const handleAddTag = (designId: string) => {
    if (newTag.trim()) {
      addDesignTags(designId, [newTag.trim()]);
      setNewTag('');
      loadDesigns();
      if (selectedDesign?.id === designId) {
        const updated = { ...selectedDesign };
        updated.tags = [...(updated.tags || []), newTag.trim()];
        setSelectedDesign(updated);
      }
    }
  };

  const handleDownload = (design: DesignMetadata) => {
    if (design.imageUrl) {
      const link = document.createElement('a');
      link.href = design.imageUrl;
      link.download = `design-${design.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Design Gallery</h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
          Manage your jewelry designs &middot; {stats.total} total &middot; {stats.liked} liked
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Gallery */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="border-b flex" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 px-6 border-b-2 transition-all font-medium text-sm flex items-center justify-center gap-2"
                style={{
                  borderColor: activeTab === tab.id ? 'var(--accent-gold)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--accent-gold)' : 'var(--text-muted)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {designs.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl mb-4">
                    {activeTab === 'liked' ? '❤️' : '🎨'}
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {activeTab === 'liked'
                      ? 'No liked designs yet. Like your favorites to see them here!'
                      : 'No designs yet. Generate some jewelry designs to get started!'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <AnimatePresence>
                  {designs.map((design) => (
                    <motion.div
                      key={design.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25 }}
                      onClick={() => setSelectedDesign(design)}
                      className="relative rounded-lg overflow-hidden cursor-pointer group transition-all border"
                      style={{
                        borderColor: selectedDesign?.id === design.id ? 'var(--accent-gold)' : 'rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      {/* Image */}
                      {design.imageUrl && (
                        <ImageWithFallback
                          src={design.imageUrl}
                          alt="Design"
                          className="w-full aspect-square object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          style={{ backgroundColor: 'var(--bg-tertiary)' }}
                        />
                      )}

                      {/* Hover Overlay — dark gradient from bottom */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end justify-center pb-4">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLikeToggle(design.id, design.liked); }}
                            className="p-2.5 rounded-md transition-all"
                            style={{ backgroundColor: 'var(--bg-elevated)', color: design.liked ? 'var(--status-error)' : 'var(--text-primary)' }}
                          >
                            <Heart className={`w-4 h-4 ${design.liked ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(design); }}
                            className="p-2.5 rounded-md transition-all"
                            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(design.id); }}
                            className="p-2.5 rounded-md transition-all"
                            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--status-error)' }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Like Badge */}
                      {design.liked && (
                        <div className="absolute top-2 right-2 p-1.5 rounded-md" style={{ backgroundColor: 'rgba(239, 83, 80, 0.9)' }}>
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      )}

                      {/* Type Badge */}
                      <div className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(10, 10, 10, 0.8)', color: 'var(--text-primary)' }}>
                        {design.features.type}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Details Panel */}
        <AnimatePresence>
          {selectedDesign && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
              className="w-80 border-l overflow-y-auto"
              style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'rgba(255, 255, 255, 0.06)' }}
            >
              <div className="p-5 space-y-5">
                {/* Header */}
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {selectedDesign.features.type}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {new Date(selectedDesign.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Features */}
                <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Features</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      ['Metal', selectedDesign.features.metal],
                      ['Style', selectedDesign.features.style],
                      ['Complexity', `${selectedDesign.features.complexity}%`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>{label}:</span>
                        <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{value}</span>
                      </div>
                    ))}
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Gemstones:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedDesign.features.gemstones.map((gem) => (
                          <span
                            key={gem}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--accent-gold-glow)', color: 'var(--accent-gold)' }}
                          >
                            {gem}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variations */}
                <div className="rounded-md p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>Design Variations</h3>
                  <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <p>• {selectedDesign.features.variation.bandStyle}</p>
                    <p>• {selectedDesign.features.variation.settingType}</p>
                    <p>• {selectedDesign.features.variation.stonePosition}</p>
                    <p>• {selectedDesign.features.variation.profile}</p>
                    <p>• {selectedDesign.features.variation.motif}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDesign.tags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded border"
                        style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handleAddTag(selectedDesign.id); }}
                      placeholder="Add tag..."
                      className="flex-1 px-3 py-2 rounded-md text-sm border"
                      style={{
                        backgroundColor: 'var(--bg-tertiary)',
                        borderColor: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                      }}
                    />
                    <button
                      onClick={() => handleAddTag(selectedDesign.id)}
                      className="px-3 py-2 rounded-md text-sm"
                      style={{ backgroundColor: 'var(--accent-gold-glow)', color: 'var(--accent-gold)' }}
                    >
                      <Tag className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <button
                    onClick={() => handleLikeToggle(selectedDesign.id, selectedDesign.liked)}
                    className="w-full py-2.5 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: selectedDesign.liked ? 'rgba(239, 83, 80, 0.15)' : 'var(--accent-gold-glow)',
                      color: selectedDesign.liked ? 'var(--status-error)' : 'var(--accent-gold)',
                    }}
                  >
                    <Heart className="w-4 h-4" />
                    {selectedDesign.liked ? 'Unlike' : 'Like'}
                  </button>
                  <button
                    onClick={() => handleDownload(selectedDesign)}
                    className="w-full py-2.5 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'rgba(255,255,255,0.06)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(selectedDesign.id)}
                    className="w-full py-2.5 rounded-md font-medium text-sm transition-all flex items-center justify-center gap-2 border"
                    style={{
                      backgroundColor: 'var(--bg-tertiary)',
                      borderColor: 'rgba(255,255,255,0.06)',
                      color: 'var(--status-error)',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
