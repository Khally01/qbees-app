import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Home, Users, ClipboardList, X } from "lucide-react";
import { api, Task, Property, User as UserType } from "../lib/api";
import { TaskCard } from "../components/TaskCard";
import { BottomNav } from "../components/BottomNav";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function Admin() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [cleaners, setCleaners] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProperty, setShowCreateProperty] = useState(false);
  const [showAddCleaner, setShowAddCleaner] = useState(false);
  const [tab, setTab] = useState<"tasks" | "properties" | "cleaners">("tasks");

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [t, p, c] = await Promise.all([
        api.listTasks({ scheduled_date: formatDate(new Date()) }),
        api.listProperties(),
        api.listUsers("cleaner"),
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

  const todayStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    unassigned: tasks.filter((t) => t.assignments.length === 0).length,
  };

  return (
    <div style={{ paddingBottom: 80, minHeight: "100vh", background: "#FAF3E4" }}>
      {/* Header */}
      <div
        style={{
          background: "#2D2A24",
          padding: "20px 16px 16px",
          paddingTop: "max(20px, env(safe-area-inset-top))",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#FAF3E4" }}>{t("admin.title")}</h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: 16 }}>
        {[
          { label: t("admin.total_tasks"), value: todayStats.total, color: "#3b82f6" },
          { label: t("admin.completed"), value: todayStats.completed, color: "#22c55e" },
          { label: t("admin.in_progress"), value: todayStats.inProgress, color: "#f97316" },
          { label: t("admin.unassigned"), value: todayStats.unassigned, color: "#ef4444" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "12px 8px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", padding: "0 16px", gap: 8, marginBottom: 16 }}>
        {(["tasks", "properties", "cleaners"] as const).map((t_) => (
          <button
            key={t_}
            onClick={() => setTab(t_)}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 8,
              border: "none",
              background: tab === t_ ? "#DAC694" : "#e5e7eb",
              fontWeight: tab === t_ ? 700 : 500,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            {t_ === "tasks" && <ClipboardList size={14} style={{ marginRight: 4, verticalAlign: -2 }} />}
            {t_ === "properties" && <Home size={14} style={{ marginRight: 4, verticalAlign: -2 }} />}
            {t_ === "cleaners" && <Users size={14} style={{ marginRight: 4, verticalAlign: -2 }} />}
            {t(`admin.${t_}`)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "0 16px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280" }}>{t("common.loading")}</p>
        ) : tab === "tasks" ? (
          <>
            <button
              onClick={() => setShowCreateTask(true)}
              style={{
                width: "100%",
                padding: 14,
                background: "#DAC694",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={18} />
              {t("admin.create_task")}
            </button>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </>
        ) : tab === "properties" ? (
          <>
            <button
              onClick={() => setShowCreateProperty(true)}
              style={{
                width: "100%",
                padding: 14,
                background: "#DAC694",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={18} />
              Add Property
            </button>
            {properties.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{p.name}</h3>
                {p.address && <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 14 }}>{p.address}</p>}
                <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                  {p.beds && <span>{p.beds} beds</span>}
                  {p.baths && <span>{p.baths} baths</span>}
                  {p.property_type && <span>{p.property_type}</span>}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => setShowAddCleaner(true)}
              style={{
                width: "100%",
                padding: 14,
                background: "#DAC694",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Plus size={18} />
              Add Cleaner
            </button>
            {cleaners.map((c) => (
              <div
                key={c.id}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{c.name}</h3>
                  <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: 14 }}>{c.phone}</p>
                </div>
                <span
                  style={{
                    background: c.is_active ? "#dcfce7" : "#fee2e2",
                    color: c.is_active ? "#16a34a" : "#dc2626",
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateTask && (
        <CreateTaskModal
          properties={properties}
          cleaners={cleaners}
          onClose={() => setShowCreateTask(false)}
          onCreated={() => {
            setShowCreateTask(false);
            loadAll();
          }}
        />
      )}

      {/* Create Property Modal */}
      {showCreateProperty && (
        <CreatePropertyModal
          onClose={() => setShowCreateProperty(false)}
          onCreated={() => {
            setShowCreateProperty(false);
            loadAll();
          }}
        />
      )}

      {/* Add Cleaner Modal */}
      {showAddCleaner && (
        <AddCleanerModal
          onClose={() => setShowAddCleaner(false)}
          onCreated={() => {
            setShowAddCleaner(false);
            loadAll();
          }}
        />
      )}

      <BottomNav />
    </div>
  );
}

/* --- Modals --- */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px 16px 0 0",
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 15,
  marginBottom: 12,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 4,
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  background: "#DAC694",
  border: "none",
  borderRadius: 8,
  fontWeight: 700,
  fontSize: 15,
  cursor: "pointer",
};

function CreateTaskModal({
  properties,
  cleaners,
  onClose,
  onCreated,
}: {
  properties: Property[];
  cleaners: UserType[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    property_id: "",
    name: "Standard Clean",
    scheduled_date: formatDate(new Date()),
    scheduled_time: "",
    notes: "",
    assignee_ids: [] as string[],
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
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Task" onClose={onClose}>
      <label style={labelStyle}>Property</label>
      <select
        value={form.property_id}
        onChange={(e) => setForm({ ...form, property_id: e.target.value })}
        style={inputStyle}
      >
        <option value="">Select property...</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <label style={labelStyle}>Task Name</label>
      <input
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        style={inputStyle}
      />

      <label style={labelStyle}>Date</label>
      <input
        type="date"
        value={form.scheduled_date}
        onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
        style={inputStyle}
      />

      <label style={labelStyle}>Time (optional)</label>
      <input
        type="time"
        value={form.scheduled_time}
        onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
        style={inputStyle}
      />

      <label style={labelStyle}>Assign Cleaners</label>
      <div style={{ marginBottom: 12 }}>
        {cleaners.map((c) => (
          <label
            key={c.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              fontSize: 15,
            }}
          >
            <input
              type="checkbox"
              checked={form.assignee_ids.includes(c.id)}
              onChange={(e) => {
                setForm({
                  ...form,
                  assignee_ids: e.target.checked
                    ? [...form.assignee_ids, c.id]
                    : form.assignee_ids.filter((id) => id !== c.id),
                });
              }}
            />
            {c.name} {c.phone && <span style={{ color: "#9ca3af" }}>({c.phone})</span>}
          </label>
        ))}
      </div>

      <label style={labelStyle}>Notes (optional)</label>
      <textarea
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
        rows={3}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <button onClick={submit} disabled={saving || !form.property_id} style={{ ...btnStyle, opacity: saving || !form.property_id ? 0.6 : 1 }}>
        {saving ? "Creating..." : "Create Task"}
      </button>
    </Modal>
  );
}

function CreatePropertyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    address: "",
    suburb: "",
    beds: "",
    baths: "",
    owner_name: "",
    owner_email: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.createProperty({
        name: form.name,
        address: form.address || undefined,
        suburb: form.suburb || undefined,
        beds: form.beds ? Number(form.beds) : undefined,
        baths: form.baths ? Number(form.baths) : undefined,
        owner_name: form.owner_name || undefined,
        owner_email: form.owner_email || undefined,
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Property" onClose={onClose}>
      <label style={labelStyle}>Name *</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} placeholder="Beach House Mornington" />

      <label style={labelStyle}>Address</label>
      <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={inputStyle} />

      <label style={labelStyle}>Suburb</label>
      <input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} style={inputStyle} />

      <div style={{ display: "flex", gap: 12 }}>
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

function AddCleanerModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", phone: "", language: "en" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.createUser({
        name: form.name,
        phone: form.phone || undefined,
        role: "cleaner",
        language: form.language,
      });
      onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Cleaner" onClose={onClose}>
      <label style={labelStyle}>Name *</label>
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />

      <label style={labelStyle}>Phone</label>
      <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inputStyle} placeholder="+61 4XX XXX XXX" />

      <label style={labelStyle}>Language</label>
      <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} style={inputStyle}>
        <option value="en">English</option>
        <option value="mn">Mongolian</option>
      </select>

      <button onClick={submit} disabled={saving || !form.name} style={{ ...btnStyle, opacity: saving || !form.name ? 0.6 : 1 }}>
        {saving ? "Adding..." : "Add Cleaner"}
      </button>
    </Modal>
  );
}
