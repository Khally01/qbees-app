import { useNavigate, useLocation } from "react-router-dom";
import { ClipboardList, Calendar, Settings, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../lib/auth";

export function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const items = [
    { path: "/tasks", icon: ClipboardList, label: t("nav.tasks") },
    ...(isAdmin ? [{ path: "/admin", icon: Settings, label: t("nav.admin") }] : []),
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-around",
        padding: "8px 0",
        paddingBottom: "max(8px, env(safe-area-inset-bottom))",
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
              color: active ? "#fbbf24" : "#6b7280",
              fontSize: 11,
              fontWeight: active ? 700 : 400,
              cursor: "pointer",
              padding: "4px 16px",
            }}
          >
            <item.icon size={22} />
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
          color: "#6b7280",
          fontSize: 11,
          cursor: "pointer",
          padding: "4px 16px",
        }}
      >
        <LogOut size={22} />
        {t("nav.logout")}
      </button>
    </nav>
  );
}
