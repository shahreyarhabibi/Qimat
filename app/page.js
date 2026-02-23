// app/page.js
"use client";

import { useState, useMemo, useRef } from "react";
import { useProducts } from "@/lib/hooks/useProducts";
import TopNav from "@/components/TopNav";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import ProductModal from "@/components/ProductModal";
import SpendingCalculator, {
  CalculatorFAB,
} from "@/components/SpendingCalculator";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const { items, categories, loading, error } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications] = useState(true);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const desktopCalcRef = useRef(null);
  const mobileCalcRef = useRef(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddToSpendingList = (item) => {
    desktopCalcRef.current?.addItem(item);
    mobileCalcRef.current?.addItem(item);
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Pass empty items during loading */}
        <TopNav
          items={[]}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main className="mx-auto max-w-350 px-6 py-8 lg:px-8">
          <div className="flex gap-8">
            <div className="min-w-0 flex-1">
              {/* Skeleton filter */}
              <div className="mb-8 h-14 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />

              {/* Skeleton cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700"
                  />
                ))}
              </div>
            </div>

            {/* Skeleton calculator */}
            <div className="hidden w-85 shrink-0 lg:block xl:w-95">
              <div className="h-[500px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <TopNav
          items={[]}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showNotificationDot={false}
        />
        <main className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
              Failed to load prices
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-primary mt-6"
            >
              Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Pass items to TopNav for ticker */}
      <TopNav
        items={items}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showNotificationDot={notifications}
      />

      <main className="mx-auto max-w-350 px-6 py-8 lg:px-8">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            {/* Filter Bar - pass categories from database */}
            <div className="mb-8">
              <FilterBar
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />

              <div className="relative mt-4 md:hidden">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                />
              </div>
            </div>

            {/* Product Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <PriceCard
                    key={item.id}
                    item={item}
                    onClick={handleOpenModal}
                    onAdd={handleAddToSpendingList}
                  />
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
                  Try adjusting your search or filter.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="btn btn-primary btn-sm mt-6 rounded-full px-6"
                >
                  View All Items
                </button>
              </div>
            )}
          </div>

          {/* Desktop Calculator - pass items for search */}
          <div className="hidden w-85 shrink-0 lg:block xl:w-95">
            <div className="sticky top-32">
              <SpendingCalculator
                ref={desktopCalcRef}
                items={items}
                isOpen={true}
                onClose={() => {}}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Calculator */}
      <CalculatorFAB onClick={() => setCalculatorOpen(true)} itemCount={0} />
      <div className="lg:hidden">
        <SpendingCalculator
          ref={mobileCalcRef}
          items={items}
          isOpen={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
        />
      </div>

      {/* Product Modal */}
      <ProductModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
