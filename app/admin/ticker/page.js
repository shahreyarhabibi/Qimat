// app/admin/ticker/page.js
"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  Bars3Icon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function TickerPage() {
  const [products, setProducts] = useState([]);
  const [tickerItems, setTickerItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, tickerRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/ticker"),
      ]);

      const productsData = await productsRes.json();
      const tickerData = await tickerRes.json();

      if (productsData.success) setProducts(productsData.data);
      if (tickerData.success) setTickerItems(tickerData.data.map((t) => t.id));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToTicker = (productId) => {
    if (!tickerItems.includes(productId)) {
      setTickerItems([...tickerItems, productId]);
    }
  };

  const handleRemoveFromTicker = (productId) => {
    setTickerItems(tickerItems.filter((id) => id !== productId));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/ticker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: tickerItems }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Ticker updated successfully" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update" });
      }
    } catch (error) {
      console.error("Error updating ticker:", error);
      setMessage({ type: "error", text: "Failed to update ticker" });
    } finally {
      setSaving(false);
    }
  };

  const tickerProducts = tickerItems
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  const availableProducts = products.filter(
    (p) => !tickerItems.includes(p.id) && p.is_active,
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Ticker Configuration
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose which products appear in the top ticker
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              : "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
          }`}
        >
          <CheckCircleIcon className="h-5 w-5" />
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Ticker Items */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Current Ticker Items ({tickerProducts.length})
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Drag to reorder or remove items
          </p>

          {tickerProducts.length > 0 ? (
            <div className="space-y-2">
              {tickerProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900"
                >
                  <Bars3Icon className="h-5 w-5 cursor-move text-slate-400" />
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {product.category_name} • {product.current_price} AFN
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFromTicker(product.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-700">
              <p className="text-sm text-slate-500">No items in ticker</p>
              <p className="text-xs text-slate-400">
                Add products from the right panel
              </p>
            </div>
          )}
        </div>

        {/* Available Products */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Available Products ({availableProducts.length})
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Click to add to ticker
          </p>

          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {availableProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => handleAddToTicker(product.id)}
                className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <PlusIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {product.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {product.category_name} •{" "}
                    {Number(product.current_price).toLocaleString()} AFN
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
