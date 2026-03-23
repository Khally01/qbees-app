import { useTranslation } from "react-i18next";

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  assigned: "#DAC694",
  accepted: "#998D6C",
  in_progress: "#f97316",
  completed: "#22c55e",
  cancelled: "#6b7280",
};

export function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const color = STATUS_COLORS[status] || "#6b7280";

  return (
    <span
      style={{
        background: `${color}20`,
        color,
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {t(`tasks.status.${status}`, status)}
    </span>
  );
}
