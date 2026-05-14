import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createDesignerProject,
  deleteDesignerProject,
  listDesignerProjects,
  DesignerProjectSummary,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function DesignerProjects() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<DesignerProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ client_name: "", room_type: "", notes: "" });

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    load();
  }, [isLoggedIn]);

  async function load() {
    setLoading(true);
    try {
      setProjects(await listDesignerProjects());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const p = await createDesignerProject(form.client_name, form.room_type, form.notes);
      navigate(`/designer/${p.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    if (!confirm("למחוק את הפרויקט וכל הסקיצות שלו?")) return;
    await deleteDesignerProject(id);
    setProjects(ps => ps.filter(p => p.id !== id));
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-700 rounded-xl flex items-center justify-center text-white text-lg font-bold">
            D
          </div>
          <div>
            <h1 className="font-bold text-xl text-slate-800">Designer Studio</h1>
            <p className="text-xs text-slate-400">ניהול פרויקטים ולקוחות</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/app")}
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← HomAI
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* New project button */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-semibold text-slate-700">הפרויקטים שלי</h2>
          <button
            onClick={() => setShowNew(true)}
            className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-800 transition-colors"
          >
            + פרויקט חדש
          </button>
        </div>

        {/* New project modal */}
        {showNew && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold text-slate-800 mb-4">פרויקט חדש</h2>
              <form onSubmit={handleCreate} className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">שם לקוח</label>
                  <input
                    placeholder="כהן שרה"
                    value={form.client_name}
                    onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-3 text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">סוג חדר</label>
                  <input
                    placeholder="סלון, מטבח, חדר שינה, גינה..."
                    value={form.room_type}
                    onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-3 text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">דגשים כלליים לפרויקט (אופציונלי)</label>
                  <textarea
                    placeholder="מה חשוב ללקוח? סגנון, תקציב, העדפות..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl p-3 text-right focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-24"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-amber-700 text-white py-3 rounded-xl font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors"
                  >
                    {creating ? "יוצר..." : "צור פרויקט"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNew(false)}
                    className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Projects list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">טוען פרויקטים...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏠</div>
            <p className="text-slate-500 mb-2">עדיין אין פרויקטים</p>
            <p className="text-slate-400 text-sm">לחץ על "פרויקט חדש" כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/designer/${p.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow border border-slate-100 active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{p.client_name}</h3>
                    <p className="text-slate-500 text-sm mt-0.5">{p.room_type}</p>
                    {p.notes && (
                      <p className="text-slate-400 text-xs mt-1 truncate">{p.notes}</p>
                    )}
                  </div>
                  <div className="text-left flex-shrink-0">
                    <div className="text-xs text-slate-400">
                      {new Date(p.created_at).toLocaleDateString("he-IL")}
                    </div>
                    <div className="mt-1.5 flex gap-1.5">
                      <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                        {p.total_sketches} סקיצות
                      </span>
                      {p.approved_count > 0 && (
                        <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          {p.approved_count} ✓
                        </span>
                      )}
                    </div>
                    <button
                      onClick={e => handleDelete(e, p.id)}
                      className="mt-2 text-xs text-red-400 hover:text-red-600"
                    >
                      מחק
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
