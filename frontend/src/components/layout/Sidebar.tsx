import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Home, Users, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useState } from "react";

const NAV_ITEMS = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/jobs", icon: CalendarDays, label: "Jobs" },
  { path: "/properties", icon: Home, label: "Properties" },
  { path: "/bees", icon: Users, label: "Bees" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col bg-qbees-dark text-white transition-all duration-200 ${collapsed ? "w-16" : "w-56"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
        <img src="/icon.svg" alt="Qbees" className="h-8 w-8 flex-shrink-0" />
        {!collapsed && <span className="text-qbees-gold font-bold text-lg">Qbees</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors border-0 ${
                active
                  ? "bg-qbees-gold/15 text-qbees-gold border-r-2 border-r-qbees-gold"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Collapse */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-2 text-white/40 hover:text-white/70 border-t border-white/10 border-0 bg-transparent"
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        {!collapsed && (
          <div className="text-xs text-white/50 mb-2 truncate">{user?.name}</div>
        )}
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className={`flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors border-0 bg-transparent ${collapsed ? "justify-center w-full" : ""}`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
