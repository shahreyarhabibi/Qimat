// lib/context/CurrencyContext.js
"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";

const CurrencyContext = createContext(null);

const CURRENCIES = {
  AFN: {
    code: "AFN",
    symbol: "AFN ",
    name: "Afghan Afghani",
    flag: "🇦🇫",
    rate: 1,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    flag: "🇺🇸",
    rate: null,
    slug: "usd",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    flag: "🇪🇺",
    rate: null,
    slug: "euro",
  },
};

const LANGUAGES = {
  fa: {
    code: "fa",
    shortCode: "FA",
    name: "Farsi",
  },
  ps: {
    code: "ps",
    shortCode: "PS",
    name: "Pashto",
  },
  en: {
    code: "en",
    shortCode: "EN",
    name: "English",
  },
};

export function CurrencyProvider({ children, items = [] }) {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    if (typeof window === "undefined") return "AFN";
    const saved = localStorage.getItem("qimat_currency");
    return saved && CURRENCIES[saved] ? saved : "AFN";
  });

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("qimat_language");
    return saved && LANGUAGES[saved] ? saved : "en";
  });

  const afnLabel = selectedLanguage === "en" ? "AFN" : "اف";

  const exchangeRates = useMemo(() => {
    const rates = { AFN: 1 };

    const usdItem = items.find(
      (item) =>
        item.slug === "usd" ||
        item.name?.toLowerCase() === "us dollar" ||
        item.name?.toLowerCase() === "usd",
    );
    if (usdItem?.price) {
      rates.USD = usdItem.price;
    }

    const eurItem = items.find(
      (item) =>
        item.slug === "euro" ||
        item.name?.toLowerCase() === "euro" ||
        item.name?.toLowerCase() === "eur",
    );
    if (eurItem?.price) {
      rates.EUR = eurItem.price;
    }

    return rates;
  }, [items]);

  const convertPrice = (priceInAFN) => {
    if (typeof priceInAFN !== "number" || Number.isNaN(priceInAFN)) return 0;

    const rate = exchangeRates[selectedCurrency];
    if (!rate || selectedCurrency === "AFN") {
      return priceInAFN;
    }

    return priceInAFN / rate;
  };

  const formatPrice = (priceInAFN, options = {}) => {
    const { showSymbol = true } = options;
    const converted = convertPrice(priceInAFN);
    const currency = CURRENCIES[selectedCurrency];
    const rounded = Math.round(converted);
    const formatted = rounded.toLocaleString();

    if (!showSymbol) return formatted;

    if (selectedCurrency === "AFN") {
      return `${formatted} ${afnLabel}`;
    }

    return `${currency.symbol}${formatted}`;
  };

  const getCurrencyLabel = (code) => {
    if (code === "AFN") return afnLabel;
    return code;
  };

  const changeCurrency = (code) => {
    if (CURRENCIES[code]) {
      setSelectedCurrency(code);
      localStorage.setItem("qimat_currency", code);
    }
  };

  const changeLanguage = (code) => {
    if (LANGUAGES[code]) {
      setSelectedLanguage(code);
      localStorage.setItem("qimat_language", code);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = selectedLanguage;
      document.documentElement.dir =
        selectedLanguage === "fa" || selectedLanguage === "ps" ? "rtl" : "ltr";
    }
  }, [selectedLanguage]);

  const value = {
    selectedCurrency,
    selectedLanguage,
    currencies: CURRENCIES,
    languages: LANGUAGES,
    exchangeRates,
    convertPrice,
    formatPrice,
    changeCurrency,
    changeLanguage,
    afnLabel,
    getCurrencyLabel,
    currentCurrency: CURRENCIES[selectedCurrency],
    currentLanguage: LANGUAGES[selectedLanguage],
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}

export { CURRENCIES };
export { LANGUAGES };
