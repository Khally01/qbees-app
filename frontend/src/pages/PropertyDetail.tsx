import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Home, Key, Sparkles, Clock, Wifi, Car, MapPin, User, Edit2 } from "lucide-react";
import { api, Property } from "../lib/api";
import { useAuth } from "../lib/auth";

interface TaskSummary {
  id: string;
  name: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed_at: string | null;
}

const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400", assigned: "bg-blue-400", accepted: "bg-purple-400",
  in_progress: "bg-sky-500", completed: "bg-emerald-500", cancelled: "bg-gray-400",
};

export function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [recentTasks, setRecentTasks] = useState<TaskSummary[]>([]);
  const [stats, setStats] = useState({ total_tasks: 0, completed_tasks: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"details" | "access" | "cleaning" | "history">("details");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getPropertyDetail(id)
      .then((data) => {
        setProperty(data.property);
        setRecentTasks(data.recent_tasks);
        setStats(data.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-qbees-accent">Loading...</div>;
  if (!property) return <div className="p-6 text-qbees-accent">Property not found</div>;

  const tabs = [
    { key: "details", label: "Details", icon: Home },
    { key: "access", label: "Access", icon: Key },
    { key: "cleaning", label: "Cleaning", icon: Sparkles },
    { key: "history", label: "History", icon: Clock },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-qbees-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/properties")} className="bg-transparent border-0 cursor-pointer text-qbees-accent hover:text-qbees-dark">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-qbees-dark">{property.name}</h1>
            {property.address && (
              <p className="text-sm text-qbees-accent flex items-center gap-1 mt-0.5">
                <MapPin size={13} /> {property.address}{property.suburb ? `, ${property.suburb}` : ""}
              </p>
            )}
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
            property.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}>
            {property.status}
          </span>
        </div>

        {/* Stats strip */}
        <div className="flex gap-4 mb-3">
          <div className="text-center">
            <div className="text-lg font-bold text-qbees-dark">{stats.total_tasks}</div>
            <div className="text-[10px] text-qbees-accent uppercase">Total Jobs</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">{stats.completed_tasks}</div>
            <div className="text-[10px] text-qbees-accent uppercase">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-qbees-dark">
              {property.bedrooms || property.beds || "—"}BR / {property.bathrooms || property.baths || "—"}BA
            </div>
            <div className="text-[10px] text-qbees-accent uppercase">Size</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-qbees-border -mb-3 -mx-4 md:-mx-6 px-4 md:px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-0 bg-transparent cursor-pointer transition-colors ${
                tab === t.key
                  ? "text-qbees-dark border-b-2 border-b-qbees-gold -mb-px"
                  : "text-qbees-accent hover:text-qbees-dark"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        {tab === "details" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Property Info">
              <Field label="Type" value={property.property_type} />
              <Field label="Bedrooms" value={property.bedrooms || property.beds} />
              <Field label="Bathrooms" value={property.bathrooms || property.baths} />
              <Field label="Living Areas" value={property.living_areas} />
              <Field label="Breezeway ID" value={property.breezeway_id} />
            </InfoCard>
            <InfoCard title="Owner">
              <Field label="Name" value={property.owner_name} />
              <Field label="Email" value={property.owner_email} />
              <Field label="Phone" value={property.owner_phone} />
            </InfoCard>
            {property.notes && (
              <div className="md:col-span-2">
                <InfoCard title="Notes">
                  <p className="text-sm text-qbees-dark whitespace-pre-wrap">{property.notes}</p>
                </InfoCard>
              </div>
            )}
          </div>
        )}

        {tab === "access" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoCard title="Access">
              <Field label="Method" value={property.access_method} />
              <Field label="Code / Instructions" value={property.access_code} />
            </InfoCard>
            <InfoCard title="Wi-Fi">
              <Field label="Network" value={property.wifi_name} icon={<Wifi size={14} className="text-qbees-accent" />} />
              <Field label="Password" value={property.wifi_password} mono />
            </InfoCard>
            {property.parking_instructions && (
              <div className="md:col-span-2">
                <InfoCard title="Parking">
                  <div className="flex items-start gap-2">
                    <Car size={14} className="text-qbees-accent mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-qbees-dark whitespace-pre-wrap">{property.parking_instructions}</p>
                  </div>
                </InfoCard>
              </div>
            )}
          </div>
        )}

        {tab === "cleaning" && (
          <div className="space-y-4">
            <InfoCard title="Cleaning Instructions">
              {property.cleaning_instructions ? (
                <p className="text-sm text-qbees-dark whitespace-pre-wrap">{property.cleaning_instructions}</p>
              ) : (
                <p className="text-sm text-qbees-accent italic">No cleaning instructions set</p>
              )}
            </InfoCard>

            <InfoCard title="Consumables">
              {property.consumables && property.consumables.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {property.consumables.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-qbees-bg rounded-lg px-3 py-2">
                      <span className="text-sm">{c.name}</span>
                      <span className="text-sm font-semibold text-qbees-dark">{c.qty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-qbees-accent italic">No consumables configured</p>
              )}
            </InfoCard>
          </div>
        )}

        {tab === "history" && (
          <div className="bg-white rounded-lg border border-qbees-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-qbees-border bg-qbees-bg/50">
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-qbees-accent uppercase">Status</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-qbees-accent uppercase">Date</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-qbees-accent uppercase hidden md:table-cell">Time</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-qbees-accent uppercase">Job</th>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-qbees-accent uppercase hidden md:table-cell">Completed</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-qbees-accent">No jobs yet</td></tr>
                ) : (
                  recentTasks.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/jobs/${t.id}`)}
                      className="border-b border-qbees-border/30 cursor-pointer hover:bg-qbees-cream/50"
                    >
                      <td className="px-3 py-2.5">
                        <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[t.status] || "bg-gray-400"}`} />
                      </td>
                      <td className="px-3 py-2.5">{t.scheduled_date}</td>
                      <td className="px-3 py-2.5 text-qbees-accent hidden md:table-cell">{t.scheduled_time?.slice(0, 5) || "—"}</td>
                      <td className="px-3 py-2.5 font-medium">{t.name}</td>
                      <td className="px-3 py-2.5 text-qbees-accent hidden md:table-cell">
                        {t.completed_at ? new Date(t.completed_at).toLocaleDateString("en-AU") : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Helper components --- */
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-qbees-border p-4">
      <h3 className="text-sm font-bold text-qbees-dark mb-3 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, icon, mono }: { label: string; value: any; icon?: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-qbees-border/30 last:border-0">
      <span className="text-sm text-qbees-accent flex items-center gap-1.5">{icon}{label}</span>
      <span className={`text-sm font-medium text-qbees-dark ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </span>
    </div>
  );
}
