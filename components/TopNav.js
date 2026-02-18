// components/TopNav.js
"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { NAV_ITEMS, ACTIVE_NAV_ID } from "@/components/navigationItems";

export default function TopNav({
  searchQuery,
  setSearchQuery,
  showNotificationDot,
}) {
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark")
  );

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    }
    setDarkMode(!darkMode);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-slate-50/85 backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/80">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
        <div className="flex min-w-0 items-center justify-between gap-3 md:justify-self-start">
          <div className="shrink-0 md:min-w-[170px]">
            <p className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Qimat
            </p>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
              Real-time market prices
            </p>
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-2 md:flex md:justify-self-center">
          {NAV_ITEMS.map((item) => (
            <DesktopNavItem
              key={item.id}
              icon={item.Icon}
              label={item.label}
              active={item.id === ACTIVE_NAV_ID}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 md:justify-self-end">
          <div className="relative min-w-0 flex-1 md:w-72">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
          <HeaderActions
            darkMode={darkMode}
            showNotificationDot={showNotificationDot}
            toggleDarkMode={toggleDarkMode}
          />
        </div>

      </div>
    </header>
  );
}

function HeaderActions({ darkMode, showNotificationDot, toggleDarkMode }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={toggleDarkMode}
        className="rounded-full p-2.5 transition hover:bg-slate-200 dark:hover:bg-slate-800"
      >
        {darkMode ? (
          <SunIcon className="h-6 w-6 text-amber-400" />
        ) : (
          <MoonIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      <button className="relative rounded-full p-2.5 transition hover:bg-slate-200 dark:hover:bg-slate-800">
        <BellIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        {showNotificationDot && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-secondary"></span>
        )}
      </button>
    </div>
  );
}

function DesktopNavItem({ icon: Icon, label, active = false }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
        active
          ? "bg-primary text-white"
          : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
