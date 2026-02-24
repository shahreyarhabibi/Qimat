// lib/context/CurrencyContext.js
"use client";

import { createContext, useContext, useState, useMemo, useEffect } from "react";

const CurrencyContext = createContext(null);

// Currency configurations
const CURRENCIES = {
  AFN: {
    code: "AFN",
    symbol: "AFN ",
    name: "Afghan Afghani",
    flag: "🇦🇫",
    rate: 1, // Base currency
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    flag: "🇺🇸",
    rate: null, // Will be fetched from DB
    slug: "usd",
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    flag: "🇪🇺",
    rate: null, // Will be fetched from DB
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

  // Extract exchange rates from items (products)
  const exchangeRates = useMemo(() => {
    const rates = { AFN: 1 };

    // Find USD rate
    const usdItem = items.find(
      (item) =>
        item.slug === "usd" ||
        item.name?.toLowerCase() === "us dollar" ||
        item.name?.toLowerCase() === "usd",
    );
    if (usdItem?.price) {
      // usdItem.price is AFN per 1 USD
      rates.USD = usdItem.price;
    }

    // Find EUR rate
    const eurItem = items.find(
      (item) =>
        item.slug === "euro" ||
        item.name?.toLowerCase() === "euro" ||
        item.name?.toLowerCase() === "eur",
    );
    if (eurItem?.price) {
      // eurItem.price is AFN per 1 EUR
      rates.EUR = eurItem.price;
    }

    return rates;
  }, [items]);

  // Convert price from AFN to selected currency
  const convertPrice = (priceInAFN) => {
    if (typeof priceInAFN !== "number" || isNaN(priceInAFN)) return 0;

    const rate = exchangeRates[selectedCurrency];
    if (!rate || selectedCurrency === "AFN") {
      return priceInAFN;
    }

    // Convert: AFN → Selected Currency
    // If 1 USD = 70.5 AFN, then 100 AFN = 100 / 70.5 USD
    return priceInAFN / rate;
  };

  // Format price with currency symbol
  const formatPrice = (priceInAFN, options = {}) => {
    const { showSymbol = true } = options;
    const converted = convertPrice(priceInAFN);
    const currency = CURRENCIES[selectedCurrency];
    const rounded = Math.round(converted);
    const formatted = rounded.toLocaleString();

    if (showSymbol) {
      if (selectedCurrency === "AFN") {
        return `${formatted} AFN`;
      }
      return `${currency.symbol}${formatted}`;
    }
    return formatted;
  };

  // Change currency
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
