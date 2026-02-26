// app/admin/prices/page.js
"use client";

import { useState, useEffect } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

export default function PricesPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updateDate, setUpdateDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [prices, setPrices] = useState({});
  const [message, setMessage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        // Initialize prices with current prices
        const initialPrices = {};
        data.data.forEach((p) => {
          initialPrices[p.id] = p.current_price || "";
        });
        setPrices(initialPrices);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handlePriceChange = (productId, value) => {
    setPrices({ ...prices, [productId]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Filter products with changed prices
    const updates = products
      .filter((p) => {
        const newPrice = parseFloat(prices[p.id]);
        const currentPrice = parseFloat(p.current_price);
        return !isNaN(newPrice) && newPrice > 0 && newPrice !== currentPrice;
      })
      .map((p) => ({
        productId: p.id,
        price: parseFloat(prices[p.id]),
      }));

    if (updates.length === 0) {
      setMessage({ type: "info", text: "No price changes to save" });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates, date: updateDate }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: `Successfully updated ${updates.length} prices`,
        });
        fetchProducts(); // Refresh
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update" });
      }
    } catch (error) {
      console.error("Error updating prices:", error);
      setMessage({ type: "error", text: "Failed to update prices" });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = categoryFilter
    ? products.filter((p) => p.category_slug === categoryFilter)
    : products;

  const getDaysAgo = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = today - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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
            Update Prices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Bulk update product prices for a specific date
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="sr-only">Update Date</label>
            <input
              type="date"
              value={updateDate}
              onChange={(e) => setUpdateDate(e.target.value)}
              className="rounded-xl border-0 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              : message.type === "error"
                ? "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Category Filter */}
      <div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border-0 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Table */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  New Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Last Updated
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredProducts.map((product) => {
                const daysAgo = getDaysAgo(product.last_price_date);
                const isStale = daysAgo !== null && daysAgo > 7;
                const hasChanged =
                  prices[product.id] &&
                  parseFloat(prices[product.id]) !==
                    parseFloat(product.current_price);

                return (
                  <tr
                    key={product.id}
                    className={`${
                      isStale ? "bg-amber-50/50 dark:bg-amber-900/10" : ""
                    } hover:bg-slate-50 dark:hover:bg-slate-700/50`}
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {product.name}
                        </p>
                        <p className="text-xs text-slate-500">{product.unit}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {product.category_name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {product.current_price
                          ? Number(product.current_price).toLocaleString()
                          : "—"}{" "}
                        AFN
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={prices[product.id] || ""}
                          onChange={(e) =>
                            handlePriceChange(product.id, e.target.value)
                          }
                          placeholder="Enter price"
                          className={`w-32 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700 ${
                            hasChanged ? "ring-primary" : ""
                          }`}
                        />
                        {hasChanged && (
                          <span className="text-xs font-medium text-primary">
                            Changed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm ${
                            isStale
                              ? "font-medium text-amber-600 dark:text-amber-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {product.last_price_date || "Never"}
                        </span>
                        {isStale && (
                          <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
