// app/admin/page.js
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CubeIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ClockIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Overview of your price tracking system
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href="/admin/prices"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Update Prices
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={analytics?.summary?.totalProducts || 0}
          icon={CubeIcon}
          color="primary"
        />
        <StatsCard
          title="Categories"
          value={analytics?.byCategory?.length || 0}
          icon={TagIcon}
          color="blue"
        />
        <StatsCard
          title="Today's Visits"
          value={analytics?.summary?.todayVisits || 0}
          subtitle={`${analytics?.summary?.totalVisits || 0} total`}
          icon={EyeIcon}
          color="emerald"
        />
        <StatsCard
          title="Need Update"
          value={analytics?.summary?.staleProductsCount || 0}
          subtitle="Not updated in 7 days"
          icon={ExclamationTriangleIcon}
          color={analytics?.summary?.staleProductsCount > 0 ? "amber" : "slate"}
          warning={analytics?.summary?.staleProductsCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Stale Products Warning */}
        {analytics?.staleProducts?.length > 0 && (
          <div className="rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-200">
                  Products Need Update
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  {analytics.staleProducts.length} products haven&apos;t been
                  updated in over 7 days
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {analytics.staleProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg bg-white/50 px-3 py-2 dark:bg-slate-800/50"
                >
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {product.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {product.last_update || "Never"}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/admin/prices"
              className="mt-4 inline-flex text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400"
            >
              Update Prices →
            </Link>
          </div>
        )}

        {/* Price Changes Today */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Price Changes Today
          </h3>
          {analytics?.priceChanges?.length > 0 ? (
            <div className="mt-4 space-y-3">
              {analytics.priceChanges.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {item.name}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-sm font-medium ${
                      item.change > 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {item.change > 0 ? (
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-4 w-4" />
                    )}
                    {item.change > 0 ? "+" : ""}
                    {item.change.toLocaleString()} AFN
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No price changes recorded today
            </p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Recent Activity
          </h3>
          {analytics?.recentActivity?.length > 0 ? (
            <div className="mt-4 space-y-3">
              {analytics.recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <ClockIcon className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium capitalize">
                        {activity.action}
                      </span>{" "}
                      {activity.entity_type}:{" "}
                      <span className="font-medium">
                        {activity.entity_name}
                      </span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No recent activity</p>
          )}
        </div>

        {/* Products by Category */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">
            Products by Category
          </h3>
          <div className="mt-4 space-y-3">
            {analytics?.byCategory?.map((cat) => (
              <div key={cat.slug} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {cat.count}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${
                          (cat.count /
                            Math.max(
                              ...analytics.byCategory.map((c) => c.count),
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, subtitle, icon: Icon, color, warning }) {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-500/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber: "bg-amber-500/10 text-amber-600",
    slate: "bg-slate-500/10 text-slate-600",
  };

  return (
    <div
      className={`rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${
        warning ? "ring-amber-300 dark:ring-amber-700" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[color]}`}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
