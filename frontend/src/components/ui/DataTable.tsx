import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyField: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string, dir: "asc" | "desc") => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, keyField, sortBy, sortDir, onSort, emptyMessage, loading,
}: Props<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDir = sortBy === key && sortDir === "asc" ? "desc" : "asc";
    onSort(key, newDir);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-qbees-border">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4 p-3 border-b border-qbees-border/50 animate-pulse">
            <div className="h-4 bg-qbees-bg rounded w-1/4" />
            <div className="h-4 bg-qbees-bg rounded w-1/3" />
            <div className="h-4 bg-qbees-bg rounded w-1/5" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-qbees-border overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-qbees-border bg-qbees-bg/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`text-left px-3 py-2.5 text-xs font-semibold text-qbees-accent uppercase tracking-wider whitespace-nowrap ${
                    col.sortable ? "cursor-pointer hover:text-qbees-dark select-none" : ""
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="text-qbees-accent/50">
                        {sortBy === col.key ? (
                          sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-qbees-accent">
                  {emptyMessage || "No data"}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[keyField]}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-qbees-border/30 last:border-0 ${
                    onRowClick ? "cursor-pointer hover:bg-qbees-cream/50 transition-colors" : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 whitespace-nowrap">
                      {col.render ? col.render(row) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-qbees-border/50">
        {data.length === 0 ? (
          <div className="text-center py-12 text-qbees-accent text-sm">
            {emptyMessage || "No data"}
          </div>
        ) : (
          data.map((row) => (
            <div
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={`p-3 ${onRowClick ? "cursor-pointer active:bg-qbees-cream/50" : ""}`}
            >
              {columns.filter((c) => !c.hideOnMobile).slice(0, 5).map((col) => (
                <div key={col.key} className="flex justify-between items-center py-0.5">
                  <span className="text-xs text-qbees-accent">{col.label}</span>
                  <span className="text-sm font-medium text-right">
                    {col.render ? col.render(row) : String(row[col.key] ?? "")}
                  </span>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
