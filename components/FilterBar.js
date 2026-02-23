// components/FilterBar.jsx
"use client";

import { useState } from "react";
import {
  ShoppingBagIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  FireIcon,
  CubeIcon,
  Squares2X2Icon,
  XMarkIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

// Map category slugs to icons
const categoryIcons = {
  essentials: ShoppingBagIcon,
  phones: DevicePhoneMobileIcon,
  currencies: CurrencyDollarIcon,
  fuel: FireIcon,
  metals: CubeIcon,
};

export default function FilterBar({
  categories = [], // Now comes from database via props
  selectedCategory,
  setSelectedCategory,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setIsExpanded(false);
  };

  const selectedCategoryData = categories.find(
    (c) => c.id === selectedCategory,
  );

  return (
    <div className="w-full">
      {/* Desktop: Horizontal Floating Pills */}
      <div className="hidden md:block">
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 p-2 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50 backdrop-blur-xl dark:bg-slate-800/80 dark:shadow-slate-900/50 dark:ring-slate-700/50">
          <CategoryPill
            label="All"
            icon={Squares2X2Icon}
            isActive={selectedCategory === null}
            onClick={() => handleSelect(null)}
          />

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />

          {categories.map((cat) => {
            const Icon = categoryIcons[cat.id] || Squares2X2Icon;
            return (
              <CategoryPill
                key={cat.id}
                label={cat.name}
                icon={Icon}
                isActive={selectedCategory === cat.id}
                onClick={() => handleSelect(cat.id)}
              />
            );
          })}
        </div>
      </div>

      {/* Mobile: Dropdown Style */}
      <div className="md:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center justify-between rounded-xl bg-white px-4 py-3 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50 dark:bg-slate-800 dark:shadow-slate-900/50 dark:ring-slate-700/50"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              {selectedCategory ? (
                (() => {
                  const Icon =
                    categoryIcons[selectedCategory] || Squares2X2Icon;
                  return <Icon className="h-5 w-5 text-primary" />;
                })()
              ) : (
                <Squares2X2Icon className="h-5 w-5 text-primary" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {selectedCategoryData?.name || "All Categories"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tap to change
              </p>
            </div>
          </div>
          <ChevronDownIcon
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Mobile Dropdown Panel */}
        <div
          className={`mt-2 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200/50 transition-all duration-300 dark:bg-slate-800 dark:ring-slate-700/50 ${
            isExpanded
              ? "max-h-96 opacity-100"
              : "pointer-events-none max-h-0 opacity-0"
          }`}
        >
          <div className="p-2">
            <MobileFilterItem
              label="All Categories"
              icon={Squares2X2Icon}
              isActive={selectedCategory === null}
              onClick={() => handleSelect(null)}
            />
            {categories.map((cat) => {
              const Icon = categoryIcons[cat.id] || Squares2X2Icon;
              return (
                <MobileFilterItem
                  key={cat.id}
                  label={cat.name}
                  icon={Icon}
                  isActive={selectedCategory === cat.id}
                  onClick={() => handleSelect(cat.id)}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Filter Badge (shown when filter is applied) */}
      {selectedCategory && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filtering by:
          </span>
          <button
            onClick={() => setSelectedCategory(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 py-1 pl-3 pr-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            {selectedCategoryData?.name}
            <XMarkIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function CategoryPill({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary text-white shadow-md shadow-primary/25"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50"
      }`}
    >
      <Icon
        className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
          isActive ? "text-white" : "text-slate-400 dark:text-slate-500"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

function MobileFilterItem({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all ${
        isActive
          ? "bg-primary text-white"
          : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${isActive ? "text-white" : "text-slate-400"}`}
      />
      <span className="flex-1 text-left">{label}</span>
      {isActive && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
          <span className="h-2 w-2 rounded-full bg-white"></span>
        </span>
      )}
    </button>
  );
}
