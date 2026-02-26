// app/admin/sources/page.js
"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [newSource, setNewSource] = useState({
    name: "",
    nameFa: "",
    namePs: "",
    shortName: "",
    shortNameFa: "",
    shortNamePs: "",
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const res = await fetch("/api/admin/sources");
      const data = await res.json();
      if (data.success) setSources(data.data);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load sources");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSource.name.trim()) return;

    try {
      const res = await fetch("/api/admin/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSource.name,
          nameFa: newSource.nameFa,
          namePs: newSource.namePs,
          shortName: newSource.shortName || newSource.name,
          shortNameFa: newSource.shortNameFa,
          shortNamePs: newSource.shortNamePs,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchSources();
        setNewSource({
          name: "",
          nameFa: "",
          namePs: "",
          shortName: "",
          shortNameFa: "",
          shortNamePs: "",
        });
        setShowAddForm(false);
      } else {
        setError(data.error || "Failed to add source");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to add source");
    }
  };

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/admin/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await res.json();
      if (data.success) {
        fetchSources();
        setEditingId(null);
        setEditData({});
      } else {
        setError(data.error || "Failed to update source");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to update source");
    }
  };

  const handleDelete = async (id, productCount) => {
    if (productCount > 0) {
      alert(
        `This source has ${productCount} products. Products will have their source removed.`,
      );
    }

    if (!confirm("Are you sure you want to delete this source?")) return;

    try {
      const res = await fetch(`/api/admin/sources/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (data.success) {
        fetchSources();
      } else {
        setError(data.error || "Failed to delete source");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to delete source");
    }
  };

  const startEditing = (source) => {
    setEditingId(source.id);
    setEditData({
      name: source.name,
      nameFa: source.name_fa,
      namePs: source.name_ps,
      shortName: source.short_name,
      shortNameFa: source.short_name_fa,
      shortNamePs: source.short_name_ps,
    });
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
            Sources / Locations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage market locations and price sources
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
        >
          <PlusIcon className="h-4 w-4" />
          Add Source
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl bg-rose-50 p-4 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-rose-500 hover:text-rose-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">
            Add New Source
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Sarai Shahzada"
                value={newSource.name}
                onChange={(e) =>
                  setNewSource({ ...newSource, name: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name (Farsi)
              </label>
              <input
                type="text"
                placeholder="Full name in Farsi"
                value={newSource.nameFa}
                onChange={(e) =>
                  setNewSource({ ...newSource, nameFa: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Full Name (Pashto)
              </label>
              <input
                type="text"
                placeholder="Full name in Pashto"
                value={newSource.namePs}
                onChange={(e) =>
                  setNewSource({ ...newSource, namePs: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Short Name
              </label>
              <input
                type="text"
                placeholder="e.g., Shahzada"
                value={newSource.shortName}
                onChange={(e) =>
                  setNewSource({ ...newSource, shortName: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Short Name (Farsi)
              </label>
              <input
                type="text"
                placeholder="Short name in Farsi"
                value={newSource.shortNameFa}
                onChange={(e) =>
                  setNewSource({ ...newSource, shortNameFa: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Short Name (Pashto)
              </label>
              <input
                type="text"
                placeholder="Short name in Pashto"
                value={newSource.shortNamePs}
                onChange={(e) =>
                  setNewSource({ ...newSource, shortNamePs: e.target.value })
                }
                className="w-full rounded-xl border-0 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleAdd}
                disabled={!newSource.name.trim()}
                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewSource({
                    name: "",
                    nameFa: "",
                    namePs: "",
                    shortName: "",
                    shortNameFa: "",
                    shortNamePs: "",
                  });
                }}
                className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sources List */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
        {sources.length > 0 ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {sources.map((source) => (
              <div
                key={source.id}
                className="flex items-center gap-4 px-6 py-4"
              >
                {editingId === source.id ? (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-1 flex-wrap gap-3">
                      <input
                        type="text"
                        value={editData.name || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        placeholder="Full name"
                        className="min-w-40 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                      <input
                        type="text"
                        value={editData.nameFa || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, nameFa: e.target.value })
                        }
                        placeholder="Full name (Farsi)"
                        className="min-w-40 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                      <input
                        type="text"
                        value={editData.namePs || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, namePs: e.target.value })
                        }
                        placeholder="Full name (Pashto)"
                        className="min-w-40 flex-1 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                      <input
                        type="text"
                        value={editData.shortName || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            shortName: e.target.value,
                          })
                        }
                        placeholder="Short name"
                        className="w-40 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                      <input
                        type="text"
                        value={editData.shortNameFa || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            shortNameFa: e.target.value,
                          })
                        }
                        placeholder="Short name (Farsi)"
                        className="w-40 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                      <input
                        type="text"
                        value={editData.shortNamePs || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            shortNamePs: e.target.value,
                          })
                        }
                        placeholder="Short name (Pashto)"
                        className="w-40 rounded-lg border-0 bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-primary/50 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      />
                    </div>
                    <button
                      onClick={() => handleUpdate(source.id)}
                      className="rounded-lg bg-emerald-100 p-2 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditData({});
                      }}
                      className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <MapPinIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {source.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>Short: {source.short_name}</span>
                        <span>•</span>
                        <span>{source.product_count || 0} products</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startEditing(source)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(source.id, source.product_count)
                      }
                      className="rounded-lg p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <MapPinIcon className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
              No sources yet
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add your first market or location source
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <PlusIcon className="h-4 w-4" />
              Add Source
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
