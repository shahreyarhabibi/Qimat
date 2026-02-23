// app/admin/products/[id]/page.js
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function EditProductPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sources, setSources] = useState([]);
  const [message, setMessage] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    source: "",
    unit: "",
    image: "",
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

  const [priceData, setPriceData] = useState({
    price: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [recentPrices, setRecentPrices] = useState([]);

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchSources();
  }, [id]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${id}`);
      const data = await res.json();

      if (data.success) {
        const product = data.data;
        setFormData({
          name: product.name || "",
          description: product.description || "",
          category: product.category_slug || "",
          source: product.source_slug || "",
          unit: product.unit || "",
          image: product.image_path || "",
          isActive: product.is_active === 1,
          calculator: product.calculator || {
            baseQuantity: 1,
            displayUnit: "kg",
            step: 1,
            min: 1,
            presets: [],
          },
          priceUnits: product.priceUnits || [],
        });

        setRecentPrices(product.recentPrices || []);

        // Set current price
        if (product.recentPrices?.length > 0) {
          setPriceData({
            ...priceData,
            price: product.recentPrices[0].price,
          });
        }
      } else {
        setMessage({ type: "error", text: "Product not found" });
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setMessage({ type: "error", text: "Failed to load product" });
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    setMessage(null);

    try {
      let imagePath = formData.image;

      if (selectedImageFile) {
        setUploadingImage(true);
        const imageFormData = new FormData();
        imageFormData.append("file", selectedImageFile);

        const uploadRes = await fetch("/api/admin/products/upload", {
          method: "POST",
          body: imageFormData,
        });
        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "Image upload failed");
        }

        imagePath = uploadData.data.path;
      }

      // Update product details
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, image: imagePath }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Product updated successfully" });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({
        type: "error",
        text: error.message || "Failed to update product",
      });
    } finally {
      setUploadingImage(false);
      setSaving(false);
    }
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedImageFile(null);
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl("");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleUpdatePrice = async () => {
    if (!priceData.price || !priceData.date) return;

    try {
      const res = await fetch("/api/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            { productId: parseInt(id), price: parseFloat(priceData.price) },
          ],
          date: priceData.date,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Price updated successfully" });
        fetchProduct(); // Refresh to get new price history
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to update price",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage({ type: "error", text: "Failed to update price" });
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

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    );
  }

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
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Edit Product
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formData.name || "Loading..."}
          </p>
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({ ...formData, isActive: e.target.checked })
            }
            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Active
          </span>
        </label>
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
          {message.type === "success" ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5" />
          )}
          {message.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-6 lg:col-span-2">
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
                  Product Image
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="w-full rounded-xl border-0 bg-slate-50 px-3 py-2 text-sm text-slate-900 ring-1 ring-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                  />
                  <p className="text-xs text-slate-500">
                    Upload JPG, PNG, WEBP, or GIF (max 5MB)
                  </p>
                </div>
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
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Calculator Config */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <h2 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Calculator Configuration
            </h2>

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
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                />
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
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
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
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
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
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
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
                        placeholder="Label"
                        className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={preset.value}
                        onChange={(e) =>
                          updatePreset(
                            index,
                            "value",
                            parseFloat(e.target.value),
                          )
                        }
                        placeholder="Value"
                        className="w-24 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
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
                <p className="text-sm text-slate-500">No presets added.</p>
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
                  Alternative units to show price
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
                      placeholder="Label"
                      className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
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
                      className="w-32 rounded-xl border-0 bg-slate-50 px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
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

          {/* Submit Button */}
          <div className="flex gap-3">
            <Link
              href="/admin/products"
              className="flex-1 rounded-xl bg-slate-100 px-6 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="flex-1 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {uploadingImage
                ? "Uploading image..."
                : saving
                  ? "Saving..."
                  : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Sidebar - Price Update & History */}
        <div className="space-y-6">
          {/* Quick Price Update */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Update Price
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Price (AFN)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={priceData.price}
                  onChange={(e) =>
                    setPriceData({ ...priceData, price: e.target.value })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Date
                </label>
                <input
                  type="date"
                  value={priceData.date}
                  onChange={(e) =>
                    setPriceData({ ...priceData, date: e.target.value })
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                />
              </div>
              <button
                type="button"
                onClick={handleUpdatePrice}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Update Price
              </button>
            </div>
          </div>

          {/* Price History */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
              Recent Prices
            </h3>
            {recentPrices.length > 0 ? (
              <div className="space-y-2">
                {recentPrices.slice(0, 10).map((price, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900"
                  >
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {price.date}
                    </span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {Number(price.price).toLocaleString()} AFN
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No price history</p>
            )}
          </div>

          {/* Image Preview */}
          {(imagePreviewUrl || formData.image) && (
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
                Image Preview
              </h3>
              <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-700">
                {(imagePreviewUrl || formData.image) && (
                  <Image
                    src={imagePreviewUrl || formData.image}
                    alt={formData.name || "Image preview"}
                    fill
                    className="object-cover"
                    sizes="100%"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
