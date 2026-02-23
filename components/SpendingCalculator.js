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
} from "@heroicons/react/24/outline";
import { useCurrency } from "@/lib/context/CurrencyContext";

const SpendingCalculator = forwardRef(function SpendingCalculator(
  { items = [], isOpen, onClose },
  ref,
) {
  const { formatPrice, currentCurrency, exchangeRates } = useCurrency();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [basket, setBasket] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

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
      setBasket(newBasket);
    } else {
      setBasket([
        ...basket,
        {
          ...item,
          quantity: quantityToAdd,
          totalPrice: totalPrice,
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
                Spending Calculator
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plan your shopping list
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
              placeholder="Search products..."
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
                        {item.unit} • {item.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-primary">
                        {formatDisplayPrice(item.price)}
                        {currentCurrency.code === "AFN" && (
                          <span className="ml-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            AFN
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
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:from-primary/10 dark:to-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedItem.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatDisplayPrice(selectedItem.price)}
                    {currentCurrency.code === "AFN"
                      ? " AFN"
                      : ` ${currentCurrency.code}`}{" "}
                    / {selectedItem.unit}
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
                    Quick Select
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
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Quantity Input */}
              <div className="mt-4">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Custom Amount
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
                  <span className="min-w-[50px] text-sm font-medium text-slate-500 dark:text-slate-400">
                    {calcConfig.displayUnit}
                  </span>
                </div>
              </div>

              {/* Subtotal & Add Button */}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200/50 pt-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Subtotal ({formatQuantity(quantity, calcConfig.step)}{" "}
                    {calcConfig.displayUnit})
                  </p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatDisplayPrice(calculatePrice(selectedItem, quantity))}
                    {currentCurrency.code === "AFN" && (
                      <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                        AFN
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleAddToBasket}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
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
                  Your List ({basket.length} items)
                </p>
                <button
                  onClick={handleClearBasket}
                  className="text-xs font-medium text-rose-500 hover:text-rose-600"
                >
                  Clear All
                </button>
              </div>

              {basket.map((item) => {
                const config = item.calculator || {
                  min: 1,
                  step: 1,
                  displayUnit: "unit",
                };
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
                        {config.displayUnit}
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
                      <span className="min-w-[2.5rem] text-center text-xs font-medium text-slate-700 dark:text-slate-200">
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
                            AFN
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
                Your list is empty
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Search and add items to calculate
              </p>
            </div>
          )}
        </div>

        {/* Total Footer */}
        {basket.length > 0 && (
          <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100 p-5 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total Estimated Cost
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatDisplayPrice(total)}
                  {currentCurrency.code === "AFN" && (
                    <span className="ml-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                      AFN
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                {currentCurrency.code === "AFN" && exchangeRates.USD && (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Approximately
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
                      In AFN
                    </p>
                    <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">
                      {Math.round(total).toLocaleString()} AFN
                    </p>
                  </>
                )}
              </div>
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
