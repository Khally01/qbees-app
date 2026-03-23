import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, Task } from "../lib/api";
import { TaskCard } from "../components/TaskCard";
import { BottomNav } from "../components/BottomNav";
import { useAuth } from "../lib/auth";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function displayDate(d: Date): string {
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function MyTasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

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

  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(d);
  };

  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(d);
  };

  const isToday = formatDate(date) === formatDate(new Date());

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
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#FAF3E4" }}>
          {t("tasks.title")}
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.8, color: "#FAF3E4" }}>
          {user?.name}
        </p>
      </div>

      {/* Date selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <button onClick={prevDay} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {isToday ? t("tasks.today") : displayDate(date)}
          </div>
          {isToday && <div style={{ fontSize: 13, color: "#6b7280" }}>{displayDate(date)}</div>}
        </div>
        <button onClick={nextDay} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Task list */}
      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#6b7280", paddingTop: 40 }}>
            {t("common.loading")}
          </p>
        ) : tasks.length === 0 ? (
          <p style={{ textAlign: "center", color: "#6b7280", paddingTop: 40 }}>
            {t("tasks.no_tasks")}
          </p>
        ) : (
          tasks.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>

      <BottomNav />
    </div>
  );
}
