"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  XMarkIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";

const TIME_RANGES = [
  { id: "7d", label: "7 Days", days: 7 },
  { id: "10d", label: "10 Days", days: 10 },
  { id: "15d", label: "15 Days", days: 15 },
  { id: "30d", label: "30 Days", days: 30 },
];

export default function ProductModal({ item, isOpen, onClose }) {
  const [selectedRange, setSelectedRange] = useState("7d");

  const chartData = useMemo(() => {
    if (!item?.priceHistory) return [];
    const range = TIME_RANGES.find((r) => r.id === selectedRange);
    return item.priceHistory.slice(-range.days);
  }, [item, selectedRange]);

  const priceStats = useMemo(() => {
    if (!chartData.length) return null;
    
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last - first;
    const changePercent = ((change / first) * 100).toFixed(2);
    
    return { min, max, avg, change, changePercent };
  }, [chartData]);

  if (!isOpen || !item) return null;

  const isIncrease = item.change > 0;
  const isDecrease = item.change < 0;

  const formatPrice = (price) => {
    if (price >= 1000) return price.toLocaleString();
    return price % 1 === 0 ? price : price.toFixed(2);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-4 z-50 flex items-center justify-center sm:inset-8 md:inset-12 lg:inset-20">
        <div
          className="relative flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-slate-900 dark:bg-slate-700/90 dark:hover:bg-slate-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="relative aspect-square w-full md:aspect-auto md:h-80 md:w-80 lg:h-96 lg:w-96">
                <Image
                  src={item.image || "/placeholder.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                {/* Category Badge */}
                <div className="absolute left-4 top-4">
                  <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur-sm">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white lg:text-3xl">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.unit}
                  </p>
                  
                  {item.description && (
                    <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      {item.description}
                    </p>
                  )}

                  {/* Source */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{item.source?.name || "Unknown Source"}</span>
                  </div>
                </div>

                {/* Price Section */}
                <div className="mt-6 flex items-end justify-between">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Current Price
                    </p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white lg:text-4xl">
                      {formatPrice(item.price)}{" "}
                      <span className="text-lg font-normal text-slate-500">AFN</span>
                    </p>
                  </div>

                  {/* Change Badge */}
                  <div
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 ${
                      isIncrease
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                        : isDecrease
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}
                  >
                    {isIncrease ? (
                      <ArrowTrendingUpIcon className="h-5 w-5" />
                    ) : isDecrease ? (
                      <ArrowTrendingDownIcon className="h-5 w-5" />
                    ) : (
                      <MinusIcon className="h-5 w-5" />
                    )}
                    <span className="font-semibold">
                      {isIncrease ? "+" : ""}
                      {formatPrice(item.change)} AFN
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="border-t border-slate-200 p-6 dark:border-slate-700">
              {/* Chart Header */}
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Price History
                  </h3>
                </div>

                {/* Time Range Selector */}
                <div className="flex gap-2">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedRange(range.id)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedRange === range.id
                          ? "bg-primary text-white shadow-md"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart */}
              <div className="h-64 w-full sm:h-72">
                <PriceChart data={chartData} />
              </div>

              {/* Stats */}
              {priceStats && (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatCard
                    label="Lowest"
                    value={formatPrice(priceStats.min)}
                    suffix="AFN"
                    color="text-emerald-600"
                  />
                  <StatCard
                    label="Highest"
                    value={formatPrice(priceStats.max)}
                    suffix="AFN"
                    color="text-rose-600"
                  />
                  <StatCard
                    label="Average"
                    value={formatPrice(Math.round(priceStats.avg))}
                    suffix="AFN"
                    color="text-blue-600"
                  />
                  <StatCard
                    label="Period Change"
                    value={`${priceStats.change >= 0 ? "+" : ""}${formatPrice(priceStats.change)}`}
                    suffix={`(${priceStats.changePercent}%)`}
                    color={priceStats.change >= 0 ? "text-rose-600" : "text-emerald-600"}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ label, value, suffix, color }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${color}`}>
        {value}{" "}
        <span className="text-xs font-normal text-slate-500">{suffix}</span>
      </p>
    </div>
  );
}

function PriceChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        No data available
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 100;
  const height = 100;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Generate path for the line
  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth;
    const y = padding.top + (1 - (d.price - minPrice) / priceRange) * chartHeight;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(" L ")}`;

  // Generate path for the gradient area
  const areaPath = `${linePath} L ${padding.left + chartWidth},${padding.top + chartHeight} L ${padding.left},${padding.top + chartHeight} Z`;

  // Y-axis labels
  const yLabels = [minPrice, (minPrice + maxPrice) / 2, maxPrice].map((price, i) => ({
    price: Math.round(price),
    y: padding.top + (1 - i / 2) * chartHeight,
  }));

  // X-axis labels (show first, middle, last dates)
  const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map((i) => ({
    date: new Date(data[i].date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    x: padding.left + (i / (data.length - 1)) * chartWidth,
  }));

  // Determine trend color
  const isPositive = data[data.length - 1].price >= data[0].price;
  const strokeColor = isPositive ? "#f43f5e" : "#10b981";
  const gradientId = `gradient-${isPositive ? "up" : "down"}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((label, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={label.y}
          x2={padding.left + chartWidth}
          y2={label.y}
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeDasharray="2,2"
        />
      ))}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        style={{ strokeWidth: "2px" }}
      />

      {/* Data points */}
      {data.length <= 15 &&
        data.map((d, i) => {
          const x = padding.left + (i / (data.length - 1)) * chartWidth;
          const y = padding.top + (1 - (d.price - minPrice) / priceRange) * chartHeight;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1"
              fill={strokeColor}
              className="transition-all hover:r-[1.5]"
              vectorEffect="non-scaling-stroke"
              style={{ r: "4px" }}
            />
          );
        })}

      {/* Y-axis labels */}
      {yLabels.map((label, i) => (
        <text
          key={i}
          x={padding.left - 5}
          y={label.y}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-slate-500 text-[3px] dark:fill-slate-400"
          style={{ fontSize: "10px" }}
        >
          {label.price.toLocaleString()}
        </text>
      ))}

      {/* X-axis labels */}
      {xLabels.map((label, i) => (
        <text
          key={i}
          x={label.x}
          y={height - 10}
          textAnchor="middle"
          className="fill-slate-500 text-[3px] dark:fill-slate-400"
          style={{ fontSize: "10px" }}
        >
          {label.date}
        </text>
      ))}
    </svg>
  );
}