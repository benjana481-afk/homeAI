import { useState } from "react";
import { ShoppingItem, ShoppingResult } from "../api/client";

interface Props {
  shopping: ShoppingResult;
}

const PRIORITY_LABEL: Record<string, string> = {
  essential: "חובה",
  recommended: "מומלץ",
  optional: "אופציונלי",
};

const PRIORITY_COLOR: Record<string, string> = {
  essential: "bg-red-100 text-red-700",
  recommended: "bg-amber-100 text-amber-700",
  optional: "bg-green-100 text-green-700",
};

const CATEGORY_EMOJI: Record<string, string> = {
  furniture: "🛋️",
  lighting: "💡",
  decor: "🖼️",
  textiles: "🧺",
  plants: "🌿",
  storage: "📦",
  tools: "🔧",
};

export default function ShoppingList({ shopping }: Props) {
  const [filter, setFilter] = useState<"all" | "essential" | "recommended" | "optional">("all");

  const filtered = filter === "all" ? shopping.items : shopping.items.filter((i) => i.priority === filter);
  const totalAll = shopping.total_essential + shopping.total_recommended + shopping.total_optional;
  const budgetPercent = Math.min((shopping.total_essential / shopping.budget_nis) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Budget overview */}
      <div className="card">
        <h3 className="font-bold text-lg mb-4">סיכום תקציב</h3>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">תקציב מאושר</span>
            <span className="font-semibold">₪{shopping.budget_nis.toLocaleString("he-IL")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> פריטי חובה</span>
            <span className="font-semibold text-red-600">₪{shopping.total_essential.toLocaleString("he-IL")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> מומלצים</span>
            <span className="font-semibold text-amber-600">₪{shopping.total_recommended.toLocaleString("he-IL")}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> אופציונלי</span>
            <span className="font-semibold text-green-600">₪{shopping.total_optional.toLocaleString("he-IL")}</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${shopping.within_budget ? "bg-brand-500" : "bg-red-500"}`}
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
        <p className={`text-sm mt-2 font-medium ${shopping.within_budget ? "text-brand-600" : "text-red-600"}`}>
          {shopping.within_budget
            ? `✓ פריטי החובה בתקציב (נותר ₪${(shopping.budget_nis - shopping.total_essential).toLocaleString("he-IL")})`
            : `⚠️ פריטי החובה חורגים מהתקציב ב-₪${(shopping.total_essential - shopping.budget_nis).toLocaleString("he-IL")}`}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all", "essential", "recommended", "optional"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${filter === f ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-400"}`}
          >
            {f === "all" ? "הכל" : PRIORITY_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {filtered.map((item, idx) => (
          <div key={idx} className="card flex items-start gap-4 p-4">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 object-cover rounded-xl shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                loading="lazy"
              />
            ) : (
              <div className="text-2xl pt-1">{CATEGORY_EMOJI[item.category] ?? "🛍️"}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${PRIORITY_COLOR[item.priority]}`}>
                  {PRIORITY_LABEL[item.priority]}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={item.store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold px-3 py-1.5 rounded-full border border-brand-200 transition-colors"
                  >
                    🛒 {item.store} ↗
                  </a>
                  <a
                    href={item.google_shopping_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-full border border-slate-200 transition-colors"
                  >
                    🔍 השוואת מחירים
                  </a>
                </div>
                <span className="font-bold text-slate-800">₪{item.estimated_price_nis.toLocaleString("he-IL")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
