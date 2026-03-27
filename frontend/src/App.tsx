import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { AppShell } from "./components/layout/AppShell";
import { Login } from "./pages/Login";
import { Jobs } from "./pages/Jobs";
import { TaskDetail } from "./pages/TaskDetail";
import { Admin } from "./pages/Admin";
import { MyTasks } from "./pages/MyTasks";
import "./i18n";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* New desktop routes */}
      <Route path="/jobs" element={<ProtectedRoute><AppShell><Jobs /></AppShell></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><AppShell><TaskDetail /></AppShell></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><AppShell><DashboardPlaceholder /></AppShell></ProtectedRoute>} />
      <Route path="/properties" element={<ProtectedRoute><AppShell><PropertiesPlaceholder /></AppShell></ProtectedRoute>} />
      <Route path="/bees" element={<ProtectedRoute><AppShell><BeesPlaceholder /></AppShell></ProtectedRoute>} />

      {/* Legacy routes — redirect */}
      <Route path="/tasks" element={<Navigate to="/jobs" replace />} />
      <Route path="/tasks/:id" element={<Navigate to="/jobs" replace />} />
      <Route path="/admin" element={<Navigate to="/jobs" replace />} />

      <Route path="*" element={<Navigate to={user ? "/jobs" : "/login"} replace />} />
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

/* Placeholder pages for Phase 2-4 */
function DashboardPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-qbees-dark mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {["Active Properties", "Jobs Today", "Completion Rate", "Bees Working"].map((label) => (
          <div key={label} className="bg-white rounded-lg border border-qbees-border p-5 text-center">
            <div className="text-3xl font-bold text-qbees-dark mb-1">—</div>
            <div className="text-xs text-qbees-accent uppercase tracking-wider">{label}</div>
          </div>
        ))}
      </div>
      <p className="text-sm text-qbees-accent mt-6">Dashboard stats coming in Phase 4.</p>
    </div>
  );
}

function PropertiesPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-qbees-dark mb-4">Properties</h1>
      <p className="text-sm text-qbees-accent">Property management with data table coming in Phase 2.</p>
    </div>
  );
}

function BeesPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-qbees-dark mb-4">Bees</h1>
      <p className="text-sm text-qbees-accent">Cleaner management coming in Phase 3.</p>
    </div>
  );
}
