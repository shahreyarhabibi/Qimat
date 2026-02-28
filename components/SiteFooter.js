"use client";

import { useI18n } from "@/lib/i18n/useI18n";

export default function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white/80 dark:border-slate-700/80 dark:bg-slate-900/70">
      <div className="mx-auto max-w-350 px-6 py-10 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Qimat
            </p>
            <p className="mt-2 max-w-xs text-sm text-slate-600 dark:text-slate-300">
              {t("footer.tagline")}
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("footer.linksTitle")}
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <a
                href="#"
                className="text-slate-700 transition hover:text-primary dark:text-slate-200"
              >
                {t("footer.backToTop")}
              </a>
              <a
                href="/admin"
                className="text-slate-700 transition hover:text-primary dark:text-slate-200"
              >
                {t("footer.admin")}
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("footer.noteTitle")}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("footer.disclaimer")}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200/80 pt-4 text-xs text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
          {t("footer.copyright", { year })}
        </div>
      </div>
    </footer>
  );
}
