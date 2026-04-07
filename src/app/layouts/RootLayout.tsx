import { useMemo, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Sparkles,
  FolderOpen,
  MessageSquare,
  Download,
  Settings,
  Layers,
  PanelLeftClose,
  PanelLeft,
  LogOut,
} from 'lucide-react';

import { clearAuthSession, readStoredSession } from '../services/skygemsApi';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Sparkles, label: 'Create Design', path: '/app/create' },
  { icon: Layers, label: 'Variations', path: '/app/variations' },
  { icon: FolderOpen, label: 'Design Library', path: '/app/gallery' },
  { icon: MessageSquare, label: 'AI Assistant', path: '/app/copilot' },
  { icon: Download, label: 'CAD Exports', path: '/app/export' },
  { icon: Settings, label: 'Settings', path: '/app/settings' },
];

export function RootLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const session = useMemo(() => readStoredSession(), []);
  const initials = (session?.userDisplayName || session?.userEmail || 'U')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('') || 'U';

  const handleSignOut = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className="flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200"
        style={{ width: collapsed ? '56px' : '240px' }}
      >
        {/* Logo + Toggle */}
        <div
          className="flex items-center border-b border-sidebar-border"
          style={{
            padding: collapsed ? '16px 12px' : '16px 20px',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}
        >
          <Link to="/" className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <span className="text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                GemStudio
              </span>
            )}
          </Link>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
              className="w-full h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
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
                className={`flex items-center rounded-md transition-all ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
                style={{
                  padding: collapsed ? '8px' : '8px 12px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? '0' : '10px',
                }}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-sidebar-border">
          <div
            className="flex items-center rounded-md bg-sidebar-accent"
            style={{
              padding: collapsed ? '8px' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? '0' : '10px',
            }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">
                  {session?.userDisplayName || 'User Account'}
                </p>
                <p className="text-[10px] truncate text-muted-foreground">
                  {session?.userEmail || 'Sign in to load your workspace'}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden bg-background">
        <Outlet />
      </main>
    </div>
  );
}
