// components/PriceListItem.jsx
"use client";

import Image from "next/image";
import { MapPinIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useI18n } from "@/lib/i18n/useI18n";

export default function PriceListItem({ item, onClick, onAdd }) {
  const { t } = useI18n();
  const { formatPrice, currentCurrency, afnLabel } = useCurrency();
  const isIncrease = item.change > 0;

  const formatChange = (change) => {
    const absChange = Math.abs(change);
    if (absChange >= 1000) return absChange.toLocaleString();
    return absChange % 1 === 0 ? absChange : absChange.toFixed(2);
  };

  return (
    <article
      onClick={() => onClick?.(item)}
      className="group flex min-h-20 cursor-pointer items-center gap-3 rounded-xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/80 transition-all duration-200 hover:shadow-md hover:ring-slate-300 dark:bg-slate-800 dark:ring-slate-700/80 dark:hover:ring-slate-600 sm:gap-4 sm:px-4"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 sm:h-16 sm:w-16">
        <Image
          src={item.image || "/placeholder.jpg"}
          alt={item.name}
          fill
          sizes="64px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
            {item.name}
          </h3>
          <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:text-[11px]">
            {item.unit}
          </span>
        </div>

        <div className="mt-1 flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {item.source?.shortName || item.source?.name || t("priceListItem.unknown")}
            </span>
          </div>
        </div>
      </div>

      <div className="ml-2 flex shrink-0 items-end gap-2">
        <div className="flex flex-col items-end">
          <p className="text-sm font-bold text-slate-900 dark:text-white sm:text-base">
            {formatPrice(item.price, {
              showSymbol: true,
              decimals: currentCurrency.code === "AFN" ? 0 : 2,
            })}
          </p>

          {item.change !== 0 ? (
            <span
              className={`mt-1 inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isIncrease
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
              }`}
            >
              {isIncrease ? "+" : "-"} {formatChange(item.change)} {afnLabel}
            </span>
          ) : (
            <span className="mt-1 inline-flex whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              {t("priceListItem.stable")}
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.(item);
          }}
          className="hidden rounded-lg bg-primary/10 p-2 text-primary transition-colors hover:bg-primary hover:text-white sm:inline-flex"
          title={t("priceListItem.addToSpendingList")}
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
