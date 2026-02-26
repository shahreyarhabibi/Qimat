// app/admin/categories/page.js
"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newCategory, setNewCategory] = useState({
    name: "",
    nameFa: "",
    namePs: "",
    icon: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory),
      });

      const data = await res.json();
      if (data.success) {
        fetchCategories();
        setNewCategory({ name: "", nameFa: "", namePs: "", icon: "" });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (data.success) {
        fetchCategories();
        setEditingId(null);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchCategories();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  if (loading) {
    return (
      <div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Categories
          </h1>
          <p className="text-sm text-slate-500">Manage product categories</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            New Category
          </h3>
          <div className="flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Category name"
              value={newCategory.name}
              onChange={(e) =>
                setNewCategory({ ...newCategory, name: e.target.value })
              }
              className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Category name (Farsi)"
              value={newCategory.nameFa}
              onChange={(e) =>
                setNewCategory({ ...newCategory, nameFa: e.target.value })
              }
              className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Category name (Pashto)"
              value={newCategory.namePs}
              onChange={(e) =>
                setNewCategory({ ...newCategory, namePs: e.target.value })
              }
              className="flex-1 rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
            />
            <input
              type="text"
              placeholder="Icon (emoji)"
              value={newCategory.icon}
              onChange={(e) =>
                setNewCategory({ ...newCategory, icon: e.target.value })
              }
              className="w-24 rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
            />
            <button
              onClick={handleAdd}
              className="rounded-xl bg-primary px-4 py-2 text-white hover:bg-primary/90"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-4 px-6 py-4"
            >
              {editingId === category.id ? (
                <>
                  <input
                    type="text"
                    value={editData.icon || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, icon: e.target.value })
                    }
                    className="w-16 rounded-lg border-0 bg-slate-50 px-3 py-2 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editData.name || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="min-w-40 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editData.nameFa || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, nameFa: e.target.value })
                    }
                    placeholder="Farsi name"
                    className="min-w-40 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editData.namePs || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, namePs: e.target.value })
                    }
                    placeholder="Pashto name"
                    className="min-w-40 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700 dark:text-white"
                  />
                  <button
                    onClick={() => handleUpdate(category.id)}
                    className="rounded-lg bg-emerald-100 p-2 text-emerald-600 hover:bg-emerald-200"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-2xl">{category.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {category.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {category.product_count} products
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(category.id);
                      setEditData({
                        name: category.name,
                        nameFa: category.name_fa,
                        namePs: category.name_ps,
                        icon: category.icon,
                      });
                    }}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600"
                    disabled={category.product_count > 0}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
