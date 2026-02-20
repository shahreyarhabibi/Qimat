"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { items } from "@/lib/data";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingBagIcon,
  CalculatorIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

// Helper to determine input type based on unit
const getUnitConfig = (unit) => {
  const unitLower = unit?.toLowerCase() || "";
  
  if (unitLower.includes("kg") || unitLower.includes("gram") || unitLower.includes("g")) {
    return {
      type: "weight",
      step: 0.5,
      min: 0.5,
      suffix: "kg",
      presets: [0.5, 1, 3, 5, 7, 10, 14],
      allowDecimal: true,
    };
  }
  
  if (unitLower.includes("liter") || unitLower.includes("l")) {
    return {
      type: "volume",
      step: 0.5,
      min: 0.5,
      suffix: "L",
      presets: [0.5, 1, 2, 5, 10],
      allowDecimal: true,
    };
  }
  
  if (unitLower.includes("m³") || unitLower.includes("m3")) {
    return {
      type: "volume",
      step: 1,
      min: 1,
      suffix: "m³",
      presets: [1, 5, 10, 20],
      allowDecimal: true,
    };
  }
  
  if (unitLower.includes("pack")) {
    return {
      type: "count",
      step: 1,
      min: 1,
      suffix: "pack",
      presets: [1, 2, 3, 5],
      allowDecimal: false,
    };
  }
  
  if (unitLower.includes("used")) {
    return {
      type: "device",
      step: 1,
      min: 1,
      suffix: "unit",
      presets: [1, 2],
      allowDecimal: false,
    };
  }
  
  if (unitLower.includes("usd") || unitLower.includes("eur") || unitLower.includes("gbp") || unitLower.includes("aed") || unitLower.includes("pkr") || unitLower.includes("irr")) {
    return {
      type: "currency",
      step: 10,
      min: 1,
      suffix: unit?.split(" ")[1] || "units",
      presets: [10, 50, 100, 500, 1000],
      allowDecimal: false,
    };
  }
  
  // Default
  return {
    type: "quantity",
    step: 1,
    min: 1,
    suffix: "units",
    presets: [1, 2, 5, 10],
    allowDecimal: false,
  };
};

