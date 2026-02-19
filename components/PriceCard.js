import Image from "next/image";

export default function PriceCard({ item }) {
  const isPositive = item.change > 0;
  const changeText = isPositive
    ? "text-emerald-100"
    : item.change < 0
      ? "text-rose-100"
      : "text-slate-100";
  const changeBg = isPositive
    ? "bg-emerald-600/70"
    : item.change < 0
      ? "bg-rose-600/70"
      : "bg-slate-700/70";

  return (
    <article className="group relative h-44 overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 transition-all duration-300 md:h-48 md:hover:-translate-y-1 md:hover:shadow-xl dark:ring-white/10">
      <Image
        src={item.image || "/globe.svg"}
        alt={item.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 md:group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      {item.change !== undefined && (
        <div className="absolute right-3 top-3">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${changeText} ${changeBg} backdrop-blur`}
          >
            {isPositive ? "+" : item.change < 0 ? "-" : ""}
            {Math.abs(item.change).toFixed(2)}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/80">
          {item.category}
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <h3 className="text-base font-semibold leading-tight text-white">
            {item.name}
          </h3>
          <p className="shrink-0 text-lg font-bold tracking-tight text-white">
            {typeof item.price === "number"
              ? item.price.toFixed(2)
              : item.price}
          </p>
        </div>
      </div>
    </article>
  );
}
