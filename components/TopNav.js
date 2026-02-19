"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { items } from "@/lib/data";

// Key items to display in ticker
const TICKER_ITEMS = ["USD to AFN", "Petrol", "Flour (1kg)", "Gold (1g)"];

export default function TopNav({
  searchQuery,
  setSearchQuery,
  showNotificationDot,
}) {
  const [darkMode, setDarkMode] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
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

  // Get ticker items from data
  const tickerData = items.filter((item) =>
    TICKER_ITEMS.some((name) => item.name.toLowerCase().includes(name.toLowerCase()))
  );

  // Fallback ticker data if items don't match
  const displayTicker = tickerData.length > 0 ? tickerData : [
    { id: 't1', name: 'USD/AFN', price: 70.50, change: 0.25 },
    { id: 't2', name: 'Petrol', price: 65.00, change: -0.5 },
    { id: 't3', name: 'Flour', price: 2850, change: 1.2 },
    { id: 't4', name: 'Gold', price: 5850, change: 0.8 },
  ];

  return (
    <header className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-900">
      {/* Ticker Bar */}
      <div className="w-full bg-slate-900 dark:bg-slate-950">
        <div className="flex items-center">
          {/* Scrolling Ticker */}
          <div className="relative flex-1 overflow-hidden">
            <div className="flex animate-ticker items-center gap-6 py-2 pl-4 whitespace-nowrap">
              {[...displayTicker, ...displayTicker].map((item, index) => (
                <TickerItem key={`${item.id}-${index}`} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-slate-100 dark:bg-slate-900">
        <div className="flex w-full items-center gap-4 px-4 py-3">
          {/* Logo */}
          <div className="shrink-0 ml-5">
            <p className="text-xl font-bold tracking-tight text-primary">
              Qimat
            </p>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 md:block">
              Real-time market prices
            </p>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
            <div className="relative min-w-0 flex-1 md:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <HeaderActions
              darkMode={darkMode}
              showNotificationDot={showNotificationDot}
              toggleDarkMode={toggleDarkMode}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function TickerItem({ item }) {
  const isUp = item.change > 0;
  const isDown = item.change < 0;
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-slate-300">{item.name}</span>
      <span className="text-sm font-bold text-white">
        {typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
      </span>
      <span
        className={`flex items-center gap-0.5 text-xs font-semibold ${
          isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'
        }`}
      >
        <span className="text-[10px]">{isUp ? '▲' : isDown ? '▼' : '•'}</span>
        {Math.abs(item.change).toFixed(2)}%
      </span>
      <span className="text-slate-600">|</span>
    </div>
  );
}

function HeaderActions({ darkMode, showNotificationDot, toggleDarkMode }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={toggleDarkMode}
        className="rounded-full p-2.5 transition hover:bg-slate-200 dark:hover:bg-slate-800"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <SunIcon className="h-6 w-6 text-amber-400" />
        ) : (
          <MoonIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        )}
      </button>

      <button
        className="relative rounded-full p-2.5 transition hover:bg-slate-200 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <BellIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
        {showNotificationDot && (
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-secondary animate-pulse"></span>
        )}
      </button>
    </div>
  );
}
