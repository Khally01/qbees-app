import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Plus, Home, Users, ClipboardList, X, Calendar, ChevronLeft, ChevronRight,
  MapPin, Search, Clock, User, AlertTriangle, Camera, CheckCircle2, Circle,
} from "lucide-react";
import { api, Task, Property, User as UserType } from "../lib/api";
import { BottomNav } from "../components/BottomNav";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function displayDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending: { label: "Pending", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  assigned: { label: "Assigned", bg: "#E8DCC8", color: "#6B5D3E", dot: "#DAC694" },
  accepted: { label: "Accepted", bg: "#E8DCC8", color: "#6B5D3E", dot: "#998D6C" },
  in_progress: { label: "In Progress", bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  completed: { label: "Completed", bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  cancelled: { label: "Cancelled", bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
};

export function Admin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [cleaners, setCleaners] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());
  const [tab, setTab] = useState<"schedule" | "properties" | "cleaners">("schedule");
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadAll(); }, [date]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [t, p, c] = await Promise.all([
        api.listTasks({ scheduled_date: formatDate(date) }),
        api.listProperties(),
        api.listUsers({ role: "cleaner" }),
      ]);
      setTasks(t);
      setProperties(p);
      setCleaners(c);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const prevDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => ["pending", "assigned", "accepted"].includes(t.status)).length,
    unassigned: tasks.filter((t) => !t.assignments.length).length,
  };

  // Group tasks by cleaner
  const byAssignee: Record<string, Task[]> = {};
  const unassigned: Task[] = [];
  for (const task of tasks) {
    if (!task.assignments.length) {
      unassigned.push(task);
    } else {
      for (const a of task.assignments) {
        const name = a.user_name || "Unknown";
        if (!byAssignee[name]) byAssignee[name] = [];
        byAssignee[name].push(task);
      }
    }
  }

  // Filtered properties
  const filteredProperties = searchQuery
    ? properties.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.address || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.suburb || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : properties;

  return (
    <div style={{ paddingBottom: 80, minHeight: "100vh", background: "#F5F0E8" }}>
      {/* Top header bar */}
      <div
        style={{
          background: "#2D2A24",
          padding: "10px 16px",
          paddingTop: "max(10px, env(safe-area-inset-top))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <img src="/icon.svg" alt="Qbees" style={{ height: 28 }} />
        <div style={{ display: "flex", gap: 2 }}>
          {([
            { key: "schedule", icon: Calendar, label: "Schedule" },
            { key: "properties", icon: Home, label: "Properties" },
            { key: "cleaners", icon: Users, label: "Bees" },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: tab === item.key ? "#DAC694" : "transparent",
                color: tab === item.key ? "#2D2A24" : "#998D6C",
                fontSize: 12,
                fontWeight: tab === item.key ? 700 : 500,
                cursor: "pointer",
              }}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* === SCHEDULE TAB === */}
      {tab === "schedule" && (
        <>
          {/* Date bar + stats */}
          <div style={{ background: "#fff", borderBottom: "1px solid #E8DCC8" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
              }}
            >
              <button onClick={prevDay} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <ChevronLeft size={20} color="#998D6C" />
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#2D2A24" }}>{displayDate(date)}</div>
              </div>
              <button onClick={nextDay} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <ChevronRight size={20} color="#998D6C" />
              </button>
            </div>

            {/* Stats strip */}
            <div style={{ display: "flex", borderTop: "1px solid #F0EAD6" }}>
              {[
                { label: "Total", value: stats.total, color: "#2D2A24" },
                { label: "Pending", value: stats.pending, color: "#F59E0B" },
                { label: "Active", value: stats.inProgress, color: "#3B82F6" },
                { label: "Done", value: stats.completed, color: "#10B981" },
                { label: "Unassigned", value: stats.unassigned, color: stats.unassigned > 0 ? "#EF4444" : "#9CA3AF" },
              ].map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: "8px 4px",
                    textAlign: "center",
                    borderRight: i < 4 ? "1px solid #F0EAD6" : "none",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "#998D6C", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Create task button */}
          <div style={{ padding: "12px 16px 4px" }}>
            <button
              onClick={() => setShowCreateTask(true)}
              style={{
                width: "100%",
                padding: 12,
                background: "#2D2A24",
                color: "#DAC694",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Plus size={16} />
              Create Task
            </button>
          </div>

          {/* Schedule list */}
          <div style={{ padding: "8px 16px 16px" }}>
            {loading ? (
              <div style={{ textAlign: "center", color: "#998D6C", paddingTop: 40 }}>Loading...</div>
            ) : tasks.length === 0 ? (
              <div style={{ textAlign: "center", color: "#998D6C", paddingTop: 40 }}>
                <Calendar size={40} style={{ opacity: 0.3, marginBottom: 8 }} />
                <div style={{ fontSize: 14 }}>No tasks scheduled</div>
              </div>
            ) : (
              <>
                {/* Unassigned warning */}
                {unassigned.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 12px",
                        background: "#FEF3C7",
                        borderRadius: "8px 8px 0 0",
                        borderBottom: "2px solid #F59E0B",
                      }}
                    >
                      <AlertTriangle size={14} color="#92400E" />
                      <span style={{ fontWeight: 700, fontSize: 12, color: "#92400E", textTransform: "uppercase" }}>
                        Unassigned ({unassigned.length})
                      </span>
                    </div>
                    {unassigned.map((task) => (
                      <TaskRow key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                    ))}
                  </div>
                )}

                {/* By cleaner */}
                {Object.entries(byAssignee).sort(([a], [b]) => a.localeCompare(b)).map(([name, ct]) => (
                  <div key={name} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        background: "#2D2A24",
                        borderRadius: "8px 8px 0 0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <User size={13} color="#DAC694" />
                        <span style={{ fontWeight: 700, fontSize: 13, color: "#FAF3E4" }}>{name}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: "#DAC694" }}>
                          {ct.filter((t) => t.status === "completed").length}/{ct.length} done
                        </span>
                        {ct.length >= 6 && (
                          <span style={{ fontSize: 10, background: "#EF4444", color: "#fff", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                            HEAVY
                          </span>
                        )}
                      </div>
                    </div>
                    {ct.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || "")).map((task) => (
                      <TaskRow key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {/* === PROPERTIES TAB === */}
      {tab === "properties" && (
        <div style={{ padding: 16 }}>
          {/* Search + Add */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} color="#998D6C" style={{ position: "absolute", left: 12, top: 12 }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search properties..."
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  borderRadius: 8,
                  border: "1px solid #E8DCC8",
                  fontSize: 14,
                  background: "#fff",
                  boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={() => setShowCreateProperty(true)}
              style={{
                padding: "10px 16px",
                background: "#2D2A24",
                color: "#DAC694",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                whiteSpace: "nowrap",
              }}
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* Property count */}
          <div style={{ fontSize: 12, color: "#998D6C", marginBottom: 8, fontWeight: 600 }}>
            {filteredProperties.length} PROPERTIES
          </div>

          {/* Property table-style list */}
          <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #E8DCC8" }}>
            {filteredProperties.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 14px",
                  borderBottom: i < filteredProperties.length - 1 ? "1px solid #F0EAD6" : "none",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "#F5F0E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Home size={16} color="#998D6C" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#2D2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#998D6C", marginTop: 1 }}>
                    {[p.address, p.suburb].filter(Boolean).join(", ") || "No address"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  {p.beds && <span style={{ fontSize: 12, color: "#998D6C" }}>{p.beds}BR</span>}
                  {p.baths && <span style={{ fontSize: 12, color: "#998D6C" }}>{p.baths}BA</span>}
                </div>
                <div
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: p.status === "active" ? "#D1FAE5" : "#F3F4F6",
                    color: p.status === "active" ? "#065F46" : "#6B7280",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {p.status}
                </div>
              </div>
            ))}
            {filteredProperties.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "#998D6C" }}>
                {searchQuery ? "No properties match your search" : "No properties yet"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === CLEANERS TAB === */}
      {tab === "cleaners" && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: "#998D6C", fontWeight: 600 }}>
              {cleaners.length} BEES
            </div>
            <button
              onClick={() => setShowAddCleaner(true)}
              style={{
                padding: "8px 16px",
                background: "#2D2A24",
                color: "#DAC694",
                border: "none",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Plus size={14} />
              Add Bee
            </button>
          </div>

          <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #E8DCC8" }}>
            {cleaners.map((c, i) => {
              // Count today's tasks for this cleaner
              const cleanerTasks = tasks.filter((t) => t.assignments.some((a) => a.user_name === c.name));
              const completedCount = cleanerTasks.filter((t) => t.status === "completed").length;

              return (
                <div
                  key={c.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderBottom: i < cleaners.length - 1 ? "1px solid #F0EAD6" : "none",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: c.is_active ? "#DAC694" : "#E5E7EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      color: "#2D2A24",
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {c.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#2D2A24" }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#998D6C", marginTop: 1 }}>
                      {c.phone || "No phone"} {c.language === "mn" ? " · Mongolian" : ""}
                    </div>
                  </div>
                  {cleanerTasks.length > 0 && (
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#2D2A24" }}>
                        {completedCount}/{cleanerTasks.length}
                      </div>
                      <div style={{ fontSize: 9, color: "#998D6C", textTransform: "uppercase" }}>today</div>
                    </div>
                  )}
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c.is_active ? "#10B981" : "#D1D5DB",
                      flexShrink: 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateTask && (
        <CreateTaskModal
          properties={properties}
          cleaners={cleaners}
          defaultDate={formatDate(date)}
          onClose={() => setShowCreateTask(false)}
          onCreated={() => { setShowCreateTask(false); loadAll(); }}
        />
      )}
      {showCreateProperty && (
        <CreatePropertyModal
          onClose={() => setShowCreateProperty(false)}
          onCreated={() => { setShowCreateProperty(false); loadAll(); }}
        />
      )}
      {showAddCleaner && (
        <AddCleanerModal
          onClose={() => setShowAddCleaner(false)}
          onCreated={() => { setShowAddCleaner(false); loadAll(); }}
        />
      )}

      <BottomNav />
    </div>
  );
}

/* --- Task Row (Breezeway schedule style) --- */
function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "#fff",
        borderBottom: "1px solid #F0EAD6",
        cursor: "pointer",
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
      <div style={{ width: 44, flexShrink: 0, textAlign: "center" }}>
        {task.scheduled_time ? (
          <span style={{ fontSize: 12, fontWeight: 600, color: "#2D2A24" }}>{task.scheduled_time.slice(0, 5)}</span>
        ) : (
          <span style={{ fontSize: 10, color: "#998D6C" }}>--:--</span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "#2D2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.property_name || "Unknown"}
        </div>
        <div style={{ fontSize: 11, color: "#998D6C" }}>{task.name}</div>
      </div>
      <div style={{ padding: "2px 8px", borderRadius: 10, background: sc.bg, fontSize: 10, fontWeight: 600, color: sc.color, whiteSpace: "nowrap" }}>
        {sc.label}
      </div>
    </div>
  );
}

/* --- Modals --- */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 100 }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: "16px 16px 0 0", width: "100%", maxHeight: "85vh", overflow: "auto", padding: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, color: "#2D2A24" }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={24} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E8DCC8",
  fontSize: 14, marginBottom: 12, boxSizing: "border-box", background: "#fff",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4, color: "#2D2A24" };
const btnStyle: React.CSSProperties = {
  width: "100%", padding: 14, background: "#2D2A24", color: "#DAC694",
  border: "none", borderRadius: 8, fontWeight: 700, fontSize: 15, cursor: "pointer",
};

function CreateTaskModal({
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
    <Modal title="Create Task" onClose={onClose}>
      <label style={labelStyle}>Property *</label>
      <select value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} style={inputStyle}>
        <option value="">Select property...</option>
        {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <label style={labelStyle}>Task Name</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Date</label>
          <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Time</label>
          <input type="time" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <label style={labelStyle}>Assign Bees</label>
      <div style={{ marginBottom: 12, maxHeight: 150, overflow: "auto" }}>
        {cleaners.map((c) => (
          <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 14 }}>
            <input
              type="checkbox"
              checked={form.assignee_ids.includes(c.id)}
              onChange={(e) => setForm({
                ...form,
                assignee_ids: e.target.checked ? [...form.assignee_ids, c.id] : form.assignee_ids.filter((id) => id !== c.id),
              })}
            />
            {c.name} {c.phone && <span style={{ color: "#998D6C", fontSize: 12 }}>({c.phone})</span>}
          </label>
        ))}
      </div>
      <label style={labelStyle}>Notes</label>
      <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
      <button onClick={submit} disabled={saving || !form.property_id} style={{ ...btnStyle, opacity: saving || !form.property_id ? 0.6 : 1 }}>
        {saving ? "Creating..." : "Create Task"}
      </button>
    </Modal>
  );
}

function CreatePropertyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", address: "", suburb: "", beds: "", baths: "", owner_name: "", owner_email: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.createProperty({
        name: form.name, address: form.address || undefined, suburb: form.suburb || undefined,
        beds: form.beds ? Number(form.beds) : undefined, baths: form.baths ? Number(form.baths) : undefined,
        owner_name: form.owner_name || undefined, owner_email: form.owner_email || undefined,
      });
      onCreated();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <Modal title="Add Property" onClose={onClose}>
      <label style={labelStyle}>Name *</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Beach House Mornington" />
      <label style={labelStyle}>Address</label>
      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Suburb</label>
      <input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} style={inputStyle} />
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Beds</label>
          <input type="number" value={form.beds} onChange={(e) => setForm({ ...form, beds: e.target.value })} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Baths</label>
          <input type="number" step="0.5" value={form.baths} onChange={(e) => setForm({ ...form, baths: e.target.value })} style={inputStyle} />
        </div>
      </div>
      <label style={labelStyle}>Owner Name</label>
      <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Owner Email</label>
      <input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} style={inputStyle} />
      <button onClick={submit} disabled={saving || !form.name} style={{ ...btnStyle, opacity: saving || !form.name ? 0.6 : 1 }}>
        {saving ? "Saving..." : "Add Property"}
      </button>
    </Modal>
  );
}

function AddCleanerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: "", phone: "", language: "en" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.createUser({ name: form.name, phone: form.phone || undefined, role: "cleaner", language: form.language });
      onCreated();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  return (
    <Modal title="Add Bee" onClose={onClose}>
      <label style={labelStyle}>Name *</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
      <label style={labelStyle}>Phone</label>
      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="0412 345 678" />
      <label style={labelStyle}>Language</label>
      <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} style={inputStyle}>
        <option value="en">English</option>
        <option value="mn">Mongolian</option>
      </select>
      <button onClick={submit} disabled={saving || !form.name} style={{ ...btnStyle, opacity: saving || !form.name ? 0.6 : 1 }}>
        {saving ? "Adding..." : "Add Bee"}
      </button>
    </Modal>
  );
}
