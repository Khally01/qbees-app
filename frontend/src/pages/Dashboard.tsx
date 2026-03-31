import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, DashboardStats } from "../lib/api";

function StatCard({
  label,
  value,
  sub,
  icon,
  color = "blue",
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  onClick?: () => void;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-[#1E3A5F]",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    purple: "bg-purple-50 text-purple-700",
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 ${onClick ? "cursor-pointer hover:border-[#1E3A5F]/30 hover:shadow-sm transition-all" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

function TodayRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{count}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    api.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading dashboard...
      </div>
    );
  }

  if (!stats) {
    return <div className="p-6 text-gray-400">Failed to load dashboard stats.</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{today}</p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Active Properties"
          value={stats.active_properties}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
          color="blue"
          onClick={() => navigate("/properties")}
        />
        <StatCard
          label="Active Bees"
          value={stats.active_bees}
          sub="Cleaners online"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="green"
          onClick={() => navigate("/bees")}
        />
        <StatCard
          label="Jobs This Month"
          value={stats.this_month.total}
          sub={`${stats.this_month.completed} completed`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="purple"
          onClick={() => navigate("/jobs")}
        />
        <StatCard
          label="Completion Rate"
          value={`${stats.this_month.completion_rate}%`}
          sub="This month"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
          color={stats.this_month.completion_rate >= 80 ? "green" : stats.this_month.completion_rate >= 50 ? "amber" : "red"}
        />
      </div>

      {/* Today's Jobs */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today's Jobs</h2>
            <button
              onClick={() => navigate("/jobs")}
              className="text-xs text-[#1E3A5F] hover:underline font-medium"
            >
              View all →
            </button>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-4">{stats.today.total}</div>
          <div className="space-y-3">
            <TodayRow label="Completed" count={stats.today.completed} total={stats.today.total} color="bg-green-500" />
            <TodayRow label="In Progress" count={stats.today.in_progress} total={stats.today.total} color="bg-blue-500" />
            <TodayRow label="Pending" count={stats.today.pending} total={stats.today.total} color="bg-yellow-400" />
            <TodayRow label="Unassigned" count={stats.today.unassigned} total={stats.today.total} color="bg-red-400" />
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              label="Create Job"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
              onClick={() => navigate("/jobs")}
            />
            <QuickAction
              label="View Unassigned"
              badge={stats.today.unassigned > 0 ? stats.today.unassigned : undefined}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              onClick={() => navigate("/jobs")}
            />
            <QuickAction
              label="Add Property"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
              onClick={() => navigate("/properties")}
            />
            <QuickAction
              label="Add Bee"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              }
              onClick={() => navigate("/bees")}
            />
          </div>

          {/* Month progress */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">Monthly completion</span>
              <span className="text-sm font-semibold text-gray-900">{stats.this_month.completion_rate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  stats.this_month.completion_rate >= 80 ? "bg-green-500" :
                  stats.this_month.completion_rate >= 50 ? "bg-amber-400" : "bg-red-400"
                }`}
                style={{ width: `${stats.this_month.completion_rate}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {stats.this_month.completed} of {stats.this_month.total} jobs completed this month
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  label,
  icon,
  badge,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-[#1E3A5F]/30 transition-colors text-left"
    >
      <div className="text-[#1E3A5F] flex-shrink-0">{icon}</div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {badge !== undefined && (
        <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </button>
  );
}
