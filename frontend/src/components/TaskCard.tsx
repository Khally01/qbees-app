import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Camera, Users } from "lucide-react";
import { Task } from "../lib/api";
import { StatusBadge } from "./StatusBadge";

export function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        cursor: "pointer",
        border: task.status === "in_progress" ? "2px solid #f97316" : "1px solid #e5e7eb",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{task.name}</h3>
        <StatusBadge status={task.status} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 14, marginBottom: 4 }}>
        <MapPin size={14} />
        <span>{task.property_name || "Unknown property"}</span>
      </div>

      {task.scheduled_time && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b7280", fontSize: 14, marginBottom: 4 }}>
          <Clock size={14} />
          <span>{task.scheduled_time}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
        {task.assignments.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#6b7280", fontSize: 13 }}>
            <Users size={14} />
            <span>{task.assignments.map((a) => a.user_name || "Unknown").join(", ")}</span>
          </div>
        )}
        {task.photo_count > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#6b7280", fontSize: 13 }}>
            <Camera size={14} />
            <span>{task.photo_count}</span>
          </div>
        )}
      </div>
    </div>
  );
}
