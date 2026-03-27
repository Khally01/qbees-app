import { ArrowRight } from "lucide-react";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function DateRangePicker({ from, to, onChange }: Props) {
  const today = fmt(new Date());

  const setQuick = (label: string) => {
    const now = new Date();
    if (label === "today") {
      onChange(today, today);
    } else if (label === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() + 1);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      onChange(fmt(start), fmt(end));
    } else if (label === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      onChange(fmt(start), fmt(end));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-white border border-qbees-border rounded-lg px-2 py-1.5">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="border-0 text-sm font-medium text-qbees-dark bg-transparent outline-none w-32"
        />
        <ArrowRight size={14} className="text-qbees-accent mx-1 flex-shrink-0" />
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="border-0 text-sm font-medium text-qbees-dark bg-transparent outline-none w-32"
        />
      </div>
      <div className="flex gap-1">
        {[
          { label: "Today", key: "today" },
          { label: "This Week", key: "week" },
          { label: "This Month", key: "month" },
        ].map((q) => (
          <button
            key={q.key}
            onClick={() => setQuick(q.key)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border cursor-pointer transition-colors ${
              q.key === "today" && from === today && to === today
                ? "bg-qbees-dark text-qbees-gold border-qbees-dark"
                : "bg-white text-qbees-accent border-qbees-border hover:border-qbees-accent"
            }`}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  );
}
