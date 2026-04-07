import React from 'react';
import { Link } from 'react-router';
import { Sparkles, Play, Gem, Zap, Cpu, Download, ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              GemStudio
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <Link to="/login" className="px-5 py-2 rounded-md text-sm font-medium text-white" style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full border border-purple-200">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">AI-Powered Jewelry Design Platform</span>
              </div>
              <h1 className="text-5xl font-semibold text-foreground leading-tight">
                Design Jewelry<br />
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">with AI</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Generate professional jewelry designs and CAD files instantly.<br />
                From concept to production-ready 3D models in minutes.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/login" className="px-6 py-3 rounded-md font-medium text-white flex items-center gap-2 hover:shadow-lg transition-all" style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}>
                  <Sparkles className="w-4 h-4" /> Start Designing <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="px-6 py-3 rounded-md font-medium text-foreground border border-border hover:bg-accent transition-all flex items-center gap-2">
                  <Play className="w-4 h-4" /> View Demo
                </button>
              </div>
              <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border">
                {[['10K+', 'Designs Generated'], ['500+', 'CAD Exports'], ['98%', 'Accuracy Rate']].map(([v, l]) => (
                  <div key={l}>
                    <div className="text-2xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">{v}</div>
                    <div className="text-sm mt-1 text-muted-foreground">{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="rounded-2xl overflow-hidden border border-border shadow-2xl bg-input-background">
                <ImageWithFallback
                  src="https://via.placeholder.com/1080x720/f3f3f5/7c3aed?text=Jewelry+Preview"
                  alt="Jewelry Design Preview"
                  className="w-full h-[480px] object-cover"
                />
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-8 bg-input-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-semibold text-foreground mb-4">
              Professional Jewelry Design<br />
              <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Made Simple</span>
            </h2>
            <p className="text-lg text-muted-foreground">From AI-powered generation to production-ready CAD files</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'AI Design Generation', desc: 'Generate unlimited design variations with our advanced AI engine.' },
              { icon: Zap, title: 'Real-time Preview', desc: 'Visualize your designs in stunning detail before exporting.' },
              { icon: Download, title: 'CAD File Export', desc: 'Export production-ready files in STL, STEP, SVG, DXF formats.' },
              { icon: Cpu, title: 'AI Co-Pilot Editor', desc: 'Modify designs with natural language commands.' },
              { icon: Gem, title: 'Design Library', desc: 'Save and organize all your designs with smart categorization.' },
              { icon: Sparkles, title: 'Manufacturing Ready', desc: 'All designs validated for manufacturing feasibility.' },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="rounded-xl p-6 bg-white border border-border hover:shadow-lg hover:border-purple-200 transition-all">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-purple-600 bg-purple-50">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-2xl p-16 border border-border bg-gradient-to-br from-purple-50 to-blue-50 relative overflow-hidden">
            <h2 className="text-3xl font-semibold text-foreground mb-4">
              Ready to Create?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">Join hundreds of designers using GemStudio</p>
            <Link to="/login" className="inline-flex items-center gap-3 px-8 py-4 rounded-md font-medium text-white transition-all hover:shadow-lg" style={{ background: 'linear-gradient(to right, #7c3aed, #2563eb)' }}>
              <Sparkles className="w-5 h-5" /> Start Designing Now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">GemStudio</span>
          </div>
          <p className="text-xs text-muted-foreground">&copy; 2026 GemStudio. Professional AI-Powered Jewelry Design Platform.</p>
        </div>
      </footer>
    </div>
  );
}
