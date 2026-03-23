import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Clock, Camera, CheckCircle } from "lucide-react";
import { api, Task, Photo } from "../lib/api";
import { StatusBadge } from "../components/StatusBadge";
import { PhotoCapture } from "../components/PhotoCapture";
import { useAuth } from "../lib/auth";

export function TaskDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<Task | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    try {
      const [taskData, photoData] = await Promise.all([
        api.getTask(id),
        api.listTaskPhotos(id),
      ]);
      setTask(taskData);
      setPhotos(photoData);
    } catch (err) {
      console.error("Failed to fetch task:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleStatusUpdate = async (status: string) => {
    if (!task) return;
    setActionLoading(true);
    try {
      const updated = await api.updateTaskStatus(task.id, status);
      setTask(updated);
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignmentResponse = async (assignmentId: string, status: string) => {
    if (!task) return;
    setActionLoading(true);
    try {
      await api.respondToAssignment(task.id, assignmentId, status);
      await fetchTask();
    } catch (err) {
      console.error("Assignment response failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 100 }}>
        {t("common.loading")}
      </div>
    );
  }

  if (!task) {
    return <div style={{ padding: 24 }}>Task not found</div>;
  }

  // Find current user's assignment
  const myAssignment = task.assignments.find((a) => a.user_id === user?.id);

  return (
    <div style={{ minHeight: "100vh", background: "#FAF3E4" }}>
      {/* Header */}
      <div
        style={{
          background: "#2D2A24",
          padding: "16px",
          paddingTop: "max(16px, env(safe-area-inset-top))",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#FAF3E4" }}
        >
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#FAF3E4" }}>{task.name}</h1>
        </div>
        <StatusBadge status={task.status} />
      </div>

      <div style={{ padding: 16 }}>
        {/* Property info */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <MapPin size={18} color="#6b7280" />
            <span style={{ fontWeight: 600 }}>{task.property_name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6b7280", fontSize: 14 }}>
            <Clock size={16} />
            <span>
              {task.scheduled_date}
              {task.scheduled_time && ` at ${task.scheduled_time}`}
            </span>
          </div>
          {task.notes && (
            <div style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8, fontSize: 14 }}>
              <strong>{t("tasks.notes")}:</strong> {task.notes}
            </div>
          )}
        </div>

        {/* Assignment actions */}
        {myAssignment && myAssignment.status === "pending" && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <p style={{ margin: "0 0 12px", fontWeight: 600 }}>You've been assigned this task</p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => handleAssignmentResponse(myAssignment.id, "accepted")}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: 12,
                  background: "#22c55e",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {t("tasks.accept")}
              </button>
              <button
                onClick={() => handleAssignmentResponse(myAssignment.id, "declined")}
                disabled={actionLoading}
                style={{
                  flex: 1,
                  padding: 12,
                  background: "#ef4444",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {t("tasks.decline")}
              </button>
            </div>
          </div>
        )}

        {/* Status action buttons */}
        {(task.status === "accepted" || task.status === "assigned") && (
          <button
            onClick={() => handleStatusUpdate("in_progress")}
            disabled={actionLoading}
            style={{
              width: "100%",
              padding: 16,
              background: "#DAC694",
              color: "#2D2A24",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 16,
            }}
          >
            {t("tasks.start")}
          </button>
        )}

        {task.status === "in_progress" && (
          <button
            onClick={() => handleStatusUpdate("completed")}
            disabled={actionLoading}
            style={{
              width: "100%",
              padding: 16,
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: "pointer",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <CheckCircle size={20} />
            {t("tasks.complete")}
          </button>
        )}

        {/* Photos section */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Camera size={18} />
            {t("tasks.photos")} ({photos.length})
          </h3>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                marginBottom: 12,
              }}
            >
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.thumbnail_url || photo.url}
                  alt=""
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ))}
            </div>
          )}

          {/* Upload button (only for active tasks) */}
          {["in_progress", "accepted", "assigned"].includes(task.status) && (
            <PhotoCapture taskId={task.id} onUploaded={fetchTask} />
          )}
        </div>

        {/* Assigned cleaners */}
        {task.assignments.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 16,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3 style={{ margin: "0 0 12px" }}>Assigned</h3>
            {task.assignments.map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f3f4f6",
                }}
              >
                <span style={{ fontWeight: 500 }}>{a.user_name}</span>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
