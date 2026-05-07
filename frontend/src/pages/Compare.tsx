import { useState } from "react";
import { CompareResultItem, StylesData, compareStyles, fetchStyles } from "../api/client";
import Header from "../components/Header";
import { useEffect } from "react";

const ROOM_TYPES: Record<string, string> = {
  living_room: "סלון",
  bedroom: "חדר שינה",
  kitchen: "מטבח",
  bathroom: "חדר אמבטיה",
  office: "חדר עבודה",
  dining_room: "חדר אוכל",
  kids_room: "חדר ילדים",
  balcony: "מרפסת",
};

export default function Compare() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState("living_room");
  const [budget, setBudget] = useState(15000);
  const [stylesData, setStylesData] = useState<StylesData | null>(null);
  const [selected, setSelected] = useState<string[]>(["modern", "scandinavian", "industrial", "bohemian"]);
  const [results, setResults] = useState<CompareResultItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStyles().then(setStylesData).catch(console.error);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  }

  function toggleStyle(key: string) {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  async function handleSubmit() {
    if (!file || selected.length < 2) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const base64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const comma = result.indexOf(",");
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const data = await compareStyles({
        room_type: roomType,
        styles: selected,
        budget_nis: budget,
        image_base64: base64,
      });
      setResults(data.results);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "השוואה נכשלה");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold text-slate-800 text-center">📊 השוואת סגנונות</h1>

        <div className="card space-y-6">
          {/* Upload */}
          <div>
            <h2 className="font-bold mb-3">📸 תמונת החדר</h2>
            <input type="file" accept="image/*" onChange={handleFileChange} className="text-sm" />
            {previewUrl && (
              <img src={previewUrl} alt="preview" className="mt-3 h-40 rounded-xl object-cover" />
            )}
          </div>

          {/* Room type */}
          <div>
            <h2 className="font-bold mb-3">🏠 סוג המרחב</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(ROOM_TYPES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setRoomType(key)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all
                    ${roomType === key ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Style selection */}
          {stylesData && (
            <div>
              <h2 className="font-bold mb-3">🎨 סגנונות להשוואה (בחר 2-5)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(stylesData.styles).map(([key, info]) => (
                  <button
                    key={key}
                    onClick={() => toggleStyle(key)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all
                      ${selected.includes(key) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                  >
                    {info.emoji} {info.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-2">נבחרו: {selected.length} סגנונות</p>
            </div>
          )}

          {/* Budget */}
          <div>
            <h2 className="font-bold mb-2">💰 תקציב: ₪{budget.toLocaleString("he-IL")}</h2>
            <input
              type="range"
              min={2000}
              max={200000}
              step={1000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !file || selected.length < 2}
            className="btn-primary w-full py-4 text-lg"
          >
            {loading ? `מייצר ${selected.length} עיצובים במקביל...` : "✨ השווה סגנונות"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2">
              ⚠️ {error}
            </div>
          )}
        </div>

        {results && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">תוצאות ההשוואה</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {results.map((r) => (
                <div key={r.style} className="card p-0 overflow-hidden">
                  <div className="bg-brand-50 px-4 py-2 font-semibold text-brand-700">
                    {r.style_label}
                  </div>
                  <img src={r.redesign_image_url} alt={r.style_label} className="w-full h-64 object-cover" />
                  <div className="p-4">
                    <p className="text-sm text-slate-600">{r.analysis}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
