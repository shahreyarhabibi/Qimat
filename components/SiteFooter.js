// components/SiteFooter.jsx
"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/useI18n";
import { ArrowUpIcon } from "@heroicons/react/24/outline";

export default function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Image
              src="/qimat-logo.png"
              alt="Qimat"
              width={140}
              height={48}
              className="h-9 w-auto dark:brightness-0 dark:invert"
            />
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Disclaimer */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-300">
              {t("footer.noteTitle")}
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {t("footer.disclaimer")}
            </p>
          </div>

          {/* Back to Top */}
          <div className="flex flex-col items-start md:items-end">
            <button
              onClick={scrollToTop}
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-medium text-slate-700 transition-all hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-white"
            >
              <ArrowUpIcon className="h-4 w-4 transition-transform group-hover:-translate-y-1" />
              {t("footer.backToTop")}
            </button>

            <p className="mt-6 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              {t("footer.madeInAfghanistan")}
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-slate-200 pt-6 dark:border-slate-800">
          <p className="text-center text-xs text-slate-500">
            © {year} Qimat. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
