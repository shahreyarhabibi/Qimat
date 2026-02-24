"use client";

import { useMemo } from "react";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { MESSAGES } from "@/lib/i18n";

const getByPath = (obj, path) => {
  return path.split(".").reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const interpolate = (value, params = {}) => {
  if (typeof value !== "string") return value;
  return value.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
};

export function useI18n() {
  const { selectedLanguage } = useCurrency();

  const locale = useMemo(() => {
    return MESSAGES[selectedLanguage] ? selectedLanguage : "en";
  }, [selectedLanguage]);

  const t = (key, params = {}) => {
    const value =
      getByPath(MESSAGES[locale], key) ?? getByPath(MESSAGES.en, key) ?? key;
    return interpolate(value, params);
  };

  return { t, locale };
}
