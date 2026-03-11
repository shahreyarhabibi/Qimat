// components/SpendingCalculator.jsx
"use client";

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingBagIcon,
  CalculatorIcon,
  MinusIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { useCurrency } from "@/lib/context/CurrencyContext";
import { useI18n } from "@/lib/i18n/useI18n";

const SpendingCalculator = forwardRef(function SpendingCalculator(
  { items = [], isOpen, onClose },
  ref,
) {
  const { t, locale } = useI18n();
  const { formatPrice, currentCurrency, exchangeRates, afnLabel } =
    useCurrency();
  const isRtl = locale === "fa" || locale === "ps";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [basket, setBasket] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const vazirFontBase64Ref = useRef(null);

  // Get calculator config
  const calcConfig = useMemo(() => {
    return selectedItem?.calculator || null;
  }, [selectedItem]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return items
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .slice(0, 6);
  }, [items, searchQuery]);

  // Calculate total
  const total = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [basket]);

  // Format price helper using currency context
  const formatDisplayPrice = (price) => {
    if (currentCurrency.code === "AFN") {
      return formatPrice(price, { showSymbol: false });
    }
    return formatPrice(price, { showSymbol: true });
  };

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setQuantityValue = (value) => {
    setQuantity(value);
    setQuantityInput(String(value));
  };

  const getDefaultQuantity = (item) => {
    const config = item?.calculator;
    if (!config) return 1;
    return config.defaultQuantity ?? config.baseQuantity ?? config.min ?? 1;
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowDropdown(false);
    const config = item.calculator;
    if (config) {
      setQuantityValue(getDefaultQuantity(item));
    }
  };

  // Calculate price: (price / baseQuantity) * quantity
  const calculatePrice = (item, qty) => {
    const config = item.calculator;
    if (!config) return item.price * qty;
    const pricePerUnit = item.price / config.baseQuantity;
    return pricePerUnit * qty;
  };

  const addItemToBasket = (item, qty) => {
    if (!item) return;
    const quantityToAdd = qty ?? getDefaultQuantity(item);
    const totalPrice = calculatePrice(item, quantityToAdd);
    const existingIndex = basket.findIndex((b) => b.id === item.id);

    if (existingIndex > -1) {
      const newBasket = [...basket];
      newBasket[existingIndex].quantity += quantityToAdd;
      newBasket[existingIndex].totalPrice = calculatePrice(
        item,
        newBasket[existingIndex].quantity,
      );
      newBasket[existingIndex].updatedAt = new Date().toISOString();
      setBasket(newBasket);
    } else {
      setBasket([
        ...basket,
        {
          ...item,
          quantity: quantityToAdd,
          totalPrice: totalPrice,
          addedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  useImperativeHandle(ref, () => ({
    addItem: (item) => addItemToBasket(item),
  }));

  const handleAddToBasket = () => {
    if (!selectedItem || !calcConfig) return;
    addItemToBasket(selectedItem, quantity);
    setSearchQuery("");
    setSelectedItem(null);
    setQuantityValue(1);
  };

  const handleRemoveFromBasket = (itemId) => {
    setBasket(basket.filter((item) => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    const item = basket.find((i) => i.id === itemId);
    if (!item) return;

    const config = item.calculator;
    if (!config || newQuantity < config.min) {
      handleRemoveFromBasket(itemId);
      return;
    }

    setBasket(
      basket.map((basketItem) => {
        if (basketItem.id === itemId) {
          return {
            ...basketItem,
            quantity: newQuantity,
            totalPrice: calculatePrice(basketItem, newQuantity),
            updatedAt: new Date().toISOString(),
          };
        }
        return basketItem;
      }),
    );
  };

  const handleClearBasket = () => {
    setBasket([]);
  };

  const formatQuantity = (qty, step) => {
    if (!step || step >= 1 || qty % 1 === 0) return qty;
    return qty.toFixed(2);
  };

  const formatItemDate = (value) => {
    const parsedDate = value ? new Date(value) : new Date();
    if (Number.isNaN(parsedDate.getTime())) {
      return new Date().toLocaleDateString();
    }
    return parsedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary);
  };

  const ensureVazirFont = async (doc) => {
    if (!vazirFontBase64Ref.current) {
      const response = await fetch("/fonts/Vazir-Regular.ttf");
      if (!response.ok) {
        throw new Error("Failed to load Vazir font");
      }
      const fontBuffer = await response.arrayBuffer();
      vazirFontBase64Ref.current = arrayBufferToBase64(fontBuffer);
    }
    doc.addFileToVFS("Vazir-Regular.ttf", vazirFontBase64Ref.current);
    doc.addFont("Vazir-Regular.ttf", "Vazir", "normal");
  };

  const localizeUnitText = (value) => {
    if (!isRtl) return value;
    const text = String(value ?? "");
    return text
      .replace(/\bser\b/gi, "سیر")
      .replace(/\bsack\b/gi, "بوری")
      .replace(/\bkg\b/gi, "کیلوگرام")
      .replace(/\boz\b/gi, "اونس")
      .replace(/\bcan\b/gi, "پیپ");
  };

  const handleDownloadPdf = async () => {
    if (!basket.length) return;
    const [{ jsPDF }, autoTableModule] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const autoTable = autoTableModule.default;

    const localeCode =
      locale === "fa" ? "fa-AF" : locale === "ps" ? "ps-AF" : "en-US";
    const solarDateFormatter = new Intl.DateTimeFormat(
      `${localeCode}-u-ca-persian`,
      {
        year: "numeric",
        month: "numeric",
        day: "numeric",
      },
    );
    const exportedAt = new Date();
    const currencyLabel =
      currentCurrency.code === "AFN" ? afnLabel : currentCurrency.code;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    if (isRtl) {
      await ensureVazirFont(doc);
      doc.setFont("Vazir", "normal");
    }

    const shapeText = (value) => {
      const text = String(value ?? "");
      if (isRtl && typeof doc.processArabic === "function") {
        return doc.processArabic(text);
      }
      return text;
    };

    const toPersianDigits = (value) => {
      if (!isRtl) return String(value ?? "");
      return String(value ?? "").replace(
        /\d/g,
        (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)],
      );
    };

    const formatSolarDate = (dateValue) => {
      const parts = solarDateFormatter.formatToParts(dateValue);
      const day = parts.find((part) => part.type === "day")?.value ?? "";
      const month = parts.find((part) => part.type === "month")?.value ?? "";
      const year = parts.find((part) => part.type === "year")?.value ?? "";
      return `${toPersianDigits(day)}/${toPersianDigits(month)}/${toPersianDigits(year)}`;
    };

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const rightX = pageWidth - margin;
    const leftX = margin;
    const titleX = isRtl ? rightX : leftX;
    const textAlign = isRtl ? "right" : "left";

    doc.setFontSize(18);
    doc.text(shapeText(t("calculator.pdfExportTitle")), titleX, 44, {
      align: textAlign,
    });

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(
      shapeText(
        `${t("calculator.pdfExportedOn")}: ${formatSolarDate(exportedAt)}`,
      ),
      titleX,
      64,
      { align: textAlign },
    );

    const bodyRows = basket.map((item, index) => {
      const itemDate = item.updatedAt || item.addedAt;
      const parsedDate = itemDate ? new Date(itemDate) : new Date();
      const rowDate = Number.isNaN(parsedDate.getTime())
        ? formatSolarDate(new Date())
        : formatSolarDate(parsedDate);
      const config = item.calculator || {};
      const localizedName =
        locale === "fa"
          ? item.nameFa || item.name_fa || item.name
          : locale === "ps"
            ? item.namePs || item.name_ps || item.name
            : item.name;
      const rawUnit =
        item.calculator?.displayUnit || config.displayUnit || "unit";
      const localizedUnit = localizeUnitText(rawUnit);
      const quantityLabel = `${formatQuantity(item.quantity, config.step)} ${localizedUnit}`;
      const row = [
        shapeText(toPersianDigits(String(index + 1))),
        shapeText(localizedName),
        shapeText(toPersianDigits(quantityLabel)),
        shapeText(
          `${toPersianDigits(formatDisplayPrice(item.totalPrice))} ${currencyLabel}`,
        ),
        shapeText(rowDate),
      ];
      return isRtl ? row.reverse() : row;
    });

    const headers = [
      shapeText("#"),
      shapeText(t("calculator.pdfItem")),
      shapeText(t("calculator.pdfQuantity")),
      shapeText(t("calculator.pdfPrice")),
      shapeText(t("calculator.pdfDate")),
    ];
    const tableHead = isRtl ? headers.reverse() : headers;
    const indexColumn = isRtl ? 4 : 0;

    autoTable(doc, {
      startY: 80,
      head: [tableHead],
      body: bodyRows,
      styles: {
        font: isRtl ? "Vazir" : "helvetica",
        fontSize: 10,
        halign: isRtl ? "right" : "left",
        cellPadding: 6,
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: isRtl ? "normal" : "bold",
        halign: isRtl ? "right" : "left",
      },
      columnStyles: {
        [indexColumn]: { halign: "center", cellWidth: 34 },
      },
      margin: { left: margin, right: margin },
      tableWidth: "auto",
    });

    let currentY = doc.lastAutoTable.finalY + 22;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.text(
      shapeText(
        `${t("calculator.totalEstimated")}: ${toPersianDigits(formatDisplayPrice(total))} ${currencyLabel}`,
      ),
      titleX,
      currentY,
      { align: textAlign },
    );

    currentY += 24;
    doc.setFontSize(10);
    doc.setTextColor(124, 45, 18);
    doc.text(
      shapeText(
        `${t("calculator.pdfNoteLabel")}: ${t("calculator.pdfDisclaimer")}`,
      ),
      titleX,
      currentY,
      { align: textAlign, maxWidth: pageWidth - margin * 2 },
    );

    const fileNameDate = exportedAt.toISOString().slice(0, 10);
    doc.save(`spending-list-${fileNameDate}.pdf`);
  };

  const getDisplayUnit = (item, config) => {
    const configUnit =
      typeof config?.displayUnit === "string" ? config.displayUnit.trim() : "";
    if (configUnit) return localizeUnitText(configUnit);
    return localizeUnitText(item?.unit || t("calculator.unit"));
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Calculator Panel */}
      <aside
        className={`
          fixed bottom-0 left-0 right-0 z-50 flex max-h-[85vh] flex-col rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 ease-out dark:bg-slate-800
          lg:static lg:z-auto lg:max-h-none lg:rounded-2xl lg:shadow-lg lg:ring-1 lg:ring-slate-200/80 lg:dark:ring-slate-700/80
          ${isOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CalculatorIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                {t("calculator.title")}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("calculator.subtitle")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Add Section */}
        <div className="border-b border-slate-100 p-5 dark:border-slate-700">
          {/* Search Input */}
          <div className="relative" ref={searchRef}>
            <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={t("calculator.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                setSelectedItem(null);
              }}
              onFocus={() => setShowDropdown(true)}
              className="w-full rounded-xl border-0 bg-slate-100 py-3 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700 dark:text-white"
            />

            {/* Search Dropdown */}
            {showDropdown && filteredItems.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute left-0 right-0 top-full z-10 mt-2 max-h-64 overflow-y-auto rounded-xl bg-white shadow-xl ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600"
              >
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl dark:hover:bg-slate-600"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {localizeUnitText(item.unit)} • {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-primary">
                        {formatDisplayPrice(item.price)}
                        {currentCurrency.code === "AFN" && (
                          <span className="ml-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {afnLabel}
                          </span>
                        )}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Item & Quantity */}
          {selectedItem && calcConfig && (
            <div className="mt-4 rounded-2xl bg-linear-to-br from-primary/5 to-primary/10 p-4 dark:from-primary/10 dark:to-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedItem.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDisplayPrice(selectedItem.price)}
                    {currentCurrency.code === "AFN"
                      ? ` ${afnLabel}`
                      : ` ${currentCurrency.code}`}{" "}
                    / {localizeUnitText(selectedItem.unit)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setSearchQuery("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/50"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Quick Presets */}
              {calcConfig.presets && calcConfig.presets.length > 0 && (
                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {t("calculator.quickSelect")}
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {calcConfig.presets.map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => setQuantityValue(preset.value)}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                          quantity === preset.value
                            ? "bg-primary text-white shadow-md"
                            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary/50 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600"
                        }`}
                      >
                        {localizeUnitText(preset.label)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Quantity Input */}
              <div className="mt-4">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t("calculator.customAmount")}
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">
                    <button
                      onClick={() =>
                        setQuantityValue(
                          Math.max(calcConfig.min, quantity - calcConfig.step),
                        )
                      }
                      className="rounded-l-xl p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={calcConfig.min}
                      step={calcConfig.step}
                      value={quantityInput}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        setQuantityInput(rawValue);
                        if (rawValue === "") return;
                        const val = parseFloat(rawValue);
                        if (!isNaN(val) && val >= calcConfig.min) {
                          setQuantity(val);
                        }
                      }}
                      onBlur={() => {
                        if (quantityInput === "") {
                          setQuantityValue(quantity);
                          return;
                        }
                        const val = parseFloat(quantityInput);
                        if (isNaN(val) || val < calcConfig.min) {
                          setQuantityValue(calcConfig.min);
                          return;
                        }
                        setQuantityValue(val);
                      }}
                      className="w-full border-x border-slate-200 bg-transparent py-2 text-center text-sm font-semibold text-slate-900 focus:outline-none dark:border-slate-600 dark:text-white"
                    />
                    <button
                      onClick={() =>
                        setQuantityValue(quantity + calcConfig.step)
                      }
                      className="rounded-r-xl p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="min-w-12.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {getDisplayUnit(selectedItem, calcConfig)}
                  </span>
                </div>
              </div>

              {/* Subtotal & Add Button */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/50 pt-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("calculator.subtotal")} (
                    {formatQuantity(quantity, calcConfig.step)}{" "}
                    {getDisplayUnit(selectedItem, calcConfig)})
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatDisplayPrice(calculatePrice(selectedItem, quantity))}
                    {currentCurrency.code === "AFN" && (
                      <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        {afnLabel}
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleAddToBasket}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl"
                >
                  <PlusIcon className="h-4 w-4" />
                  {t("common.add")}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Basket Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {basket.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t("calculator.yourList")} ({basket.length}{" "}
                  {t("common.items")})
                </p>
                <button
                  onClick={handleClearBasket}
                  className="text-xs font-medium text-rose-500 hover:text-rose-600"
                >
                  {t("calculator.clearAll")}
                </button>
              </div>

              {basket.map((item) => {
                const config = item.calculator || {
                  min: 1,
                  step: 1,
                  displayUnit: t("calculator.unit"),
                };
                const displayUnit = getDisplayUnit(item, config);
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatQuantity(item.quantity, config.step)}{" "}
                        {displayUnit}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-white px-1 py-0.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-600 dark:ring-slate-500">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.id,
                            item.quantity - config.step,
                          )
                        }
                        className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span className="min-w-10 text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                        {formatQuantity(item.quantity, config.step)}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(
                            item.id,
                            item.quantity + config.step,
                          )
                        }
                        className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="w-20 text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatDisplayPrice(item.totalPrice)}
                        {currentCurrency.code === "AFN" && (
                          <span className="ml-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {afnLabel}
                          </span>
                        )}
                      </p>
                      {currentCurrency.code !== "AFN" && (
                        <p className="text-[10px] text-slate-400">
                          {currentCurrency.code}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveFromBasket(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-500/20"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                <ShoppingBagIcon className="h-7 w-7 text-slate-400" />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                {t("calculator.emptyTitle")}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("calculator.emptySubtitle")}
              </p>
            </div>
          )}
        </div>

        {/* Total Footer */}
        {basket.length > 0 && (
          <div className="border-t border-slate-200 bg-linear-to-r from-slate-50 to-slate-100 p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("calculator.totalEstimated")}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatDisplayPrice(total)}
                  {currentCurrency.code === "AFN" && (
                    <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {afnLabel}
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                {currentCurrency.code === "AFN" && exchangeRates.USD && (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("calculator.approximately")}
                    </p>
                    <p className="text-lg font-semibold text-primary">
                      ${Math.round(total / exchangeRates.USD).toLocaleString()}{" "}
                      USD
                    </p>
                  </>
                )}
                {currentCurrency.code !== "AFN" && (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t("calculator.inAfn")}
                    </p>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                      {Math.round(total).toLocaleString()} {afnLabel}
                    </p>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <DocumentArrowDownIcon className="h-4 w-4" />
                {t("calculator.downloadPdf")}
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
});

SpendingCalculator.displayName = "SpendingCalculator";

export default SpendingCalculator;

export function CalculatorFAB({ onClick, itemCount }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95 lg:hidden"
    >
      <CalculatorIcon className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-xs font-bold text-slate-900">
          {itemCount}
        </span>
      )}
    </button>
  );
}
