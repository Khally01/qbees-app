import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Settings, LogOut, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth";

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const items = [
    { path: "/tasks", icon: Calendar, label: "Schedule" },
    ...(isAdmin ? [{ path: "/admin", icon: Settings, label: "Manage" }] : []),
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#2D2A24",
        display: "flex",
        justifyContent: "space-around",
        padding: "6px 0",
        paddingBottom: "max(6px, env(safe-area-inset-bottom))",
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const active = location.pathname.startsWith(item.path);
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              background: "none",
              border: "none",
              color: active ? "#DAC694" : "#6B6560",
              fontSize: 10,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              padding: "4px 20px",
            }}
          >
            <item.icon size={20} />
            {item.label}
          </button>
        );
      })}
      <button
        onClick={() => {
          logout();
          navigate("/login");
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          background: "none",
          border: "none",
          color: "#6B6560",
          fontSize: 10,
          fontWeight: 500,
          cursor: "pointer",
          padding: "4px 20px",
        }}
      >
        <LogOut size={20} />
        Sign Out
      </button>
    </nav>
  );
}
