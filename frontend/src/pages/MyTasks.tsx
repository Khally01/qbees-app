import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, MapPin, Clock, User, Camera, AlertTriangle } from "lucide-react";
import { api, Task } from "../lib/api";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../lib/auth";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function displayDate(d: Date): string {
  return d.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  pending: { label: "Pending", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
  assigned: { label: "Assigned", bg: "#E8DCC8", color: "#6B5D3E", dot: "#DAC694" },
  accepted: { label: "Accepted", bg: "#E8DCC8", color: "#6B5D3E", dot: "#998D6C" },
  in_progress: { label: "In Progress", bg: "#DBEAFE", color: "#1E40AF", dot: "#3B82F6" },
  completed: { label: "Completed", bg: "#D1FAE5", color: "#065F46", dot: "#10B981" },
  cancelled: { label: "Cancelled", bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF" },
};

export function MyTasks() {
  const { t } = useTranslation();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await api.listTasks({ scheduled_date: formatDate(date) });
      setTasks(data);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [date]);

  const prevDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; });
  const nextDay = () => setDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const goToday = () => setDate(new Date());

  const isToday = formatDate(date) === formatDate(new Date());

  // Filter tasks
  const filtered = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);

  // Group tasks by cleaner (Breezeway style)
  const byAssignee: Record<string, Task[]> = {};
  const unassigned: Task[] = [];
  for (const task of filtered) {
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

  // Stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "completed").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    pending: tasks.filter((t) => ["pending", "assigned", "accepted"].includes(t.status)).length,
    unassigned: tasks.filter((t) => !t.assignments.length).length,
  };

  return (
    <div style={{ paddingBottom: 80, minHeight: "100vh", background: "#F5F0E8" }}>
      {/* Top bar */}
      <div
        style={{
          background: "#2D2A24",
          padding: "12px 16px",
          paddingTop: "max(12px, env(safe-area-inset-top))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <img src="/icon.svg" alt="Qbees" style={{ height: 32 }} />
        <span style={{ color: "#DAC694", fontSize: 14, fontWeight: 500 }}>{user?.name}</span>
      </div>

      {/* Date navigation bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #E8DCC8",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button onClick={prevDay} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
          <ChevronLeft size={20} color="#998D6C" />
        </button>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#2D2A24" }}>
            {displayDate(date)}
          </div>
          {!isToday && (
            <button
              onClick={goToday}
              style={{
                background: "none",
                border: "none",
                color: "#998D6C",
                fontSize: 12,
                cursor: "pointer",
                textDecoration: "underline",
                marginTop: 2,
              }}
            >
              Go to Today
            </button>
          )}
        </div>
        <button onClick={nextDay} style={{ background: "none", border: "none", cursor: "pointer", padding: 6 }}>
          <ChevronRight size={20} color="#998D6C" />
        </button>
      </div>

      {/* Stats bar */}
      <div
        style={{
          display: "flex",
          gap: 1,
          background: "#E8DCC8",
          margin: "0",
        }}
      >
        {[
          { label: "Total", value: stats.total, color: "#2D2A24" },
          { label: "Pending", value: stats.pending, color: "#F59E0B" },
          { label: "Active", value: stats.inProgress, color: "#3B82F6" },
          { label: "Done", value: stats.completed, color: "#10B981" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              background: "#fff",
              padding: "10px 4px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#998D6C", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: "flex",
          gap: 6,
          padding: "12px 16px 8px",
          overflowX: "auto",
        }}
      >
        {[
          { key: "all", label: `All (${tasks.length})` },
          { key: "in_progress", label: `Active (${stats.inProgress})` },
          { key: "pending", label: "Pending" },
          { key: "completed", label: "Completed" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key === filter ? "all" : f.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: filter === f.key ? "none" : "1px solid #E8DCC8",
              background: filter === f.key ? "#2D2A24" : "#fff",
              color: filter === f.key ? "#FAF3E4" : "#998D6C",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task list — grouped by cleaner (Breezeway style) */}
      <div style={{ padding: "8px 16px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", color: "#998D6C", paddingTop: 60 }}>
            <div style={{ fontSize: 14 }}>Loading schedule...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", color: "#998D6C", paddingTop: 60 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>No tasks</div>
            <div style={{ fontSize: 14 }}>No tasks scheduled for this date</div>
          </div>
        ) : (
          <>
            {/* Unassigned tasks warning */}
            {unassigned.length > 0 && (
              <div style={{ marginBottom: 16 }}>
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
                  <AlertTriangle size={16} color="#92400E" />
                  <span style={{ fontWeight: 700, fontSize: 13, color: "#92400E" }}>
                    UNASSIGNED ({unassigned.length})
                  </span>
                </div>
                {unassigned.map((task) => (
                  <ScheduleTaskRow key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                ))}
              </div>
            )}

            {/* Tasks grouped by cleaner */}
            {Object.entries(byAssignee).sort(([a], [b]) => a.localeCompare(b)).map(([name, cleanerTasks]) => (
              <div key={name} style={{ marginBottom: 16 }}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <User size={14} color="#DAC694" />
                    <span style={{ fontWeight: 700, fontSize: 14, color: "#FAF3E4" }}>{name}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "#DAC694", fontWeight: 600 }}>
                    {cleanerTasks.length} job{cleanerTasks.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {cleanerTasks
                  .sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || ""))
                  .map((task) => (
                    <ScheduleTaskRow key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
                  ))}
              </div>
            ))}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function ScheduleTaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;

  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px",
        background: "#fff",
        borderBottom: "1px solid #F0EAD6",
        cursor: "pointer",
      }}
    >
      {/* Status dot */}
      <div
        style={{
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: sc.dot,
          flexShrink: 0,
        }}
      />

      {/* Time */}
      <div style={{ width: 50, flexShrink: 0, textAlign: "center" }}>
        {task.scheduled_time ? (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#2D2A24" }}>
            {task.scheduled_time.slice(0, 5)}
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "#998D6C" }}>No time</span>
        )}
      </div>

      {/* Task info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#2D2A24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {task.property_name || "Unknown Property"}
        </div>
        <div style={{ fontSize: 12, color: "#998D6C", marginTop: 2 }}>
          {task.name}
        </div>
      </div>

      {/* Status badge */}
      <div
        style={{
          padding: "3px 10px",
          borderRadius: 12,
          background: sc.bg,
          fontSize: 11,
          fontWeight: 600,
          color: sc.color,
          whiteSpace: "nowrap",
        }}
      >
        {sc.label}
      </div>

      {/* Photo count */}
      {task.photo_count > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 2, color: "#998D6C" }}>
          <Camera size={14} />
          <span style={{ fontSize: 11 }}>{task.photo_count}</span>
        </div>
      )}
    </div>
  );
}
