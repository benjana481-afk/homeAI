import { StyleInfo } from "../api/client";

interface Props {
  styles: Record<string, StyleInfo>;
  selected: string;
  onSelect: (key: string) => void;
}

export default function StylePicker({ styles, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(styles).map(([key, info]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`text-right p-3 rounded-xl border-2 transition-all duration-150
            ${selected === key
              ? "border-brand-500 bg-brand-50 shadow-sm"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
            }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{info.emoji}</span>
            <div>
              <p className={`font-semibold text-sm ${selected === key ? "text-brand-700" : "text-slate-700"}`}>
                {info.label}
              </p>
              <p className="text-xs text-slate-400 leading-tight mt-0.5 line-clamp-2">
                {info.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
