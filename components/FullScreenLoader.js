// components/FullScreenLoader.jsx
"use client";

export default function FullScreenLoader() {
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
    </div>
  );
}
