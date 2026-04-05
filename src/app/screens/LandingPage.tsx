import { Link } from 'react-router';
import { Sparkles, Play, Gem, Zap, Cpu, Download, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Navigation — sticky with blur */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
        style={{
          backgroundColor: 'rgba(10, 10, 10, 0.8)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Gem className="w-5 h-5" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <div>
              <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>SkyGems</h1>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <a href="#features" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >Features</a>
            <a href="#how-it-works" className="text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >How It Works</a>
            <Link
              to="/app"
              className="px-5 py-2 rounded-md text-sm font-medium transition-all"
              style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            {/* Left content */}
            <div className="space-y-8">
              <div className="eyebrow">AI-Powered Jewelry Design Platform</div>

              <h1 className="text-display" style={{ color: 'var(--text-primary)' }}>
                Design Jewelry
                <br />
                <span style={{ color: 'var(--accent-gold)' }}>with AI</span>
              </h1>

              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Generate professional jewelry designs and CAD files instantly.
                <br />
                From concept to production-ready 3D models in minutes.
              </p>

              <div className="flex items-center gap-4">
                <Link
                  to="/app"
                  className="px-6 py-3 rounded-md font-medium transition-all flex items-center gap-2 active:scale-[0.98]"
                  style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  Start Designing
                  <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                </Link>
                <button
                  className="px-6 py-3 rounded-md font-medium transition-all flex items-center gap-2 border"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <Play className="w-4 h-4" />
                  View Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <div className="text-2xl font-semibold" style={{ color: 'var(--accent-gold)' }}>10K+</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Designs Generated</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold" style={{ color: 'var(--accent-gold)' }}>500+</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>CAD Exports</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold" style={{ color: 'var(--accent-gold)' }}>98%</div>
                  <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Accuracy Rate</div>
                </div>
              </div>
            </div>

            {/* Right content - Product Preview */}
            <div className="relative">
              <div
                className="relative rounded-lg overflow-hidden border"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <ImageWithFallback
                  src="https://via.placeholder.com/1080x720/1A1A1A/D4AF37?text=Jewelry+Preview"
                  alt="Jewelry Design Preview"
                  className="w-full h-[480px] object-cover"
                />
                {/* Floating card with gradient overlay */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-6"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0) 100%)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-md flex items-center justify-center"
                        style={{ backgroundColor: 'var(--accent-gold)' }}
                      >
                        <Gem className="w-5 h-5" style={{ color: 'var(--text-inverse)' }} />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>Diamond Ring Design</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Generated in 3.2s</div>
                      </div>
                    </div>
                    <div
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{ backgroundColor: 'rgba(76, 175, 80, 0.15)', color: 'var(--status-success)' }}
                    >
                      Ready for Export
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Metal</div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>18K Gold</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Stones</div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>12 Diamonds</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Weight</div>
                      <div className="font-medium" style={{ color: 'var(--text-primary)' }}>4.2g</div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative gold glow */}
              <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}></div>
              <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(212, 175, 55, 0.06)' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="eyebrow mb-4">Features</div>
            <h2 className="text-display mb-4" style={{ color: 'var(--text-primary)' }}>
              Everything You Need to Create
              <br />
              <span style={{ color: 'var(--accent-gold)' }}>Professional Jewelry Designs</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              From AI-powered generation to production-ready CAD files
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'AI Design Generation', desc: 'Generate unlimited design variations with our advanced AI engine. Select jewelry type, metal, stones, and style preferences.' },
              { icon: Zap, title: 'Real-time 3D Preview', desc: 'Visualize your designs in stunning 3D. Rotate, zoom, and inspect every detail before exporting.' },
              { icon: Download, title: 'CAD File Export', desc: 'Export production-ready files in multiple formats: STL, STEP, SVG, DXF, and Rhino for immediate manufacturing.' },
              { icon: Cpu, title: 'AI Co-Pilot Editor', desc: 'Modify designs with natural language commands. "Make it more vintage" or "Add more diamonds" \u2014 it\'s that simple.' },
              { icon: Gem, title: 'Design Library', desc: 'Save and organize all your designs. Access your entire portfolio anytime with smart categorization.' },
              { icon: Sparkles, title: 'Manufacturing Ready', desc: 'All designs are validated for manufacturing feasibility with detailed specifications and material estimates.' },
            ].map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="rounded-lg p-6 border transition-all"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'var(--accent-gold-glow)', color: 'var(--accent-gold)' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-lg p-16 border relative overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            {/* Subtle gold glow behind */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(212, 175, 55, 0.06)' }}></div>
            <div className="relative z-10">
              <div className="eyebrow mb-4">Get Started</div>
              <h2 className="text-display mb-4" style={{ color: 'var(--text-primary)' }}>
                Ready to Create Your First
                <br />
                <span style={{ color: 'var(--accent-gold)' }}>AI-Generated Jewelry Design?</span>
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                Join hundreds of designers and manufacturers using SkyGems
              </p>
              <Link
                to="/app"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-md font-medium transition-all active:scale-[0.98]"
                style={{ backgroundColor: 'var(--accent-gold)', color: 'var(--text-inverse)' }}
              >
                <Sparkles className="w-5 h-5" />
                Start Designing Now
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Gem className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>SkyGems</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            &copy; 2026 SkyGems. Professional AI-Powered Jewelry Design Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
