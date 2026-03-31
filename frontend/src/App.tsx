import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AppShell } from "./components/layout/AppShell";
import { Login } from "./pages/Login";
import { Jobs } from "./pages/Jobs";
import { TaskDetail } from "./pages/TaskDetail";
import { Properties } from "./pages/Properties";
import { PropertyDetail } from "./pages/PropertyDetail";
import Bees from "./pages/Bees";
import BeeDetail from "./pages/BeeDetail";
import Dashboard from "./pages/Dashboard";
import "./i18n";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><AppShell><Jobs /></AppShell></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><AppShell><TaskDetail /></AppShell></ProtectedRoute>} />
      <Route path="/properties" element={<ProtectedRoute><AppShell><Properties /></AppShell></ProtectedRoute>} />
      <Route path="/properties/:id" element={<ProtectedRoute><AppShell><PropertyDetail /></AppShell></ProtectedRoute>} />
      <Route path="/bees" element={<ProtectedRoute><AppShell><Bees /></AppShell></ProtectedRoute>} />
      <Route path="/bees/:id" element={<ProtectedRoute><AppShell><BeeDetail /></AppShell></ProtectedRoute>} />

      {/* Legacy redirects */}
      <Route path="/tasks" element={<Navigate to="/jobs" replace />} />
      <Route path="/tasks/:id" element={<Navigate to="/jobs" replace />} />
      <Route path="/admin" element={<Navigate to="/bees" replace />} />

      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
