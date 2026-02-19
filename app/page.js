"use client";

import { useState, useMemo } from "react";
import { items } from "@/lib/data";
import TopNav from "@/components/TopNav";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications] = useState(true);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showNotificationDot={notifications}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                {selectedCategory
                  ? selectedCategory.charAt(0).toUpperCase() +
                    selectedCategory.slice(1)
                  : "Today's Prices"}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Track real-time prices across different categories
              </p>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredItems.length}
              </span>{" "}
              items found
            </p>
          </div>
        </div>

        {/* Floating Filter Bar */}
        <div className="mb-6">
          <FilterBar
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        </div>

        {/* Product Grid */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredItems.map((item) => (
              <PriceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
              <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
              No items found
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search or filter to find what you&apos;re
              looking for.
            </p>
            <button
              onClick={() => setSelectedCategory(null)}
              className="btn btn-primary btn-sm mt-6 rounded-full px-6"
            >
              View All Items
            </button>
          </div>
        )}
      </main>
    </div>
  );
}