import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchStyles, generateDesign, generateShopping, StylesData } from "../api/client";
import { hasUsedGuestSlot, markGuestSlotUsed, useAuth } from "../auth/AuthContext";
import BudgetSlider from "../components/BudgetSlider";
import Header from "../components/Header";
import PhotoUploader from "../components/PhotoUploader";
import StylePicker from "../components/StylePicker";

type Step = "idle" | "analyzing" | "generating" | "shopping" | "done" | "error";

const STEP_LABELS: Record<string, string> = {
  analyzing: "🔍 מנתח את החדר שלך...",
  generating: "🎨 מייצר עיצוב חדש עם AI...",
  shopping: "🛍️ בונה רשימת קנייה...",
};

export default function Home() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const guestBlocked = !isLoggedIn && hasUsedGuestSlot();
  const [stylesData, setStylesData] = useState<StylesData | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [roomType, setRoomType] = useState("living_room");
  const [style, setStyle] = useState("modern");
  const [budget, setBudget] = useState(10000);
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStyles().then(setStylesData).catch(console.error);
  }, []);

  const canGenerate = photo && step === "idle" && !guestBlocked;

  async function handleGenerate() {
    if (!photo) return;
    // Guest gate — second design forces registration
    if (guestBlocked) {
      navigate("/register", { state: { from: "/", reason: "guest_limit" } });
      return;
    }
    setError(null);
    try {
      setStep("analyzing");
      const design = await generateDesign(photo, roomType, style, budget);

      setStep("shopping");
      const shopping = await generateShopping(design.design_brief, roomType, style, budget);

      // Mark guest slot consumed (no-op if logged in, but cheap)
      if (!isLoggedIn) markGuestSlotUsed();

      // Convert photo to base64 for "try another style" (images only)
      let imageBase64: string | null = null;
      if (!isVideo) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const comma = result.indexOf(",");
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(photo);
        });
      }

      setStep("done");
      navigate("/result", {
        state: {
          design,
          shopping,
          originalPhoto: previewUrl,
          isVideo,
          photoFile: photo,
          roomType,
          styleKey: style,
          budgetNis: budget,
          imageBase64,
        },
      });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "אירעה שגיאה. נסה שנית.");
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <Header />

      {guestBlocked && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="bg-brand-50 border border-brand-200 text-brand-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-4">
            <span>
              ✨ ניצלת את העיצוב החינמי כאורח. הירשם (חינם!) כדי ליצור עוד עיצובים ולשמור אותם.
            </span>
            <button
              onClick={() => navigate("/register", { state: { from: "/", reason: "guest_limit" } })}
              className="btn-primary text-sm py-2 px-4 whitespace-nowrap"
            >
              הירשם עכשיו
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Right column — Photo upload */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="font-bold text-lg mb-4">📸 צלם את החדר שלך</h2>
              <PhotoUploader
                onPhotoSelected={(file, url, vid) => { setPhoto(file); setPreviewUrl(url); setIsVideo(vid); }}
                previewUrl={previewUrl}
                isVideo={isVideo}
              />
            </div>

            {/* Room type */}
            {stylesData && (
              <div className="card">
                <h2 className="font-bold text-lg mb-4">🏠 סוג המרחב</h2>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stylesData.room_types).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setRoomType(key)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all
                        ${roomType === key
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Left column — Style + Budget + CTA */}
          <div className="space-y-6">
            {stylesData && (
              <div className="card">
                <h2 className="font-bold text-lg mb-4">🎨 סגנון עיצוב</h2>
                <StylePicker styles={stylesData.styles} selected={style} onSelect={setStyle} />
              </div>
            )}

            <div className="card">
              <h2 className="font-bold text-lg mb-4">💰 תקציב</h2>
              <BudgetSlider value={budget} onChange={setBudget} />
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="btn-primary w-full text-lg py-4"
            >
              {step === "idle" || step === "error"
                ? "✨ צור עיצוב חדש"
                : STEP_LABELS[step] ?? "עובד..."}
            </button>

            {/* Loading bar */}
            {["analyzing", "generating", "shopping"].includes(step) && (
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-brand-500 rounded-full animate-pulse"
                  style={{
                    width: step === "analyzing" ? "33%" : step === "generating" ? "66%" : "90%",
                    transition: "width 0.8s ease",
                  }}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            {!photo && (
              <p className="text-center text-slate-400 text-sm">
                העלה תמונה של החדר כדי להתחיל
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
