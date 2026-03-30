import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Home, X } from "lucide-react";
import { api, Property } from "../lib/api";
import { DataTable, Column } from "../components/ui/DataTable";
import { useAuth } from "../lib/auth";

export function Properties() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreate, setShowCreate] = useState(false);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const data = await api.listProperties({
        status: statusFilter || undefined,
        search: search || undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, [statusFilter, sortBy, sortDir]);
  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [search]);

  const columns: Column<Property>[] = [
    {
      key: "name",
      label: "Property",
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-qbees-bg flex items-center justify-center flex-shrink-0">
            <Home size={14} className="text-qbees-accent" />
          </div>
          <div>
            <div className="font-semibold text-qbees-dark">{row.name}</div>
            {row.address && <div className="text-xs text-qbees-accent truncate max-w-[250px]">{row.address}</div>}
          </div>
        </div>
      ),
    },
    {
      key: "suburb",
      label: "Suburb",
      sortable: true,
      render: (row) => <span className="text-sm">{row.suburb || "—"}</span>,
      hideOnMobile: true,
    },
    {
      key: "beds",
      label: "Beds/Baths",
      width: "100px",
      render: (row) => (
        <span className="text-sm text-qbees-accent">
          {row.bedrooms || row.beds || "—"}BR / {row.bathrooms || row.baths || "—"}BA
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "property_type",
      label: "Type",
      width: "100px",
      render: (row) => (
        <span className="text-sm capitalize">{row.property_type || "—"}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "owner_name",
      label: "Owner",
      render: (row) => (
        <div className="text-sm">
          <div>{row.owner_name || "—"}</div>
          {row.owner_email && <div className="text-xs text-qbees-accent">{row.owner_email}</div>}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: "status",
      label: "Status",
      width: "90px",
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
          row.status === "active"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-gray-100 text-gray-500"
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "access_method",
      label: "Access",
      width: "90px",
      render: (row) => (
        <span className="text-xs text-qbees-accent capitalize">{row.access_method || "—"}</span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-qbees-border px-4 py-3 md:px-6">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-qbees-dark">Properties</h1>
          {isAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-qbees-dark text-qbees-gold rounded-lg text-sm font-semibold cursor-pointer border-0 hover:bg-qbees-dark/90"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Property</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-qbees-accent" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-qbees-border bg-white outline-none focus:border-qbees-accent"
            />
          </div>

          {["", "active", "inactive"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                statusFilter === s
                  ? "bg-qbees-dark text-qbees-gold border-qbees-dark"
                  : "bg-white text-qbees-accent border-qbees-border hover:border-qbees-accent"
              }`}
            >
              {s === "" ? `All (${properties.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <DataTable
          columns={columns}
          data={properties}
          keyField="id"
          onRowClick={(row) => navigate(`/properties/${row.id}`)}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={(key, dir) => { setSortBy(key); setSortDir(dir); }}
          loading={loading}
          emptyMessage="No properties found"
        />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreatePropertyModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchProperties(); }}
        />
      )}
    </div>
  );
}

function CreatePropertyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: "", address: "", suburb: "", property_type: "apartment",
    bedrooms: "", bathrooms: "", beds: "", baths: "",
    owner_name: "", owner_email: "", owner_phone: "",
    access_method: "", access_code: "", wifi_name: "", wifi_password: "",
    parking_instructions: "", cleaning_instructions: "", notes: "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await api.createProperty({
        name: form.name,
        address: form.address || undefined,
        suburb: form.suburb || undefined,
        property_type: form.property_type || undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
        beds: form.beds ? Number(form.beds) : undefined,
        baths: form.baths ? Number(form.baths) : undefined,
        owner_name: form.owner_name || undefined,
        owner_email: form.owner_email || undefined,
        owner_phone: form.owner_phone || undefined,
        access_method: form.access_method || undefined,
        access_code: form.access_code || undefined,
        wifi_name: form.wifi_name || undefined,
        wifi_password: form.wifi_password || undefined,
        parking_instructions: form.parking_instructions || undefined,
        cleaning_instructions: form.cleaning_instructions || undefined,
        notes: form.notes || undefined,
      });
      onCreated();
    } catch (err) { console.error(err); } finally { setSaving(false); }
  };

  const inp = "w-full px-3 py-2 rounded-lg border border-qbees-border text-sm outline-none focus:border-qbees-accent";
  const lbl = "block text-sm font-semibold text-qbees-dark mb-1";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-qbees-dark">Add Property</h2>
          <button onClick={onClose} className="bg-transparent border-0 cursor-pointer text-qbees-accent"><X size={22} /></button>
        </div>

        <label className={lbl}>Name *</label>
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inp} mb-3`} placeholder="Beach House St Kilda" />

        <label className={lbl}>Address</label>
        <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={`${inp} mb-3`} />

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className={lbl}>Suburb</label>
            <input value={form.suburb} onChange={(e) => setForm({ ...form, suburb: e.target.value })} className={inp} />
          </div>
          <div className="flex-1">
            <label className={lbl}>Type</label>
            <select value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} className={inp}>
              <option value="apartment">Apartment</option>
              <option value="house">House</option>
              <option value="townhouse">Townhouse</option>
              <option value="studio">Studio</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1"><label className={lbl}>Bedrooms</label><input type="number" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} className={inp} /></div>
          <div className="flex-1"><label className={lbl}>Bathrooms</label><input type="number" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} className={inp} /></div>
        </div>

        <label className={lbl}>Access Method</label>
        <div className="flex gap-3 mb-3">
          <select value={form.access_method} onChange={(e) => setForm({ ...form, access_method: e.target.value })} className={`${inp} flex-1`}>
            <option value="">Select...</option>
            <option value="lockbox">Lockbox</option>
            <option value="smart_lock">Smart Lock</option>
            <option value="key_safe">Key Safe</option>
            <option value="concierge">Concierge</option>
            <option value="other">Other</option>
          </select>
          <input value={form.access_code} onChange={(e) => setForm({ ...form, access_code: e.target.value })} className={`${inp} flex-1`} placeholder="Code / instructions" />
        </div>

        <div className="flex gap-3 mb-3">
          <div className="flex-1"><label className={lbl}>Wi-Fi Name</label><input value={form.wifi_name} onChange={(e) => setForm({ ...form, wifi_name: e.target.value })} className={inp} /></div>
          <div className="flex-1"><label className={lbl}>Wi-Fi Password</label><input value={form.wifi_password} onChange={(e) => setForm({ ...form, wifi_password: e.target.value })} className={inp} /></div>
        </div>

        <label className={lbl}>Owner Name</label>
        <input value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} className={`${inp} mb-3`} />
        <div className="flex gap-3 mb-3">
          <div className="flex-1"><label className={lbl}>Owner Email</label><input type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} className={inp} /></div>
          <div className="flex-1"><label className={lbl}>Owner Phone</label><input type="tel" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} className={inp} /></div>
        </div>

        <label className={lbl}>Parking Instructions</label>
        <textarea value={form.parking_instructions} onChange={(e) => setForm({ ...form, parking_instructions: e.target.value })} rows={2} className={`${inp} mb-3 resize-y`} />

        <label className={lbl}>Cleaning Instructions</label>
        <textarea value={form.cleaning_instructions} onChange={(e) => setForm({ ...form, cleaning_instructions: e.target.value })} rows={3} className={`${inp} mb-4 resize-y`} placeholder="Special instructions for cleaners..." />

        <button onClick={submit} disabled={saving || !form.name} className="w-full py-3 bg-qbees-dark text-qbees-gold rounded-lg font-bold text-sm cursor-pointer border-0 disabled:opacity-50">
          {saving ? "Saving..." : "Add Property"}
        </button>
      </div>
    </div>
  );
}
