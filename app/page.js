"use client";

import { useState, useMemo } from "react";
import { items } from "@/lib/data";
import TopNav from "@/components/TopNav";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import { AdjustmentsHorizontalIcon, Bars3Icon } from "@heroicons/react/24/outline";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <FilterBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Top Navigation */}
      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showNotificationDot={notifications}
      />

      {/* Main Content Area */}
      <div className="lg:pl-72">

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {/* Mobile Header */}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              <Bars3Icon className="h-5 w-5" />
              Menu
            </button>
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {selectedCategory}
                </span>
              )}
            </div>
          </div>

          {/* Desktop Header */}
          <div className="mb-6 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedCategory
                    ? selectedCategory.charAt(0).toUpperCase() +
                      selectedCategory.slice(1)
                    : "All Products"}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Track real-time prices across different categories
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-900 dark:text-white">
                  {filteredItems.length}
                </span>
                items found
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <PriceCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-800">
                <AdjustmentsHorizontalIcon className="h-8 w-8 text-slate-400" />
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
                className="btn btn-primary btn-sm mt-4"
              >
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
