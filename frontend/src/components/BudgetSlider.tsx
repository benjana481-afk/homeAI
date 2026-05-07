interface Props {
  value: number;
  onChange: (v: number) => void;
}

const PRESETS = [2000, 5000, 10000, 20000, 50000];

export default function BudgetSlider({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">תקציב</span>
        <span className="font-bold text-brand-600 text-lg">
          ₪{value.toLocaleString("he-IL")}
        </span>
      </div>

      <input
        type="range"
        min={500}
        max={100000}
        step={500}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-brand-600"
      />

      <div className="flex gap-2 flex-wrap">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className={`text-xs px-3 py-1 rounded-full border transition-all
              ${value === preset
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-400"
              }`}
          >
            ₪{preset.toLocaleString("he-IL")}
          </button>
        ))}
      </div>
    </div>
  );
}
