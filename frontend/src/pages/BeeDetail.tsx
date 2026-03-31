import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, UserStats } from "../lib/api";

const TRANSPORT_LABELS: Record<string, string> = {
  car: "🚗 Car",
  walking: "🚶 Walking",
  public: "🚌 Public",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  zh: "中文",
  vi: "Tiếng Việt",
  es: "Español",
  ko: "한국어",
  ar: "العربية",
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800",
  in_progress: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-500",
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function BeeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "stats" | "jobs">("profile");

  useEffect(() => {
    if (!id) return;
    api.getUserStats(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  function startEdit() {
    if (!data) return;
    const u = data.user;
    setEditForm({
      name: u.name || "",
      phone: u.phone || "",
      email: u.email || "",
      nickname: u.nickname || "",
      address: u.address || "",
      suburb: u.suburb || "",
      transport: u.transport || "",
      notes: u.notes || "",
      language: u.language || "en",
      is_active: u.is_active,
    });
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setSaveError("");
    try {
      await api.updateUser(id, editForm as Record<string, string>);
      const updated = await api.getUserStats(id);
      setData(updated);
      setEditing(false);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Bee not found</p>
        <button onClick={() => navigate("/bees")} className="mt-4 text-[#1E3A5F] text-sm underline">Back to Bees</button>
      </div>
    );
  }

  const { user, stats, recent_tasks } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back + Header */}
      <button
        onClick={() => navigate("/bees")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Bees
      </button>

      {/* Profile header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user.name}</h1>
              {user.nickname && <p className="text-sm text-gray-500">"{user.nickname}"</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-amber-50 text-amber-700"}`}>
                  {user.role}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                  {user.is_active ? "Active" : "Inactive"}
                </span>
                {user.language && (
                  <span className="text-xs text-gray-500">{LANGUAGE_LABELS[user.language] || user.language}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={startEdit}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Profile
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Jobs" value={stats.total_jobs} sub="All time" />
        <StatCard label="Completed" value={stats.completed_jobs} sub="All time" />
        <StatCard label="Completion Rate" value={`${stats.completion_rate}%`} />
        <StatCard label="This Month" value={stats.this_month} sub="Jobs assigned" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-5">
        <div className="flex gap-0">
          {(["profile", "stats", "jobs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-[#1E3A5F] text-[#1E3A5F]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "jobs" ? "Recent Jobs" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Profile tab */}
      {activeTab === "profile" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Contact</h3>
              <InfoRow label="Phone" value={user.phone} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Address" value={user.address} />
              <InfoRow label="Suburb" value={user.suburb} />
              <InfoRow label="Started" value={user.start_date} />
            </div>
            <div className="p-5 space-y-4">
              <h3 className="font-semibold text-gray-800">Work Details</h3>
              <InfoRow label="Transport" value={user.transport ? TRANSPORT_LABELS[user.transport] || user.transport : null} />
              {user.skills && user.skills.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {user.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              )}
              {user.regions && user.regions.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Regions</p>
                  <div className="flex flex-wrap gap-1">
                    {user.regions.map((r) => (
                      <span key={r} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">{r}</span>
                    ))}
                  </div>
                </div>
              )}
              {user.notes && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{user.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats tab (performance chart placeholder) */}
      {activeTab === "stats" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#1E3A5F]">{stats.total_jobs}</div>
              <div className="text-sm text-gray-500 mt-1">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{stats.completed_jobs}</div>
              <div className="text-sm text-gray-500 mt-1">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-500">{stats.completion_rate}%</div>
              <div className="text-sm text-gray-500 mt-1">Completion Rate</div>
            </div>
          </div>
          {stats.total_jobs > 0 && (
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Completion progress</p>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${stats.completion_rate}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Jobs tab */}
      {activeTab === "jobs" && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {recent_tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No jobs found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Completed</th>
                </tr>
              </thead>
              <tbody>
                {recent_tasks.map((t, idx) => (
                  <tr key={t.id} className={`${idx !== 0 ? "border-t border-gray-100" : ""} hover:bg-gray-50`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-4 py-3 text-gray-600">{t.scheduled_date}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[t.status] || "bg-gray-100 text-gray-600"}`}>
                        {t.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {t.completed_at ? new Date(t.completed_at).toLocaleDateString("en-AU") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b flex-shrink-0">
              <h2 className="font-semibold text-gray-900">Edit Bee Profile</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3 overflow-y-auto flex-1">
              {saveError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{saveError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={editForm.name as string} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nickname</label>
                  <input type="text" value={editForm.nickname as string} onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={editForm.phone as string} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editForm.email as string} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input type="text" value={editForm.address as string} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Suburb</label>
                  <input type="text" value={editForm.suburb as string} onChange={(e) => setEditForm({ ...editForm, suburb: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Transport</label>
                  <select value={editForm.transport as string} onChange={(e) => setEditForm({ ...editForm, transport: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
                    <option value="">—</option>
                    <option value="car">Car</option>
                    <option value="walking">Walking</option>
                    <option value="public">Public</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
                  <select value={editForm.language as string} onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
                    {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select value={editForm.is_active ? "active" : "inactive"} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === "active" })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={3} value={editForm.notes as string} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F] resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#16304f] disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 mt-0.5">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}
