"use client";

import { useState, useMemo } from "react";
import { items } from "@/lib/data";
import TopNav from "@/components/TopNav";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import ProductModal from "@/components/ProductModal";
import SpendingCalculator, { CalculatorFAB } from "@/components/SpendingCalculator";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications] = useState(true);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleOpenModal = (item) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Top Navigation */}
      <TopNav
        showNotificationDot={notifications}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">
        <div className="flex gap-8">
          {/* Left Content Area */}
          <div className="min-w-0 flex-1">
            {/* Page Header
            <div className="mb-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
                    {selectedCategory
                      ? selectedCategory.charAt(0).toUpperCase() +
                        selectedCategory.slice(1)
                      : "Today's Prices"}
                  </h1>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
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
            </div> */}

            {/* Floating Filter Bar */}
            <div className="mb-8">
              <FilterBar
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* Product Grid - 3 Columns Max */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <PriceCard key={item.id} item={item} onClick={handleOpenModal} />
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
          </div>

          {/* Right Sidebar - Spending Calculator (Desktop) */}
          <div className="hidden w-[340px] shrink-0 lg:block xl:w-[380px]">
            <div className="sticky top-32">
              <SpendingCalculator isOpen={true} onClose={() => {}} />
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Calculator FAB & Sheet */}
      <CalculatorFAB onClick={() => setCalculatorOpen(true)} itemCount={0} />
      <div className="lg:hidden">
        <SpendingCalculator
          isOpen={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
        />
      </div>

      <ProductModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
