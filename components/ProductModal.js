// components/ProductModal.jsx
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  XMarkIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useCurrency } from "@/lib/context/CurrencyContext";

const TIME_RANGES = [
  { id: "7d", label: "7D", days: 7 },
  { id: "10d", label: "10D", days: 10 },
  { id: "15d", label: "15D", days: 15 },
  { id: "30d", label: "1M", days: 30 },
];

export default function ProductModal({ item, isOpen, onClose }) {
  const [selectedRange, setSelectedRange] = useState("7d");
  const { formatPrice, currentCurrency, convertPrice } = useCurrency();

  const chartData = useMemo(() => {
    if (!item?.priceHistory) return [];
    const range = TIME_RANGES.find((r) => r.id === selectedRange);
    return item.priceHistory.slice(-range.days).map((d) => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      convertedPrice: convertPrice(d.price),
    }));
  }, [item, selectedRange, convertPrice]);

  const priceStats = useMemo(() => {
    if (!chartData.length) return null;

    const prices = chartData.map((d) => d.convertedPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const first = prices[0];
    const last = prices[prices.length - 1];
    const change = last - first;
    const changePercent = ((change / first) * 100).toFixed(1);

    return { min, max, avg, change, changePercent, first, last };
  }, [chartData]);

  const priceBreakdown = useMemo(() => {
    if (!item?.calculator) return null;
    const config = item.calculator;
    if (config.displayUnit !== "kg" || !config.baseQuantity) return null;

    const pricePerKg = convertPrice(item.price) / config.baseQuantity;
    const presets = config.presets || [];
    const hasSer = presets.some((p) => p.label.toLowerCase().includes("ser"));
    const sackPreset = presets.find((p) =>
      p.label.toLowerCase().includes("sack"),
    );

    const entries = [{ label: "1 kg", qty: 1 }];
    if (hasSer) entries.push({ label: "1 ser (7 kg)", qty: 7 });
    if (sackPreset) {
      entries.push({
        label: `1 sack (${sackPreset.value} kg)`,
        qty: sackPreset.value,
      });
    }

    return entries.map((entry) => ({
      ...entry,
      price: pricePerKg * entry.qty,
    }));
  }, [item, convertPrice]);

  const isUpTrend = priceStats?.change >= 0;

  if (!isOpen || !item) return null;

  const isIncrease = item.change > 0;
  const isDecrease = item.change < 0;
  const convertedChange = Math.round(Math.abs(convertPrice(item.change)));

  const formatDisplayPrice = (price) => {
    if (currentCurrency.code === "AFN") {
      return formatPrice(price, { showSymbol: false });
    }
    return formatPrice(price, { showSymbol: true });
  };

  const formatAxisPrice = (price) => {
    if (price >= 1000) return `${Math.round(price / 1000)}k`;
    return Math.round(price).toString();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div
          className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 z-10 rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-white sm:right-4 sm:top-4"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row">
              {/* Image */}
              <div className="relative aspect-[16/10] w-full sm:aspect-square sm:w-64 md:w-80">
                <Image
                  src={item.image || "/placeholder.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute left-3 top-3">
                  <span className="inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-700 shadow-sm backdrop-blur-sm sm:text-xs">
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="flex flex-1 flex-col p-4 sm:p-6">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {item.unit}
                  </p>

                  {item.description && (
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:mt-4">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{item.source?.name || "Unknown Source"}</span>
                  </div>
                </div>

                {/* Price Section */}
                <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:mt-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Current Price
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                      {formatDisplayPrice(item.price)}
                      {currentCurrency.code === "AFN" && (
                        <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                          AFN
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Today's Change Badge */}
                  <div
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 sm:gap-2 sm:px-4 ${
                      isIncrease
                        ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                        : isDecrease
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {isIncrease ? (
                      <ArrowTrendingUpIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : isDecrease ? (
                      <ArrowTrendingDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <MinusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                    <span className="text-sm font-bold sm:text-base">
                      {isIncrease ? "+" : ""}
                      {convertedChange.toLocaleString()} {currentCurrency.code}
                    </span>
                    <span className="text-xs opacity-75">today</span>
                  </div>
                </div>

                {priceBreakdown && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Price Breakdown
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {priceBreakdown.map((entry) => (
                        <div
                          key={entry.label}
                          className="rounded-lg bg-white px-3 py-2 text-center shadow-sm ring-1 ring-slate-200/60 dark:bg-slate-900 dark:ring-slate-700/60"
                        >
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {entry.label}
                          </p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {formatPrice(entry.price)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chart Section */}
            <div className="border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 sm:p-6">
              {/* Chart Header */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                    Price History ({currentCurrency.code})
                  </h3>
                  {priceStats && (
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isUpTrend
                          ? "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400"
                          : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
                      }`}
                    >
                      {isUpTrend ? "+" : ""}
                      {priceStats.changePercent}%
                    </span>
                  )}
                </div>

                {/* Time Range Selector */}
                <div className="flex rounded-xl bg-slate-200/70 p-1 dark:bg-slate-700/50">
                  {TIME_RANGES.map((range) => (
                    <button
                      key={range.id}
                      onClick={() => setSelectedRange(range.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:text-sm ${
                        selectedRange === range.id
                          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Summary Bar */}
              {priceStats && (
                <div className="mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/50 dark:bg-slate-800 dark:ring-slate-700/50 sm:p-4">
                  <div className="flex items-center gap-4 sm:gap-8">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                        Open
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                        {formatPrice(priceStats.first)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                        High
                      </p>
                      <p className="text-sm font-bold text-emerald-600 sm:text-base">
                        {formatPrice(priceStats.max)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                        Low
                      </p>
                      <p className="text-sm font-bold text-rose-600 sm:text-base">
                        {formatPrice(priceStats.min)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                        Avg
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                        {formatPrice(priceStats.avg)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-xs">
                      Change
                    </p>
                    <p
                      className={`text-sm font-bold sm:text-base ${
                        isUpTrend ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      {isUpTrend ? "+" : ""}
                      {formatPrice(Math.abs(priceStats.change))}
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="h-64 w-full sm:h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="priceGradientUp"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#f43f5e"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#f43f5e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="priceGradientDown"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="displayDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      dy={10}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={formatAxisPrice}
                      dx={-10}
                      width={50}
                    />
                    <Tooltip
                      content={
                        <CustomTooltip
                          currency={currentCurrency}
                          formatPrice={formatPrice}
                        />
                      }
                      cursor={{
                        stroke: "#94a3b8",
                        strokeWidth: 1,
                        strokeDasharray: "4 4",
                      }}
                    />
                    {priceStats && (
                      <ReferenceLine
                        y={priceStats.first}
                        stroke="#94a3b8"
                        strokeDasharray="3 3"
                        strokeWidth={1}
                      />
                    )}
                    <Area
                      type="monotone"
                      dataKey="convertedPrice"
                      stroke={isUpTrend ? "#f43f5e" : "#10b981"}
                      strokeWidth={2.5}
                      fill={
                        isUpTrend
                          ? "url(#priceGradientUp)"
                          : "url(#priceGradientDown)"
                      }
                      dot={false}
                      activeDot={{
                        r: 6,
                        fill: isUpTrend ? "#f43f5e" : "#10b981",
                        stroke: "#fff",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Info Note */}
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                <InformationCircleIcon className="h-5 w-5 shrink-0 text-blue-500" />
                <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-300">
                  Prices are updated daily. Historical data shows price trends
                  to help you make informed decisions. Red indicates price
                  increase (cost more), green indicates decrease (savings).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label, currency, formatPrice }) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const price = data.convertedPrice;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {new Date(data.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
        {Math.round(price).toLocaleString()}{" "}
        <span className="text-xs font-normal text-slate-500">
          {currency.code}
        </span>
      </p>
    </div>
  );
}
