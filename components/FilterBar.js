"use client";

import { categories } from "@/lib/data";
import {
  XMarkIcon,
  ShoppingBagIcon,
  DevicePhoneMobileIcon,
  CurrencyDollarIcon,
  FireIcon,
  CubeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

const categoryIcons = {
  essentials: ShoppingBagIcon,
  phones: DevicePhoneMobileIcon,
  currencies: CurrencyDollarIcon,
  fuel: FireIcon,
  metals: CubeIcon,
};

export default function FilterBar({
  selectedCategory,
  setSelectedCategory,
  isOpen,
  setIsOpen,
}) {
  const handleSelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 mt-10 top-0 z-50 flex h-full w-72 flex-col bg-slate-100 transition-transform duration-300 ease-out
          dark:bg-slate-900
          lg:z-10 lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-primary">
              Qimat
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Real-time market prices
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Categories Section */}
          <div className="mb-6">
            <h3 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Categories
            </h3>
            <nav className="space-y-1">
              {/* All Categories */}
              <SidebarItem
                label="All Items"
                icon={Squares2X2Icon}
                isActive={selectedCategory === null}
                onClick={() => handleSelect(null)}
              />

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const Icon = categoryIcons[cat.id] || Squares2X2Icon;
                return (
                  <SidebarItem
                    key={cat.id}
                    label={cat.name}
                    icon={Icon}
                    isActive={selectedCategory === cat.id}
                    onClick={() => handleSelect(cat.id)}
                  />
                );
              })}
            </nav>
          </div>

          {/* Quick Stats removed per request */}
        </div>
      </aside>
    </>
  );
}

function SidebarItem({ label, icon: Icon, isActive, onClick, muted = false }) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-primary text-white"
          : muted
            ? "text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <Icon
        className={`h-5 w-5 shrink-0 ${
          isActive
            ? "text-white"
            : muted
              ? "text-slate-400 group-hover:text-slate-500 dark:text-slate-500"
              : "text-slate-400 group-hover:text-slate-500 dark:text-slate-500"
        }`}
      />
      <span className="truncate">{label}</span>
      {isActive && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white"></span>
      )}
    </button>
  );
}