export default function SpendingCalculator({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [quantityInput, setQuantityInput] = useState("1");
  const [basket, setBasket] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get unit config for selected item
  const unitConfig = useMemo(() => {
    if (!selectedItem) return null;
    return getUnitConfig(selectedItem.unit);
  }, [selectedItem]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return items
      .filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 6);
  }, [searchQuery]);

  // Calculate total
  const total = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [basket]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !searchRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const setQuantityValue = (nextValue) => {
    setQuantity(nextValue);
    setQuantityInput(String(nextValue));
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setShowDropdown(false);
    const config = getUnitConfig(item.unit);
    setQuantityValue(config.min);
  };

  const handleAddToBasket = () => {
    if (!selectedItem) return;

    const existingIndex = basket.findIndex((b) => b.id === selectedItem.id);

    if (existingIndex > -1) {
      const newBasket = [...basket];
      newBasket[existingIndex].quantity += quantity;
      setBasket(newBasket);
    } else {
      setBasket([
        ...basket,
        {
          ...selectedItem,
          quantity: quantity,
          unitConfig: unitConfig,
        },
      ]);
    }

    setSearchQuery("");
    setSelectedItem(null);
    setQuantityValue(1);
  };

  const handleRemoveFromBasket = (itemId) => {
    setBasket(basket.filter((item) => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    const item = basket.find((i) => i.id === itemId);
    const config = item?.unitConfig || getUnitConfig(item?.unit);
    
    if (newQuantity < config.min) {
      handleRemoveFromBasket(itemId);
      return;
    }
    setBasket(
      basket.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleClearBasket = () => {
    setBasket([]);
  };

  const formatPrice = (price) => {
    return price >= 1000 ? price.toLocaleString() : Number(price.toFixed(2)).toLocaleString();
  };

  const formatQuantity = (qty, config) => {
    if (config?.allowDecimal) {
      return qty % 1 === 0 ? qty : qty.toFixed(2);
    }
    return qty;
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
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-600 first:rounded-t-xl last:rounded-b-xl"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.unit} • {item.category}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary">
                      {formatPrice(item.price)} AFN
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Item & Quantity */}
          {selectedItem && unitConfig && (
            <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 p-4 dark:from-primary/10 dark:to-primary/20">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedItem.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {formatPrice(selectedItem.price)} AFN per {selectedItem.unit}
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

              {/* Quantity Label */}
              <div className="mt-4">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {unitConfig.type === "weight" && "How much do you need?"}
                  {unitConfig.type === "volume" && "How many liters?"}
                  {unitConfig.type === "currency" && "Amount to exchange"}
                  {unitConfig.type === "count" && "How many packs?"}
                  {unitConfig.type === "device" && "Quantity"}
                  {unitConfig.type === "quantity" && "Quantity"}
                </label>

                {/* Preset Buttons */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {unitConfig.presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQuantityValue(preset)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                        quantity === preset
                          ? "bg-primary text-white shadow-md"
                          : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-primary/50 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600"
                      }`}
                    >
                      {preset} {unitConfig.suffix}
                    </button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex flex-1 items-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-700 dark:ring-slate-600">
                    <button
                      onClick={() =>
                        setQuantityValue(Math.max(unitConfig.min, quantity - unitConfig.step))
                      }
                      className="rounded-l-xl p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={unitConfig.min}
                      step={unitConfig.step}
                      value={quantityInput}
                      onChange={(e) => {
                        const rawValue = e.target.value;
                        setQuantityInput(rawValue);

                        if (rawValue === "") return;

                        const val = parseFloat(rawValue);
                        if (!isNaN(val) && val >= unitConfig.min) {
                          setQuantity(unitConfig.allowDecimal ? val : Math.floor(val));
                        }
                      }}
                      onBlur={() => {
                        if (quantityInput === "") {
                          setQuantityValue(quantity);
                          return;
                        }

                        const val = parseFloat(quantityInput);
                        if (isNaN(val) || val < unitConfig.min) {
                          setQuantityValue(unitConfig.min);
                          return;
                        }

                        setQuantityValue(
                          unitConfig.allowDecimal ? val : Math.floor(val)
                        );
                      }}
                      className="w-full border-x border-slate-200 bg-transparent py-2 text-center text-sm font-semibold text-slate-900 focus:outline-none dark:border-slate-600 dark:text-white"
                    />
                    <button
                      onClick={() => setQuantityValue(quantity + unitConfig.step)}
                      className="rounded-r-xl p-2.5 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {unitConfig.suffix}
                  </span>
                </div>
              </div>

              {/* Subtotal & Add Button */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Subtotal</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatPrice(selectedItem.price * quantity)}{" "}
                    <span className="text-sm font-normal text-slate-500">AFN</span>
                  </p>
                </div>
                <button
                  onClick={handleAddToBasket}
                  className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary/90 hover:shadow-xl"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add to List
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Basket Items */}
        <div className="flex-1 overflow-y-auto p-5">
          {basket.length > 0 ? (
            <div className="space-y-3">
              {/* Basket Header */}
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

              {/* Items List */}
              {basket.map((item) => {
                const config = item.unitConfig || getUnitConfig(item.unit);
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
                        {formatQuantity(item.quantity, config)} {config.suffix} × {formatPrice(item.price)} AFN
                      </p>
                    </div>

                    {/* Quick Quantity Adjust */}
                    <div className="flex items-center gap-1 rounded-lg bg-white px-1 py-0.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-600 dark:ring-slate-500">
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity - config.step)
                        }
                        className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <MinusIcon className="h-3 w-3" />
                      </button>
                      <span className="min-w-[2rem] text-center text-xs font-medium text-slate-700 dark:text-slate-200">
                        {formatQuantity(item.quantity, config)}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity + config.step)
                        }
                        className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <PlusIcon className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Item Total */}
                    <div className="w-20 text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                      <p className="text-[10px] text-slate-400">AFN</p>
                    </div>

                    {/* Remove Button */}
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
                Search and add items to calculate your spending
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
                  {formatPrice(total)}{" "}
                  <span className="text-sm font-normal text-slate-500">AFN</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Approximately
                </p>
                <p className="text-lg font-semibold text-primary">
                  ${(total / 70.5).toFixed(2)} USD
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// Floating Button Component for Mobile
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
