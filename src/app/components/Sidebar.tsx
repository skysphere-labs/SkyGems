import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Sparkles, 
  Library, 
  Bot, 
  Download, 
  Settings,
  Gem
} from 'lucide-react';

const navItems = [
  { path: '/app', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/app/create', label: 'Create Design', icon: Sparkles },
  { path: '/app/gallery', label: 'Design Library', icon: Library },
  { path: '/app/copilot', label: 'AI Assistant', icon: Bot },
  { path: '/app/export', label: 'CAD Exports', icon: Download },
  { path: '/app/pipeline', label: 'Pipeline', icon: Gem },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-[#E5E5E5] min-h-screen flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A227] to-[#A3841F] flex items-center justify-center">
            <Gem className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-[#1E1E1E]">JewelGen AI</h2>
            <p className="text-xs text-[#6B6B6B]">Design Platform</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#C9A227] to-[#A3841F] text-white shadow-md'
                  : 'text-[#6B6B6B] hover:bg-[#F8F6F2]'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4">
        <NavLink
          to="/app/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#6B6B6B] hover:bg-[#F8F6F2] transition-all duration-200"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
}
