import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteDesignerSketch,
  downloadDesignerPdf,
  generateDesignerSketch,
  getDesignerProject,
  toggleApproveSketch,
  DesignerProjectDetail,
  DesignerSketchItem,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";

type GenStep = "idle" | "analyzing" | "generating" | "done" | "error";

const STEP_LABELS: Record<string, string> = {
  analyzing: "🔍 מנתח את החדר...",
  generating: "🎨 מייצר סקיצה...",
};

export default function DesignerProject() {
  const { id } = useParams<{ id: string }>();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<DesignerProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<GenStep>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sketchNotes, setSketchNotes] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    load();
  }, [isLoggedIn, id]);

  async function load() {
    setLoading(true);
    try {
      const p = await getDesignerProject(Number(id));
      setProject(p);
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrorMsg(null);
  }

  async function handleGenerate() {
    if (!photo || !project) return;
    setStep("analyzing");
    setErrorMsg(null);
    try {
      setStep("generating");
      const sketch = await generateDesignerSketch(project.id, photo, sketchNotes);
      setProject(p => p ? { ...p, sketches: [...p.sketches, sketch] } : p);
      setPhoto(null);
      setPreviewUrl(null);
      setSketchNotes("");
      if (fileRef.current) fileRef.current.value = "";
      setStep("done");
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.detail || "שגיאה ביצירת הסקיצה");
      setStep("error");
    }
  }

  async function handleApprove(sketchId: number) {
    const updated = await toggleApproveSketch(sketchId);
    setProject(p =>
      p ? {
        ...p,
        sketches: p.sketches.map(s => s.id === sketchId ? updated : s),
        approved_count: p.sketches.filter(s =>
          s.id === sketchId ? updated.approved : s.approved
        ).length,
      } : p
    );
  }

  async function handleDeleteSketch(sketchId: number) {
    if (!confirm("למחוק את הסקיצה?")) return;
    await deleteDesignerSketch(sketchId);
    setProject(p =>
      p ? { ...p, sketches: p.sketches.filter(s => s.id !== sketchId) } : p
    );
  }

  async function handlePdf() {
    if (!project) return;
    setPdfLoading(true);
    try {
      await downloadDesignerPdf(project.id, project.client_name);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "שגיאה ביצירת PDF");
    } finally {
      setPdfLoading(false);
    }
  }

  const isGenerating = step === "analyzing" || step === "generating";
  const approvedSketches = project?.sketches.filter(s => s.approved) ?? [];
  const allSketches = project ? [...project.sketches].reverse() : [];

  if (loading) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">טוען...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-400">הפרויקט לא נמצא</p>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/designer")}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            ← חזרה לפרויקטים
          </button>
          {approvedSketches.length > 0 && (
            <button
              onClick={handlePdf}
              disabled={pdfLoading}
              className="bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {pdfLoading ? "מייצר..." : "📄 הפקת מצגת PDF"}
              {!pdfLoading && (
                <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">
                  {approvedSketches.length}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Project info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{project.client_name}</h1>
              <p className="text-slate-500 mt-0.5">{project.room_type}</p>
            </div>
            <div className="text-left">
              <div className="text-xs text-slate-400">
                {new Date(project.created_at).toLocaleDateString("he-IL")}
              </div>
              <div className="mt-1 flex gap-1.5">
                <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">
                  {project.sketches.length} סקיצות
                </span>
                {approvedSketches.length > 0 && (
                  <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    {approvedSketches.length} מאושרות
                  </span>
                )}
              </div>
            </div>
          </div>
          {project.notes && (
            <p className="text-slate-500 text-sm mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
              {project.notes}
            </p>
          )}
        </div>

        {/* Generate form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-5">
          <h2 className="font-bold text-slate-700 mb-4">יצירת סקיצה חדשה</h2>

          {/* Photo upload */}
          <div
            onClick={() => !isGenerating && fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors mb-3 ${
              previewUrl
                ? "border-amber-300 bg-amber-50"
                : "border-slate-200 hover:border-amber-300 hover:bg-amber-50"
            } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="תצוגה מקדימה"
                className="max-h-48 mx-auto rounded-xl object-contain"
              />
            ) : (
              <div>
                <div className="text-3xl mb-2">📸</div>
                <p className="text-slate-500 text-sm">לחץ להעלאת תמונת החדר</p>
                <p className="text-slate-400 text-xs mt-1">PNG, JPG, HEIC עד 50MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />

          {/* Notes */}
          <textarea
            placeholder="דגשים לסקיצה זו (אופציונלי): צבע, חומרים, רהיטים ספציפיים..."
            value={sketchNotes}
            onChange={e => setSketchNotes(e.target.value)}
            disabled={isGenerating}
            className="w-full border border-slate-200 rounded-xl p-3 text-right text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none h-20 disabled:opacity-50 mb-3"
          />

          {/* Generate button */}
          {isGenerating ? (
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <div className="inline-block w-6 h-6 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-amber-700 font-medium text-sm">
                {STEP_LABELS[step] || "מעבד..."}
              </p>
              <p className="text-amber-500 text-xs mt-1">זה לוקח כ-30-60 שניות</p>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!photo}
              className="w-full bg-amber-700 text-white py-3 rounded-xl font-medium hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ✨ צור סקיצה
            </button>
          )}

          {errorMsg && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 text-center">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Sketches list */}
        {allSketches.length > 0 && (
          <div>
            <h2 className="font-bold text-slate-700 mb-3">
              כל הסקיצות ({allSketches.length})
            </h2>
            <div className="space-y-4">
              {allSketches.map((sketch, idx) => (
                <SketchCard
                  key={sketch.id}
                  sketch={sketch}
                  index={project.sketches.length - idx}
                  onApprove={handleApprove}
                  onDelete={handleDeleteSketch}
                />
              ))}
            </div>
          </div>
        )}

        {allSketches.length === 0 && !isGenerating && (
          <div className="text-center py-10 text-slate-400">
            <p>העלה תמונה וצור את הסקיצה הראשונה</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SketchCard({
  sketch,
  index,
  onApprove,
  onDelete,
}: {
  sketch: DesignerSketchItem;
  index: number;
  onApprove: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border transition-all ${
      sketch.approved
        ? "border-green-300 ring-2 ring-green-100"
        : "border-slate-100"
    }`}>
      {/* Approved badge */}
      {sketch.approved && (
        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-t-2xl text-center">
          ✓ מאושרת — תופיע במצגת
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-slate-600">סקיצה #{index}</span>
          <span className="text-xs text-slate-400">
            {new Date(sketch.created_at).toLocaleDateString("he-IL")}
          </span>
        </div>

        {/* Image */}
        <div className="relative bg-slate-100 rounded-xl overflow-hidden mb-3" style={{ minHeight: 200 }}>
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <img
            src={sketch.image_url}
            alt={`סקיצה #${index}`}
            onLoad={() => setImgLoaded(true)}
            className={`w-full object-cover transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>

        {/* Notes */}
        {sketch.notes && (
          <p className="text-slate-600 text-sm bg-slate-50 rounded-xl p-3 mb-3 border border-slate-100">
            <span className="font-medium text-slate-500">דגשים: </span>
            {sketch.notes}
          </p>
        )}

        {/* Analysis toggle */}
        {sketch.analysis && (
          <div className="mb-3">
            <button
              onClick={() => setShowAnalysis(v => !v)}
              className="text-xs text-amber-700 hover:text-amber-800 font-medium"
            >
              {showAnalysis ? "▲ הסתר ניתוח חדר" : "▼ הצג ניתוח חדר ומידות"}
            </button>
            {showAnalysis && (
              <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-100 whitespace-pre-line leading-relaxed">
                {sketch.analysis}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(sketch.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              sketch.approved
                ? "bg-green-100 text-green-700 hover:bg-green-200"
                : "bg-amber-700 text-white hover:bg-amber-800"
            }`}
          >
            {sketch.approved ? "✓ מאושרת — בטל אישור" : "אשר לסקיצה הסופית"}
          </button>
          <button
            onClick={() => onDelete(sketch.id)}
            className="px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}
