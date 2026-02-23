// app/admin/analytics/page.js
"use client";

import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  EyeIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Analytics
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitor your price tracking system performance
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={analytics?.summary?.totalProducts || 0}
          icon={CubeIcon}
          color="primary"
        />
        <StatCard
          title="Today's Visits"
          value={analytics?.summary?.todayVisits || 0}
          subtitle="Page views"
          icon={EyeIcon}
          color="blue"
        />
        <StatCard
          title="Total Visits"
          value={analytics?.summary?.totalVisits || 0}
          subtitle="All time"
          icon={ChartBarIcon}
          color="emerald"
        />
        <StatCard
          title="Need Update"
          value={analytics?.summary?.staleProductsCount || 0}
          subtitle="Over 7 days old"
          icon={ExclamationTriangleIcon}
          color={analytics?.summary?.staleProductsCount > 0 ? "amber" : "slate"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Products by Category */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Products by Category
          </h3>
          <div className="space-y-4">
            {analytics?.byCategory?.map((cat) => {
              const maxCount = Math.max(
                ...analytics.byCategory.map((c) => c.count),
              );
              const percentage =
                maxCount > 0 ? (cat.count / maxCount) * 100 : 0;

              return (
                <div key={cat.slug}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {cat.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Price Changes Today */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Price Changes Today
          </h3>
          {analytics?.priceChanges?.length > 0 ? (
            <div className="space-y-3">
              {analytics.priceChanges.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {Number(item.yesterday_price).toLocaleString()} →{" "}
                      {Number(item.today_price).toLocaleString()} AFN
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold ${
                      item.change > 0
                        ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}
                  >
                    {item.change > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    {item.change > 0 ? "+" : ""}
                    {Number(item.change).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500">
                No price changes recorded today
              </p>
            </div>
          )}
        </div>

        {/* Stale Products Warning */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Products Need Update
            </h3>
          </div>
          {analytics?.staleProducts?.length > 0 ? (
            <div className="space-y-2">
              {analytics.staleProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-900/20"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {product.category_slug}
                    </p>
                  </div>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    {product.last_update || "Never updated"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-emerald-400" />
              <p className="mt-2 text-sm text-slate-500">
                All products are up to date!
              </p>
            </div>
          )}
        </div>

        {/* Visit Stats (Last 7 Days) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="mb-4 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Visits (Last 7 Days)
            </h3>
          </div>
          {analytics?.visitStats?.length > 0 ? (
            <div className="space-y-2">
              {analytics.visitStats.slice(0, 7).map((stat, index) => {
                const maxVisits = Math.max(
                  ...analytics.visitStats.slice(0, 7).map((s) => s.visits),
                );
                const percentage =
                  maxVisits > 0 ? (stat.visits / maxVisits) * 100 : 0;

                return (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-24 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(stat.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1">
                      <div className="h-6 overflow-hidden rounded bg-slate-100 dark:bg-slate-700">
                        <div
                          className="flex h-full items-center rounded bg-primary/20 px-2 transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 10)}%` }}
                        >
                          <span className="text-xs font-medium text-primary">
                            {stat.visits}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <EyeIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500">
                No visit data available yet
              </p>
              <p className="text-xs text-slate-400">
                Visits will be tracked once deployed
              </p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
          </div>
          {analytics?.recentActivity?.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-900"
                >
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      activity.action === "create"
                        ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : activity.action === "delete"
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                          : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {activity.action === "create" ? (
                      <span className="text-sm">+</span>
                    ) : activity.action === "delete" ? (
                      <span className="text-sm">−</span>
                    ) : (
                      <span className="text-sm">✎</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <span className="font-medium capitalize">
                        {activity.action}
                      </span>{" "}
                      {activity.entity_type}:{" "}
                      <span className="font-medium">
                        {activity.entity_name}
                      </span>
                    </p>
                    {activity.details && (
                      <p className="text-xs text-slate-500">
                        {activity.details}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-500">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
