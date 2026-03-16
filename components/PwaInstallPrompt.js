"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/useI18n";

const DISMISS_KEY = "qimat_pwa_dismissed_until";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "");
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [hidden, setHidden] = useState(true);
  const { t } = useI18n();

  const canShow = useMemo(() => {
    if (typeof window === "undefined") return false;
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedUntil && Date.now() < dismissedUntil) return false;
    if (isStandalone()) return false;
    return true;
  }, []);

  useEffect(() => {
    if (!canShow) return;

    const onBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setHidden(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, [canShow]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
    setHidden(true);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      await deferredPrompt.userChoice;
    } finally {
      setDeferredPrompt(null);
      setHidden(true);
    }
  };

  if (hidden) return null;

  const iosHint = isIos();

  return (
    <div className="fixed inset-x-0 bottom-4 z-60 mx-auto w-[92%] max-w-lg rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-slate-700/70 dark:bg-slate-900/95">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Image
            src="/qimat-logo.png"
            alt={t("pwa.logoAlt")}
            width={32}
            height={32}
            className="h-3 w-auto brightness-0 invert"
          />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-slate-900 dark:text-slate-100">
            {t("pwa.title")}
          </p>
          <p className="text-slate-500 dark:text-slate-300">
            {iosHint ? t("pwa.iosHint") : t("pwa.body")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {t("pwa.notNow")}
          </button>
          {!iosHint && (
            <button
              type="button"
              onClick={install}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary/90"
            >
              {t("pwa.install")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
