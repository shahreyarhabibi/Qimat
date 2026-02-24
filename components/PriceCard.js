// components/PriceCard.jsx
import Image from "next/image";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useI18n } from "@/lib/i18n/useI18n";

export default function PriceCard({ item, onClick, onAdd }) {
  const { t } = useI18n();
  const { formatPrice, currentCurrency, convertPrice, afnLabel } = useCurrency();
  const isIncrease = item.change > 0;
  const isDecrease = item.change < 0;

  const formatChange = (change) => {
    return Math.round(Math.abs(convertPrice(change))).toLocaleString();
  };

  const mainPrice =
    currentCurrency.code === "AFN"
      ? formatPrice(item.price, { showSymbol: false })
      : formatPrice(item.price, { showSymbol: true });

  return (
    <article
      onClick={() => onClick?.(item)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition-[box-shadow,ring-color] duration-300 ease-out hover:shadow-xl hover:ring-slate-300/80 dark:bg-slate-800 dark:ring-slate-700/80 dark:hover:ring-slate-600/80"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
        <Image
          src={item.image || "/placeholder.jpg"}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />

        <div className="absolute left-2 top-2">
          <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur-sm dark:bg-slate-900/90 dark:text-slate-300">
            {item.category}
          </span>
        </div>

        {item.change !== 0 && (
          <div className="absolute right-2 top-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold shadow-sm backdrop-blur-sm ${
                isIncrease
                  ? "bg-rose-500/90 text-white"
                  : "bg-emerald-500/90 text-white"
              }`}
            >
              <span className="text-[10px]">{isIncrease ? "+" : "-"}</span>
              {formatChange(item.change)} {currentCurrency.code}
            </span>
          </div>
        )}

        {item.change === 0 && (
          <div className="absolute right-2 top-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-500/90 px-2 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-sm">
              <span className="text-[10px]">•</span>
              {t("priceCard.stable")}
            </span>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/15">
          <div className="flex translate-y-4 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(item);
              }}
              className="cursor-pointer rounded-full bg-white/95 px-4 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white hover:shadow-xl active:translate-y-0"
            >
              {t("priceCard.seeDetails")}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd?.(item);
              }}
              className="cursor-pointer rounded-full bg-primary/95 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-primary hover:shadow-xl active:translate-y-0"
            >
              {t("priceCard.addToList")}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-semibold leading-tight text-slate-900 dark:text-white md:text-base">
              {item.name}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {item.unit}
            </p>
          </div>

          <div className="mb-3 flex items-baseline gap-1">
            <span className="text-lg font-bold text-slate-900 dark:text-white md:text-2xl">
              {mainPrice}
            </span>
            {currentCurrency.code === "AFN" && (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {afnLabel}
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center gap-1.5 border-t border-slate-100 pt-2 dark:border-slate-700">
          <MapPinIcon className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {item.source?.shortName || item.source?.name || t("common.unknown")}
          </span>
        </div>
      </div>
    </article>
  );
}
