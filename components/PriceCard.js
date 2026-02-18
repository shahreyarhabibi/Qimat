import Image from "next/image";

export default function PriceCard({ item }) {
  const isIncrease = item.change > 0;
  const isDecrease = item.change < 0;
  const changeText = isIncrease
    ? "text-rose-100"
    : isDecrease
      ? "text-emerald-100"
      : "text-slate-100";
  const changeBg = isIncrease
    ? "bg-rose-600/75"
    : isDecrease
      ? "bg-emerald-600/75"
      : "bg-slate-700/75";
  const changeSymbol = isIncrease ? "▲" : isDecrease ? "▼" : "•";

  return (
    <article className="group relative mx-auto w-full max-w-sm aspect-5/4 overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 transition-all duration-300 md:mx-0 md:max-w-none md:aspect-square md:hover:-translate-y-1 md:hover:scale-[1.01] md:hover:shadow-xl dark:ring-white/10">
      <Image
        src={item.image || "/globe.svg"}
        alt={item.name}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover transition-transform duration-500 md:group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/40 to-transparent" />

      {item.change !== undefined && (
        <div className="absolute right-3 top-3">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${changeText} ${changeBg} backdrop-blur`}
          >
            <span className="text-[10px] leading-none">{changeSymbol}</span>
            <span>{Math.abs(item.change).toFixed(2)}%</span>
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3.5 md:p-4">
        <p className="text-[14px] font-medium uppercase tracking-wide text-white/80">
          {item.category}
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <h3 className="text-2xl font-semibold leading-tight text-white md:text-base">
            {item.name}
          </h3>
          <p className="shrink-0 text-3xl font-bold tracking-tight text-white md:text-lg">
            {typeof item.price === "number"
              ? item.price.toFixed(2)
              : item.price}
          </p>
        </div>
      </div>
    </article>
  );
}
