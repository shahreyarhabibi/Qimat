// components/FilterBar.js
"use client";

import { categories } from "@/lib/data";

export default function FilterBar({ selectedCategory, setSelectedCategory }) {
  return (
    <div className="px-4 py-3">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto scrollbar-hide md:flex-wrap md:overflow-visible">
        <Chip
          label="All"
          active={selectedCategory === null}
          onClick={() => setSelectedCategory(null)}
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            active={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary text-white"
          : "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      {label}
    </button>
  );
}
