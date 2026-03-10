// components/FullScreenLoader.jsx
"use client";

import { useMemo } from "react";

const LOADING_TEXT = {
  en: "Loading prices...",
  fa: "در حال بارگذاری قیمت‌ها...",
  ps: "د بیو لوډېږي...",
};

function resolveLocale() {
  if (typeof window === "undefined") return "fa";

  const saved = localStorage.getItem("qimat_language");
  if (saved === "en" || saved === "fa" || saved === "ps") return saved;

  const docLang = document.documentElement.lang;
  if (docLang === "en" || docLang === "fa" || docLang === "ps") return docLang;

  return "fa";
}

export default function FullScreenLoader() {
  const locale = useMemo(() => resolveLocale(), []);
  const loadingLabel = LOADING_TEXT[locale] || LOADING_TEXT.fa;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
      {/* Spinner */}
      <div className="relative mb-8">
        {/* Outer glow */}
        <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/30" />

        {/* Spinning ring */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500"
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>
      </div>

      {/* Brand */}
      <h1 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        Qimat
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {loadingLabel}
      </p>
    </div>
  );
}
