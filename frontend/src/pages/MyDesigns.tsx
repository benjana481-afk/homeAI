import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteDesign, getDesign, listMyDesigns, SavedDesignSummary } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Header from "../components/Header";

export default function MyDesigns() {
  const [designs, setDesigns] = useState<SavedDesignSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/my-designs" } });
      return;
    }
    listMyDesigns()
      .then(setDesigns)
      .catch((e) => setError(e?.response?.data?.detail ?? "שגיאה בטעינת העיצובים"));
  }, [isLoggedIn, navigate]);

  const onView = async (id: number) => {
    try {
      const detail = await getDesign(id);
      navigate("/result", {
        state: {
          design: {
            analysis: detail.analysis,
            redesign_image_url: detail.redesign_image_url,
            design_brief: detail.design_brief,
            style_label: detail.style_label,
            room_label: detail.room_label,
          },
          shopping: detail.shopping,
          originalPhoto: detail.original_image_url,
          isVideo: detail.is_video,
          fromSaved: true,
        },
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "שגיאה בטעינת העיצוב");
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("למחוק את העיצוב הזה לצמיתות?")) return;
    try {
      await deleteDesign(id);
      setDesigns((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "המחיקה נכשלה");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-slate-800">🎨 העיצובים שלי</h2>
          <Link to="/" className="btn-primary">✨ עיצוב חדש</Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {designs === null ? (
          <p className="text-slate-500 text-center py-12">טוען...</p>
        ) : designs.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-slate-500 mb-4">עוד אין לך עיצובים שמורים</p>
            <Link to="/" className="btn-primary inline-block">צור את העיצוב הראשון שלך</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((d) => (
              <div key={d.id} className="card p-0 overflow-hidden">
                <div className="grid grid-cols-2 h-44">
                  {d.is_video ? (
                    <video
                      src={d.original_image_url}
                      className="w-full h-full object-cover bg-black"
                      muted
                      playsInline
                    />
                  ) : (
                    <img src={d.original_image_url} alt="לפני" className="w-full h-full object-cover" />
                  )}
                  <img src={d.redesign_image_url} alt="אחרי" className="w-full h-full object-cover" />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-800">
                    {d.room_label} בסגנון {d.style_label}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(d.created_at).toLocaleString("he-IL")} · תקציב {d.budget_nis.toLocaleString("he-IL")} ₪
                  </p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => onView(d.id)} className="btn-secondary text-sm flex-1">
                      👁️ פתח
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
                      className="text-sm text-red-500 hover:text-red-700 px-3 py-2"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
