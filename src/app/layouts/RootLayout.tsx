import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  MessageSquare,
  Download,
  Gem,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Sparkles, label: 'Create Design', path: '/app/create' },
  { icon: FolderOpen, label: 'Design Library', path: '/app/gallery' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/app/copilot' },
  { icon: Download, label: 'CAD Exports', path: '/app/export' },
];

export function RootLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r transition-all duration-200"
        style={{
          width: collapsed ? '56px' : '240px',
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        {/* Logo + Toggle */}
        <div
          className="flex items-center border-b"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.06)',
            padding: collapsed ? '16px 12px' : '16px 20px',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <Gem className="w-4 h-4" style={{ color: 'var(--text-inverse)' }} />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                  SkyGems
                </h1>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Design Studio</p>
              </div>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="px-2 pt-2">
            <button
              onClick={() => setCollapsed(false)}
              className="w-full h-8 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
              title="Expand sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path ||
              (item.path === '/app' && location.pathname === '/app');

            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center rounded-md transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--accent-gold-glow)' : 'transparent',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  padding: collapsed ? '8px' : '8px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? '0' : '10px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-2 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}>
          <div
            className="flex items-center rounded-md"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              padding: collapsed ? '8px' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '10px',
            }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--accent-gold)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--text-inverse)' }}>U</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>User Account</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Premium Plan</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content — overflow-hidden so child pages control their own scrolling */}
      <main className="flex-1 overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Outlet />
      </main>
    </div>
  );
}
