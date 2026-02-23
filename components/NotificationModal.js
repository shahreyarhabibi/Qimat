// components/NotificationModal.jsx
"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  BellIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
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

export default function NotificationModal({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, increases, decreases
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?days=7&limit=50");
      const data = await res.json();

      if (data.success) {
        setNotifications(data.data.notifications);
        setTodayCount(data.data.todayCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "increases") return n.isIncrease;
    if (filter === "decreases") return n.isDecrease;
    return true;
  });

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notif) => {
    const date = notif.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notif);
    return groups;
  }, {});

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateStr === yesterday.toISOString().split("T")[0]) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return price;
    if (price >= 1000) return price.toLocaleString();
    return price % 1 === 0 ? price : price.toFixed(2);
  };

  const formatChange = (change) => {
    const absChange = Math.abs(change);
    if (absChange >= 1000) return absChange.toLocaleString();
    return absChange % 1 === 0 ? absChange : absChange.toFixed(2);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-4 top-4 z-50 mx-auto max-w-lg sm:inset-x-auto sm:left-auto sm:right-4 sm:top-16 sm:w-96 md:w-[420px]">
        <div className="flex max-h-[70vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <BellIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  Price Changes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {todayCount} changes today
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 border-b border-slate-200 px-4 py-2 dark:border-slate-700">
            <FilterTab
              label="All"
              active={filter === "all"}
              count={notifications.length}
              onClick={() => setFilter("all")}
            />
            <FilterTab
              label="Increases"
              active={filter === "increases"}
              count={notifications.filter((n) => n.isIncrease).length}
              onClick={() => setFilter("increases")}
              color="rose"
            />
            <FilterTab
              label="Decreases"
              active={filter === "decreases"}
              count={notifications.filter((n) => n.isDecrease).length}
              onClick={() => setFilter("decreases")}
              color="emerald"
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="space-y-4 p-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                  <BellIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 font-medium text-slate-900 dark:text-white">
                  No price changes
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {filter === "all"
                    ? "No price changes in the last 7 days"
                    : `No ${filter} in the last 7 days`}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {Object.entries(groupedNotifications).map(([date, items]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="sticky top-0 z-10 bg-slate-50/95 px-4 py-2 backdrop-blur-sm dark:bg-slate-900/95">
                      <div className="flex items-center gap-2">
                        <ClockIcon className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {formatDateHeader(date)}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {items.length}
                        </span>
                      </div>
                    </div>

                    {/* Notifications */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {items.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          formatPrice={formatPrice}
                          formatChange={formatChange}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!loading && filteredNotifications.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-700">
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Showing price changes from the last 7 days
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function FilterTab({ label, active, count, onClick, color = "primary" }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? color === "rose"
            ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
            : color === "emerald"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
              : "bg-primary/10 text-primary"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-300"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
          active
            ? color === "rose"
              ? "bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200"
              : color === "emerald"
                ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200"
                : "bg-primary/20 text-primary"
            : "bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function NotificationItem({ notification, formatPrice, formatChange }) {
  const { isIncrease } = notification;
  const CategoryIcon = categoryIcons[notification.category] || Squares2X2Icon;

  return (
    <div className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/30">
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isIncrease
            ? "bg-rose-100 dark:bg-rose-900/30"
            : "bg-emerald-100 dark:bg-emerald-900/30"
        }`}
      >
        <CategoryIcon
          className={`h-5 w-5 ${
            isIncrease
              ? "text-rose-600 dark:text-rose-400"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900 dark:text-white">
              {notification.productName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {notification.productUnit}
            </p>
          </div>

          {/* Change Badge */}
          <div
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${
              isIncrease
                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            }`}
          >
            {isIncrease ? (
              <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
            ) : (
              <ArrowTrendingDownIcon className="h-3.5 w-3.5" />
            )}
            {isIncrease ? "+" : "-"}
            {formatChange(notification.changeAmount)}
          </div>
        </div>

        {/* Price Change Details */}
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            {formatPrice(notification.previousPrice)}
          </span>
          <span className="text-slate-400">-&gt;</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {formatPrice(notification.currentPrice)} AFN
          </span>
          <span
            className={`ml-1 ${
              isIncrease
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            ({isIncrease ? "+" : ""}
            {notification.changePercent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
