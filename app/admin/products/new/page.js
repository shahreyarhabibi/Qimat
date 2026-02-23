// app/admin/products/new/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    source: "",
    unit: "",
    image: "",
    price: "",
    priceDate: new Date().toISOString().split("T")[0],
    isActive: true,
    calculator: {
      baseQuantity: 1,
      displayUnit: "kg",
      step: 1,
      min: 1,
      presets: [],
    },
    priceUnits: [],
  });

  useEffect(() => {
    fetchCategories();
    fetchSources();
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    if (data.success) setCategories(data.data);
  };

  const fetchSources = async () => {
    const res = await fetch("/api/admin/sources");
    const data = await res.json();
    if (data.success) setSources(data.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/admin/products");
      } else {
        alert(data.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  const addPreset = () => {
    setFormData({
      ...formData,
      calculator: {
        ...formData.calculator,
        presets: [...formData.calculator.presets, { label: "", value: "" }],
      },
    });
  };

  const removePreset = (index) => {
    setFormData({
      ...formData,
      calculator: {
        ...formData.calculator,
        presets: formData.calculator.presets.filter((_, i) => i !== index),
      },
    });
  };

  const updatePreset = (index, field, value) => {
    const newPresets = [...formData.calculator.presets];
    newPresets[index] = { ...newPresets[index], [field]: value };
    setFormData({
      ...formData,
      calculator: { ...formData.calculator, presets: newPresets },
    });
  };

  const addPriceUnit = () => {
    setFormData({
      ...formData,
      priceUnits: [...formData.priceUnits, { label: "", multiplier: "" }],
    });
  };

  const removePriceUnit = (index) => {
    setFormData({
      ...formData,
      priceUnits: formData.priceUnits.filter((_, i) => i !== index),
    });
  };

  const updatePriceUnit = (index, field, value) => {
    const newPriceUnits = [...formData.priceUnits];
    newPriceUnits[index] = { ...newPriceUnits[index], [field]: value };
    setFormData({ ...formData, priceUnits: newPriceUnits });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeftIcon className="h-5 w-5 text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Add New Product
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create a new product with price tracking
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Basic Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Haji Aziz Rice"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Source/Location
              </label>
              <select
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              >
                <option value="">Select source</option>
                {sources.map((src) => (
                  <option key={src.slug} value={src.slug}>
                    {src.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Unit *
              </label>
              <input
                type="text"
                required
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                placeholder="e.g., 1 sack (24.5 kg)"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Image Path
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="/products/product-name.jpg"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                placeholder="Product description..."
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Initial Price */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Initial Price
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Price (AFN) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                placeholder="0.00"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Price Date *
              </label>
              <input
                type="date"
                required
                value={formData.priceDate}
                onChange={(e) =>
                  setFormData({ ...formData, priceDate: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Calculator Config */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Calculator Configuration
          </h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Configure how this product works in the spending calculator
          </p>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Base Quantity
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.calculator.baseQuantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    calculator: {
                      ...formData.calculator,
                      baseQuantity: parseFloat(e.target.value) || 1,
                    },
                  })
                }
                placeholder="1"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
              <p className="mt-1 text-xs text-slate-500">
                Price is for this quantity
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Display Unit
              </label>
              <input
                type="text"
                value={formData.calculator.displayUnit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    calculator: {
                      ...formData.calculator,
                      displayUnit: e.target.value,
                    },
                  })
                }
                placeholder="kg"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Step
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.calculator.step}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    calculator: {
                      ...formData.calculator,
                      step: parseFloat(e.target.value) || 1,
                    },
                  })
                }
                placeholder="1"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Min
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.calculator.min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    calculator: {
                      ...formData.calculator,
                      min: parseFloat(e.target.value) || 0.5,
                    },
                  })
                }
                placeholder="0.5"
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
          </div>

          {/* Presets */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Quick Select Presets
              </label>
              <button
                type="button"
                onClick={addPreset}
                className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
              >
                <PlusIcon className="h-4 w-4" />
                Add Preset
              </button>
            </div>

            {formData.calculator.presets.length > 0 ? (
              <div className="space-y-2">
                {formData.calculator.presets.map((preset, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={preset.label}
                      onChange={(e) =>
                        updatePreset(index, "label", e.target.value)
                      }
                      placeholder="Label (e.g., 1 kg)"
                      className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={preset.value}
                      onChange={(e) =>
                        updatePreset(index, "value", parseFloat(e.target.value))
                      }
                      placeholder="Value"
                      className="w-24 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => removePreset(index)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                No presets added. Add presets like "1 kg", "1 ser (7 kg)", etc.
              </p>
            )}
          </div>
        </div>

        {/* Price Units */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Price Display Units
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Alternative units to show price (e.g., per kg, per ser)
              </p>
            </div>
            <button
              type="button"
              onClick={addPriceUnit}
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              <PlusIcon className="h-4 w-4" />
              Add Unit
            </button>
          </div>

          {formData.priceUnits.length > 0 ? (
            <div className="space-y-2">
              {formData.priceUnits.map((unit, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={unit.label}
                    onChange={(e) =>
                      updatePriceUnit(index, "label", e.target.value)
                    }
                    placeholder="Label (e.g., 1 kg)"
                    className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={unit.multiplier}
                    onChange={(e) =>
                      updatePriceUnit(
                        index,
                        "multiplier",
                        parseFloat(e.target.value),
                      )
                    }
                    placeholder="Multiplier"
                    className="w-32 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => removePriceUnit(index)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No price units added.</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Link
            href="/admin/products"
            className="flex-1 rounded-xl bg-slate-100 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
