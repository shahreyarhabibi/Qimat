// components/TopNav.jsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
} from "@heroicons/react/24/outline";

// Ticker items by slug (these will be filtered from the items prop)
const TICKER_SLUGS = [
  "usd",
  "petrol",
  "flour",
  "gold-24k",
  "iphone-16-pro-max",
  "euro",
  "haji-aziz-rice",
  "diesel",
];

export default function TopNav({
  items = [], // Items now come from props (database)
  searchQuery,
  setSearchQuery,
  showNotificationDot,
}) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });
  const [tickerProductIds, setTickerProductIds] = useState([]);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.theme = "dark";
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.theme = "light";
      }
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchTickerConfig = async () => {
      try {
        const res = await fetch("/api/admin/ticker", { cache: "no-store" });
        if (!res.ok) return;

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) return;

        const data = await res.json();
        if (!isMounted || !data?.success || !Array.isArray(data.data)) return;

        setTickerProductIds(data.data.map((item) => String(item.id)));
      } catch {
        // Keep fallback ticker when API is unavailable.
      }
    };

    fetchTickerConfig();
    return () => {
      isMounted = false;
    };
  }, []);

  const displayTickerData = useMemo(() => {
    if (tickerProductIds.length > 0) {
      const itemsById = new Map(items.map((item) => [String(item.id), item]));
      const configuredTickerItems = tickerProductIds
        .map((id) => itemsById.get(id))
        .filter(Boolean);

      if (configuredTickerItems.length > 0) {
        return configuredTickerItems;
      }
    }

    // Fallback: previous hardcoded ticker behavior.
    const fallbackTicker = items.filter((item) => {
      const itemSlug = item.slug || item.name?.toLowerCase().replace(/\s+/g, "-");
      return TICKER_SLUGS.includes(itemSlug);
    });

    return fallbackTicker.length >= 4 ? fallbackTicker : items.slice(0, 6);
  }, [items, tickerProductIds]);

  return (
    <header className="sticky top-0 z-30">
      {/* Ticker Bar */}
      <div className="w-full overflow-hidden bg-slate-900 dark:bg-slate-950">
        {displayTickerData.length > 0 ? (
          <TickerStrip items={displayTickerData} />
        ) : (
          <TickerSkeleton />
        )}
      </div>

      {/* Main Navbar */}
      <div className="border-b border-slate-200/50 bg-slate-50/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-[90%] items-center justify-between gap-4 px-4 py-3">
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
                value={searchQuery || ""}
                onChange={(e) => setSearchQuery?.(e.target.value)}
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

  // Create enough copies to ensure seamless loop
  const renderTickerContent = () => (
    <div className="ticker-set flex items-center gap-8 px-4">
      {items.map((item, index) => (
        <TickerItem key={`${item.id}-${index}`} item={item} />
      ))}
    </div>
  );

  return (
    <div className="ticker-wrapper relative py-2">
      <div
        ref={tickerRef}
        className="ticker-track flex"
        style={{
          animation: "ticker 25s linear infinite",
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

function TickerSkeleton() {
  return (
    <div className="flex items-center gap-8 px-4 py-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-16 animate-pulse rounded bg-slate-700" />
          <div className="h-4 w-12 animate-pulse rounded bg-slate-700" />
        </div>
      ))}
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

  const formatPrice = (price) => {
    if (typeof price !== "number") return price;
    if (price >= 1000) return price.toLocaleString();
    return price % 1 === 0 ? price : price.toFixed(2);
  };

  return (
    <div className="flex shrink-0 items-center gap-2">
      {/* Item Name & Unit */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-slate-300">{item.name}</span>
        {item.unit && (
          <span className="text-xs text-slate-500">({item.unit})</span>
        )}
      </div>

      {/* Price */}
      <span className="text-sm font-bold text-white">
        {formatPrice(item.price)}
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
      <span className="ml-4 text-slate-600">|</span>
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
