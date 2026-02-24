// components/TopNav.jsx
"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import NotificationModal from "./NotificationModal";
import { useCurrency, CURRENCIES } from "@/lib/context/CurrencyContext";
import { useI18n } from "@/lib/i18n/useI18n";

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
const PUSH_CLIENT_KEY = "qimat_push_client_id";

function getOrCreatePushClientId() {
  if (typeof window === "undefined") return null;
  const existing = localStorage.getItem(PUSH_CLIENT_KEY);
  if (existing) return existing;

  const id = `client_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(PUSH_CLIENT_KEY, id);
  return id;
}

function base64ToUint8Array(base64String) {
  const normalized = String(base64String || "").replace(/\s+/g, "");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  const base64 = (normalized + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

export default function TopNav({
  items = [],
  searchQuery,
  setSearchQuery,
  showNotificationDot,
  favoriteIds = [],
}) {
  const { t } = useI18n();
  const { currentCurrency, afnLabel } = useCurrency();
  const [tickerProductIds, setTickerProductIds] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [pushClientId] = useState(() => getOrCreatePushClientId());
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);
  const notifiedIdsRef = useRef(new Set());

  const toggleDarkMode = () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.theme = "light";
    } else {
      document.documentElement.classList.add("dark");
      localStorage.theme = "dark";
    }
  };

  // Fetch ticker config
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

  useEffect(() => {
    let mounted = true;

    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return undefined;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(() => {
        if (mounted) setServiceWorkerReady(true);
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch notification count
  useEffect(() => {
    const storedIds =
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("qimat_notified_ids") || "[]")
        : [];
    notifiedIdsRef.current = new Set(Array.isArray(storedIds) ? storedIds : []);

    const fetchNotificationCount = async () => {
      try {
        const res = await fetch("/api/notifications?days=1&limit=100");
        const data = await res.json();
        if (data.success) {
          setNotificationCount(data.data.todayCount);

          if (
            notificationPermission === "granted" &&
            Array.isArray(favoriteIds) &&
            favoriteIds.length > 0
          ) {
            const favoriteSet = new Set(favoriteIds.map((id) => Number(id)));
            const favoriteNotifications = data.data.notifications.filter((n) =>
              favoriteSet.has(Number(n.productId)),
            );

            const newNotifications = favoriteNotifications.filter(
              (n) => !notifiedIdsRef.current.has(n.id),
            );

            newNotifications.forEach((n) => {
              const direction = n.isIncrease ? "up" : "down";
              const symbol = n.isIncrease ? "+" : "-";
              const amount = Math.round(Math.abs(n.changeAmount)).toLocaleString();

              new Notification(n.productName, {
                body: `${symbol}${amount} ${
                  currentCurrency.code === "AFN"
                    ? afnLabel
                    : currentCurrency.code
                } (${direction})`,
                tag: `qimat-${n.id}`,
              });

              notifiedIdsRef.current.add(n.id);
            });

            const recentIds = Array.from(notifiedIdsRef.current).slice(-200);
            localStorage.setItem("qimat_notified_ids", JSON.stringify(recentIds));
            notifiedIdsRef.current = new Set(recentIds);
          }
        }
      } catch (error) {
        console.error("Error fetching notification count:", error);
      }
    };

    fetchNotificationCount();
    const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [favoriteIds, notificationPermission, currentCurrency.code, afnLabel]);

  const syncPushSubscription = useCallback(async () => {
    if (
      typeof window === "undefined" ||
      !serviceWorkerReady ||
      !pushClientId ||
      !("serviceWorker" in navigator) ||
      notificationPermission !== "granted"
    ) {
      return;
    }

    const vapidPublicKey = String(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    ).trim();
    if (!vapidPublicKey) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: base64ToUint8Array(vapidPublicKey),
        }));

      await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: pushClientId,
          subscription: subscription.toJSON(),
          favoriteIds,
        }),
      });
    } catch (error) {
      console.error("Failed to sync push subscription:", error);
    }
  }, [serviceWorkerReady, pushClientId, notificationPermission, favoriteIds]);

  useEffect(() => {
    syncPushSubscription();
  }, [syncPushSubscription]);

  useEffect(() => {
    if (!pushClientId) return;

    fetch("/api/push/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: pushClientId,
        favoriteIds,
      }),
    }).catch((error) => {
      console.error("Failed to sync favorite preferences:", error);
    });
  }, [favoriteIds, pushClientId]);

  const requestNotificationPermission = async () => {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setNotificationPermission(result);

    if (result === "granted") {
      await syncPushSubscription();
      return;
    }

    if (result === "denied" && pushClientId) {
      await fetch("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: pushClientId }),
      }).catch((error) => {
        console.error("Failed to deactivate push subscription:", error);
      });
    }
  };

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

    const fallbackTicker = items.filter((item) => {
      const itemSlug =
        item.slug || item.name?.toLowerCase().replace(/\s+/g, "-");
      return TICKER_SLUGS.includes(itemSlug);
    });

    return fallbackTicker.length >= 4 ? fallbackTicker : items.slice(0, 6);
  }, [items, tickerProductIds]);

  return (
    <>
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
                {t("topNav.appTagline")}
              </p>
            </div>

            {/* Search and Actions */}
            <div className="flex flex-1 items-center justify-end gap-2 md:gap-3">
              <div className="relative hidden min-w-0 flex-1 md:block md:max-w-sm lg:max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("topNav.searchPlaceholder")}
                  value={searchQuery || ""}
                  onChange={(e) => setSearchQuery?.(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                />
              </div>

              {/* Currency Selector */}
              <CurrencySelector />

              <HeaderActions
                notificationCount={notificationCount}
                showNotificationDot={
                  showNotificationDot || notificationCount > 0
                }
                toggleDarkMode={toggleDarkMode}
                onNotificationClick={() => setNotificationOpen(true)}
                notificationsLabel={t("topNav.notifications")}
                toggleDarkLabel={t("topNav.toggleDark")}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        favoriteIds={favoriteIds}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={requestNotificationPermission}
      />
    </>
  );
}

// Currency Selector Component
function CurrencySelector() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    selectedCurrency,
    selectedLanguage,
    changeCurrency,
    changeLanguage,
    exchangeRates,
    currentCurrency,
    currentLanguage,
    languages,
    afnLabel,
    getCurrencyLabel,
  } = useCurrency();
  const { t } = useI18n();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currencyOptions = Object.values(CURRENCIES).filter(
    (c) => c.code === "AFN" || exchangeRates[c.code],
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm transition-all ${
          isOpen
            ? "border-primary/40 bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
        }`}
      >
        <span className="text-base leading-none">{currentCurrency.flag}</span>
        <span className="hidden tracking-wide sm:inline">
          {currentCurrency.code === "AFN" ? afnLabel : currentCurrency.code}
          <span className="mx-1 text-slate-300 dark:text-slate-500">•</span>
          {currentLanguage.shortCode}
        </span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          dir="ltr"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700"
        >
          <div className="p-2">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("topNav.selectCurrency")}
            </p>
            {currencyOptions.map((currency) => {
              const isSelected = selectedCurrency === currency.code;
              const rate = exchangeRates[currency.code];

              return (
                <button
                  key={currency.code}
                  onClick={() => {
                    changeCurrency(currency.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="text-xl">{currency.flag}</span>
                  <div className="flex-1">
                    <p className="font-medium">{currency.code}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {currency.name}
                    </p>
                  </div>
                  {currency.code !== "AFN" && rate && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        1 {currency.code}
                      </p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {Math.round(rate).toLocaleString()} {afnLabel}
                      </p>
                    </div>
                  )}
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-slate-200 p-2 dark:border-slate-700">
            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("topNav.selectLanguage")}
            </p>
            {Object.values(languages).map((language) => {
              const isSelected = selectedLanguage === language.code;

              return (
                <button
                  key={language.code}
                  onClick={() => {
                    changeLanguage(language.code);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {t(`languages.${language.code}`)}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Rate Info */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[10px] text-slate-400">
              {t("topNav.ratesNote")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TickerStrip({ items }) {
  const tickerRef = useRef(null);

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
  const { formatPrice, convertPrice, currentCurrency, getCurrencyLabel } =
    useCurrency();
  const isUp = item.change > 0;
  const isDown = item.change < 0;

  const formatChange = (change) =>
    Math.round(Math.abs(convertPrice(change))).toLocaleString();

  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-slate-300">{item.name}</span>
        {item.unit && (
          <span className="text-xs text-slate-500">({item.unit})</span>
        )}
      </div>

      <span className="text-sm font-bold text-white">
        {formatPrice(item.price, { showSymbol: false })}
        <span className="ml-1 text-xs font-normal text-slate-400">
          {" "}
          {getCurrencyLabel(currentCurrency.code)}
        </span>
      </span>

      <span
        className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ${
          isUp
            ? "bg-rose-500/20 text-rose-400"
            : isDown
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-slate-500/20 text-slate-400"
        }`}
      >
        {isUp ? "+" : isDown ? "-" : ""}
        {formatChange(item.change)} {getCurrencyLabel(currentCurrency.code)}
      </span>

      <span className="ml-4 text-slate-600">|</span>
    </div>
  );
}
function HeaderActions({
  notificationCount,
  showNotificationDot,
  toggleDarkMode,
  onNotificationClick,
  notificationsLabel,
  toggleDarkLabel,
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={toggleDarkMode}
        className="rounded-xl p-2.5 transition hover:bg-white hover:shadow-sm dark:hover:bg-slate-800"
        aria-label={toggleDarkLabel}
        title={toggleDarkLabel}
      >
        <SunIcon className="hidden h-5 w-5 text-amber-400 dark:block" />
        <MoonIcon className="h-5 w-5 text-slate-600 dark:hidden" />
      </button>

      <button
        onClick={onNotificationClick}
        className="relative rounded-xl p-2.5 transition hover:bg-white hover:shadow-sm dark:hover:bg-slate-800"
        aria-label={notificationsLabel}
        title={notificationsLabel}
      >
        <BellIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
        {showNotificationDot && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-slate-50 dark:ring-slate-900">
            {notificationCount > 9 ? "9+" : notificationCount || "•"}
          </span>
        )}
      </button>
    </div>
  );
}
