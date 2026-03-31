import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, User } from "../lib/api";

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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function SkillTags({ skills }: { skills: string[] | null }) {
  if (!skills || skills.length === 0) return <span className="text-gray-400 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {skills.slice(0, 3).map((s) => (
        <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
          {s.replace(/_/g, " ")}
        </span>
      ))}
      {skills.length > 3 && (
        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{skills.length - 3}</span>
      )}
    </div>
  );
}

export default function Bees() {
  const navigate = useNavigate();
  const [bees, setBees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("cleaner");
  const [activeOnly, setActiveOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "", role: "cleaner", language: "en" });
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listUsers({ role: roleFilter || undefined, search: search || undefined, active_only: activeOnly });
      setBees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search, activeOnly]);

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) { setAddError("Name is required"); return; }
    setAdding(true);
    setAddError("");
    try {
      await api.createUser(addForm);
      setShowAddModal(false);
      setAddForm({ name: "", phone: "", email: "", role: "cleaner", language: "en" });
      load();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setAdding(false);
    }
  }

  const adminCount = bees.filter((b) => b.role === "admin").length;
  const cleanerCount = bees.filter((b) => b.role === "cleaner").length;
  const activeCount = bees.filter((b) => b.is_active).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bees</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cleanerCount} cleaners · {adminCount} admins · {activeCount} active
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#16304f] text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Bee
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search name, phone, suburb..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
        >
          <option value="">All roles</option>
          <option value="cleaner">Cleaners</option>
          <option value="admin">Admins</option>
        </select>
        <label className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded"
          />
          Active only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        ) : bees.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="font-medium">No bees found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Language</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Transport</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Skills</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Suburb</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {bees.map((bee, idx) => (
                  <tr
                    key={bee.id}
                    onClick={() => navigate(`/bees/${bee.id}`)}
                    className={`cursor-pointer hover:bg-blue-50 transition-colors ${idx !== 0 ? "border-t border-gray-100" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1E3A5F] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {bee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{bee.name}</div>
                          {bee.nickname && <div className="text-xs text-gray-400">{bee.nickname}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{bee.phone || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${bee.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-amber-50 text-amber-700"}`}>
                        {bee.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{LANGUAGE_LABELS[bee.language] || bee.language}</td>
                    <td className="px-4 py-3 text-gray-600">{bee.transport ? TRANSPORT_LABELS[bee.transport] || bee.transport : <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3"><SkillTags skills={bee.skills} /></td>
                    <td className="px-4 py-3 text-gray-600">{bee.suburb || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3"><StatusBadge active={bee.is_active} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Bee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-semibold text-gray-900">Add New Bee</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {addError && <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{addError}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  placeholder="+61 4XX XXX XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]"
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                  >
                    <option value="cleaner">Cleaner</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select
                    value={addForm.language}
                    onChange={(e) => setAddForm({ ...addForm, language: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
                  >
                    {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#16304f] disabled:opacity-50"
                >
                  {adding ? "Adding..." : "Add Bee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
