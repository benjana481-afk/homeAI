import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DesignResult, SaveDesignPayload, ShoppingResult, StylesData, editDesign, fetchStyles, generateDesignBase64, saveDesign } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Header from "../components/Header";
import ShoppingList from "../components/ShoppingList";

interface LocationState {
  design: DesignResult;
  shopping: ShoppingResult;
  originalPhoto: string;
  isVideo?: boolean;
  photoFile?: File;
  fromSaved?: boolean;
  roomType?: string;
  styleKey?: string;
  budgetNis?: number;
  imageBase64?: string | null;
}

// Convert a File to base64 string (without data URL prefix)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const { isLoggedIn } = useAuth();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Edit design (שלב 2)
  const [editPrompt, setEditPrompt] = useState("");
  const [editing, setEditing] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(state?.design.redesign_image_url ?? "");

  // Try another style (שלב 5)
  const [stylesData, setStylesData] = useState<StylesData | null>(null);
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [tryingStyle, setTryingStyle] = useState(false);

  useEffect(() => {
    fetchStyles().then(setStylesData).catch(console.error);
  }, []);

  if (!state) {
    navigate("/");
    return null;
  }

  const { design, shopping, originalPhoto, isVideo, photoFile, fromSaved, roomType, styleKey, budgetNis, imageBase64 } = state;

  async function handleEdit() {
    if (!editPrompt.trim() || !roomType || !styleKey) return;
    setEditing(true);
    try {
      const result = await editDesign({
        redesign_image_url: currentImageUrl,
        edit_prompt: editPrompt,
        style: styleKey,
        room_type: roomType,
      });
      setCurrentImageUrl(result.redesign_image_url);
      setEditPrompt("");
    } catch (err: any) {
      alert("העריכה נכשלה: " + (err?.response?.data?.detail ?? err?.message ?? "שגיאה"));
    } finally {
      setEditing(false);
    }
  }

  async function handleTryStyle(newStyle: string) {
    if (!imageBase64 || !roomType) return;
    setTryingStyle(true);
    setShowStylePicker(false);
    try {
      const result = await generateDesignBase64({
        room_type: roomType,
        style: newStyle,
        budget_nis: budgetNis ?? shopping.budget_nis,
        image_base64: imageBase64,
      });
      setCurrentImageUrl(result.redesign_image_url);
    } catch (err: any) {
      alert("שגיאה: " + (err?.response?.data?.detail ?? err?.message ?? "שגיאה"));
    } finally {
      setTryingStyle(false);
    }
  }

  async function handleSave() {
    if (!isLoggedIn) {
      navigate("/login", { state: { from: "/result" } });
      return;
    }
    if (!photoFile) {
      setSaveError("אין קובץ מקורי לשמור — נסה ליצור עיצוב חדש");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("saving");
    setSaveError(null);
    try {
      const base64 = await fileToBase64(photoFile);
      const payload: SaveDesignPayload = {
        room_type: roomType ?? "",
        style: styleKey ?? "",
        room_label: design.room_label,
        style_label: design.style_label,
        budget_nis: shopping.budget_nis,
        is_video: !!isVideo,
        original_image_base64: base64,
        original_mime_type: photoFile.type || (isVideo ? "video/mp4" : "image/jpeg"),
        redesign_image_url: design.redesign_image_url,
        analysis: design.analysis,
        design_brief: design.design_brief,
        shopping,
      };
      await saveDesign(payload);
      setSaveStatus("saved");
    } catch (e: any) {
      setSaveError(e?.response?.data?.detail ?? "השמירה נכשלה");
      setSaveStatus("error");
    }
  }

  const showSaveButton = !fromSaved;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-800">
            {design.room_label} בסגנון {design.style_label}
          </h2>
          <p className="text-slate-500 mt-2">{design.analysis}</p>
        </div>

        {/* Before / After */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-0 overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
              לפני {isVideo && "🎥"}
            </div>
            {isVideo ? (
              <video
                src={originalPhoto}
                className="w-full h-80 object-cover bg-black"
                controls
                muted
                playsInline
              />
            ) : (
              <img src={originalPhoto} alt="לפני" className="w-full h-80 object-cover" />
            )}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-600">אחרי ✨</div>
            <img src={currentImageUrl} alt="עיצוב AI" className="w-full h-80 object-cover" />
          </div>
        </div>

        {/* Edit design (שלב 2) */}
        <div className="card flex gap-3 items-center flex-wrap">
          <input
            type="text"
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleEdit()}
            placeholder="ערוך את העיצוב: תוסיף צמחים, ספה כחולה, יותר אור..."
            disabled={editing}
            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50"
            dir="rtl"
          />
          <button
            onClick={handleEdit}
            disabled={editing || !editPrompt.trim()}
            className="btn-secondary shrink-0"
          >
            {editing ? "עורך..." : "✏️ ערוך"}
          </button>
          {imageBase64 && (
            <div className="relative">
              <button
                onClick={() => setShowStylePicker(!showStylePicker)}
                disabled={tryingStyle}
                className="btn-secondary shrink-0"
              >
                {tryingStyle ? "מייצר..." : "🎨 נסה סגנון אחר"}
              </button>
              {showStylePicker && stylesData && (
                <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 grid grid-cols-2 gap-2 min-w-[240px]">
                  {Object.entries(stylesData.styles).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => handleTryStyle(key)}
                      className="text-sm text-right px-3 py-2 rounded-xl hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      {info.emoji} {info.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Shopping list */}
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-6">🛍️ רשימת קנייה</h3>
          <ShoppingList shopping={shopping} />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 justify-center items-center pb-8">
          {showSaveButton && (
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              className="btn-primary"
            >
              {saveStatus === "saving" && "שומר..."}
              {saveStatus === "saved" && "✅ נשמר"}
              {(saveStatus === "idle" || saveStatus === "error") && "💾 שמור עיצוב"}
            </button>
          )}
          <button onClick={() => window.print()} className="btn-secondary">
            🖨️ הדפסה / שמירה כ-PDF
          </button>
          <button onClick={() => navigate("/")} className="btn-secondary">
            ✨ עיצוב נוסף
          </button>
        </div>

        {saveStatus === "error" && saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2 max-w-md mx-auto text-center">
            {saveError}
          </div>
        )}
        {saveStatus === "idle" && !isLoggedIn && showSaveButton && (
          <p className="text-center text-sm text-slate-500">
            רוצה לשמור את העיצוב? <button onClick={() => navigate("/login", { state: { from: "/result" } })} className="text-brand-600 font-semibold hover:underline">התחבר</button> או <button onClick={() => navigate("/register", { state: { from: "/result" } })} className="text-brand-600 font-semibold hover:underline">הירשם</button>
          </p>
        )}
      </main>
    </div>
  );
}
