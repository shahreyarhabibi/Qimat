"use client";

import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";
import { items } from "@/lib/data";

// Get important items by ID from data.js
const TICKER_ITEM_IDS = [15, 21, 4, 26, 9, 16]; // USD, Petrol, Flour, Gold, iPhone, EUR

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

  // Get ticker items from data.js by ID
  const tickerData = items.filter((item) => TICKER_ITEM_IDS.includes(item.id));

  return (
    <header className="sticky top-0 z-30">
      {/* Ticker Bar */}
      <div className="w-full bg-slate-900 dark:bg-slate-950 overflow-hidden">
        <TickerStrip items={tickerData} />
      </div>

      {/* Main Navbar */}
      <div className="border-b border-slate-200/50 bg-slate-50/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          {/* Logo */}
          <div className="shrink-0">
            <h1 className="text-xl font-bold tracking-tight text-primary">
              Qimat
            </h1>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Real-time market prices
            </p>
          </div>

          {/* Search and Actions */}
          <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
            <div className="relative min-w-0 flex-1 md:max-w-sm lg:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
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

function TickerStrip({ items }) {
  const tickerRef = useRef(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    if (tickerRef.current) {
      // Get the width of one set of items
      const firstSet = tickerRef.current.querySelector('.ticker-set');
      if (firstSet) {
        setContentWidth(firstSet.offsetWidth);
      }
    }
  }, [items]);

  // Create enough copies to ensure seamless loop
  const renderTickerContent = () => (
    <div className="ticker-set flex items-center gap-8 px-4">
      {items.map((item) => (
        <TickerItem key={item.id} item={item} />
      ))}
    </div>
  );

  return (
    <div className="ticker-wrapper relative py-2">
      <div
        ref={tickerRef}
        className="ticker-track flex"
        style={{
          animation: 'ticker 25s linear infinite',
        }}
      >
        {/* Render multiple copies for seamless loop */}
        {renderTickerContent()}
        {renderTickerContent()}
        {renderTickerContent()}
        {renderTickerContent()}
      </div>
    </div>
  );
}

function TickerItem({ item }) {
  const isUp = item.change > 0;
  const isDown = item.change < 0;

  const formatChange = (change) => {
    const absChange = Math.abs(change);
    if (absChange >= 1000) {
      return absChange.toLocaleString();
    }
    return absChange % 1 === 0 ? absChange : absChange.toFixed(1);
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Item Name & Unit */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-slate-300">{item.name}</span>
        {item.unit && (
          <span className="text-xs text-slate-500">({item.unit})</span>
        )}
      </div>

      {/* Price */}
      <span className="text-sm font-bold text-white">
        {typeof item.price === "number"
          ? item.price.toLocaleString()
          : item.price}
        <span className="ml-1 text-xs font-normal text-slate-400">AFN</span>
      </span>

      {/* Change Badge */}
      <span
        className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
          isUp
            ? "bg-rose-500/20 text-rose-400"
            : isDown
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-slate-500/20 text-slate-400"
        }`}
      >
        {isUp ? "▲" : isDown ? "▼" : ""}
        {formatChange(item.change)} AFN
      </span>

      {/* Separator */}
      <span className="text-slate-600 ml-4">|</span>
    </div>
  );
}

function HeaderActions({ darkMode, showNotificationDot, toggleDarkMode }) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={toggleDarkMode}
        className="rounded-xl p-2.5 transition hover:bg-white hover:shadow-sm dark:hover:bg-slate-800"
        aria-label="Toggle dark mode"
      >
        {darkMode ? (
          <SunIcon className="h-5 w-5 text-amber-400" />
        ) : (
          <MoonIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      <button
        className="relative rounded-xl p-2.5 transition hover:bg-white hover:shadow-sm dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <BellIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {showNotificationDot && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary ring-2 ring-slate-50 dark:ring-slate-900"></span>
        )}
      </button>
    </div>
  );
}