import { useNavigate, useLocation } from "react-router-dom";
import { CalendarDays, LayoutDashboard, Home, Users, LogOut } from "lucide-react";
import { useAuth } from "../lib/auth";

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const items = [
    { path: "/jobs", icon: CalendarDays, label: "Jobs" },
    ...(isAdmin
      ? [
          { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
          { path: "/properties", icon: Home, label: "Properties" },
          { path: "/bees", icon: Users, label: "Bees" },
        ]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-qbees-dark flex justify-around py-1.5 z-50"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      {items.map((item) => {
        const active = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 border-0 bg-transparent text-[10px] cursor-pointer ${
              active ? "text-qbees-gold font-bold" : "text-white/40"
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        );
      })}
      <button
        onClick={() => { logout(); navigate("/login"); }}
        className="flex flex-col items-center gap-0.5 px-3 py-1 border-0 bg-transparent text-[10px] text-white/40 cursor-pointer"
      >
        <LogOut size={20} />
        Out
      </button>
    </nav>
  );
}
