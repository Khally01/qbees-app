import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Camera, User, X } from "lucide-react";
import { api, Task, Property, User as UserType } from "../lib/api";
import { DataTable, Column } from "../components/ui/DataTable";
import { DateRangePicker } from "../components/ui/DateRangePicker";
import { useAuth } from "../lib/auth";

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "Pending", bg: "bg-amber-50", text: "text-amber-800", dot: "bg-amber-400" },
  assigned: { label: "Assigned", bg: "bg-blue-50", text: "text-blue-800", dot: "bg-blue-400" },
  accepted: { label: "Accepted", bg: "bg-purple-50", text: "text-purple-800", dot: "bg-purple-400" },
  in_progress: { label: "In Progress", bg: "bg-sky-50", text: "text-sky-800", dot: "bg-sky-500" },
  completed: { label: "Completed", bg: "bg-emerald-50", text: "text-emerald-800", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function Jobs() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const today = fmt(new Date());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [cleaners, setCleaners] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [propertyFilter, setPropertyFilter] = useState("");
  const [beeFilter, setBeeFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Show create modal
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.listTasks({
        date_from: dateFrom,
        date_to: dateTo,
        status: statusFilter || undefined,
        property_id: propertyFilter || undefined,
        search: search || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [dateFrom, dateTo, statusFilter, propertyFilter, beeFilter, sortBy, sortDir]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(fetchTasks, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Load properties + cleaners for filter dropdowns
  useEffect(() => {
    api.listProperties().then(setProperties).catch(() => {});
    if (isAdmin) api.listUsers({ role: "cleaner" }).then(setCleaners).catch(() => {});
  }, []);

  // Stats
  const stats = {
    all: tasks.length,
    pending: tasks.filter((t) => ["pending", "assigned", "accepted"].includes(t.status)).length,
    active: tasks.filter((t) => t.status === "in_progress").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  // Table columns
  const columns: Column<Task>[] = [
    {
      key: "status",
      label: "Status",
      width: "110px",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "scheduled_date",
      label: "Date",
      sortable: true,
      width: "100px",
      render: (row) => (
        <span className="text-sm">{row.scheduled_date}</span>
      ),
    },
    {
      key: "scheduled_time",
      label: "Time",
      sortable: true,
      width: "70px",
      render: (row) => (
        <span className="text-sm text-qbees-accent">
          {row.scheduled_time ? row.scheduled_time.slice(0, 5) : "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "property_name",
      label: "Property",
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-semibold text-qbees-dark">{row.property_name || "—"}</div>
          {row.property_address && (
            <div className="text-xs text-qbees-accent truncate max-w-[200px]">{row.property_address}</div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      label: "Job",
      sortable: true,
      render: (row) => <span className="text-sm">{row.name}</span>,
      hideOnMobile: true,
    },
    {
      key: "assignments",
      label: "Assigned Bee",
      render: (row) =>
        row.assignments.length > 0 ? (
          <div className="flex items-center gap-1">
            <User size={13} className="text-qbees-accent" />
            <span className="text-sm">{row.assignments.map((a) => a.user_name).join(", ")}</span>
          </div>
        ) : (
          <span className="text-xs text-red-500 font-medium">Unassigned</span>
        ),
      hideOnMobile: true,
    },
    {
      key: "photo_count",
      label: "Photos",
      width: "70px",
      render: (row) =>
        row.photo_count > 0 ? (
          <span className="flex items-center gap-1 text-sm text-qbees-accent">
            <Camera size={13} /> {row.photo_count}
          </span>
        ) : null,
      hideOnMobile: true,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-qbees-border px-4 py-3 md:px-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-qbees-dark">Jobs</h1>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-qbees-dark text-qbees-gold rounded-lg text-sm font-semibold cursor-pointer border-0 hover:bg-qbees-dark/90 transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Create Job</span>
            </button>
          )}
        </div>

        {/* Date range + Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <DateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={(f, t) => { setDateFrom(f); setDateTo(t); }}
          />
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-qbees-accent" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-qbees-border bg-white outline-none focus:border-qbees-accent"
            />
          </div>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-2 mt-3 items-center">
          {/* Status tabs */}
          {[
            { key: "", label: `All (${stats.all})` },
            { key: "pending", label: `Pending (${stats.pending})` },
            { key: "in_progress", label: `Active (${stats.active})` },
            { key: "completed", label: `Done (${stats.completed})` },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                statusFilter === f.key
                  ? "bg-qbees-dark text-qbees-gold border-qbees-dark"
                  : "bg-white text-qbees-accent border-qbees-border hover:border-qbees-accent"
              }`}
            >
              {f.label}
            </button>
          ))}

          {/* Dropdowns */}
          <select
            value={propertyFilter}
            onChange={(e) => setPropertyFilter(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-qbees-border bg-white text-qbees-dark outline-none"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {isAdmin && cleaners.length > 0 && (
            <select
              value={beeFilter}
              onChange={(e) => setBeeFilter(e.target.value)}
              className="text-xs px-2 py-1.5 rounded-lg border border-qbees-border bg-white text-qbees-dark outline-none"
            >
              <option value="">All Bees</option>
              {cleaners.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {(statusFilter || propertyFilter || beeFilter || search) && (
            <button
              onClick={() => { setStatusFilter(""); setPropertyFilter(""); setBeeFilter(""); setSearch(""); }}
              className="flex items-center gap-1 text-xs text-red-500 cursor-pointer bg-transparent border-0 hover:underline"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <DataTable
          columns={columns}
          data={tasks}
          keyField="id"
          onRowClick={(row) => navigate(`/jobs/${row.id}`)}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key, dir) => { setSortBy(key); setSortDir(dir); }}
          loading={loading}
          emptyMessage="No jobs found for this date range"
        />
      </div>

      {/* Create Job Modal */}
      {showCreate && (
        <CreateJobModal
          properties={properties}
          cleaners={cleaners}
          defaultDate={dateFrom}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchTasks(); }}
        />
      )}
    </div>
  );
}

/* --- Create Job Modal --- */
function CreateJobModal({
  properties, cleaners, defaultDate, onClose, onCreated,
}: {
  properties: Property[]; cleaners: UserType[]; defaultDate: string;
  onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    property_id: "", name: "Standard Clean", scheduled_date: defaultDate,
    scheduled_time: "", notes: "", assignee_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.createTask({
        ...form,
        scheduled_time: form.scheduled_time || undefined,
        notes: form.notes || undefined,
        assignee_ids: form.assignee_ids.length ? form.assignee_ids : undefined,
      });
      onCreated();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-qbees-dark">Create Job</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-qbees-accent hover:text-qbees-dark">
            <X size={22} />
          </button>
        </div>

        <label className="block text-sm font-semibold text-qbees-dark mb-1">Property *</label>
        <select
          value={form.property_id}
          onChange={(e) => setForm({ ...form, property_id: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-qbees-border text-sm mb-3 outline-none focus:border-qbees-accent"
        >
          <option value="">Select property...</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="block text-sm font-semibold text-qbees-dark mb-1">Job Name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-qbees-border text-sm mb-3 outline-none focus:border-qbees-accent"
        />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-qbees-dark mb-1">Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-qbees-border text-sm outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-qbees-dark mb-1">Time</label>
            <input
              type="time"
              value={form.scheduled_time}
              onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-qbees-border text-sm outline-none"
            />
          </div>
        </div>

        <label className="block text-sm font-semibold text-qbees-dark mb-1">Assign Bees</label>
        <div className="max-h-32 overflow-auto mb-3 border border-qbees-border rounded-lg p-2">
          {cleaners.map((c) => (
            <label key={c.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.assignee_ids.includes(c.id)}
                onChange={(e) => setForm({
                  ...form,
                  assignee_ids: e.target.checked
                    ? [...form.assignee_ids, c.id]
                    : form.assignee_ids.filter((id) => id !== c.id),
                })}
              />
              {c.name} {c.phone && <span className="text-qbees-accent text-xs">({c.phone})</span>}
            </label>
          ))}
          {cleaners.length === 0 && <div className="text-xs text-qbees-accent py-2">No cleaners yet</div>}
        </div>

        <label className="block text-sm font-semibold text-qbees-dark mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg border border-qbees-border text-sm mb-4 outline-none resize-y"
        />

        <button
          onClick={submit}
          disabled={saving || !form.property_id}
          className="w-full py-3 bg-qbees-dark text-qbees-gold rounded-lg font-bold text-sm cursor-pointer border-0 disabled:opacity-50 hover:bg-qbees-dark/90 transition-colors"
        >
          {saving ? "Creating..." : "Create Job"}
        </button>
      </div>
    </div>
  );
}
