// app/page.js
"use client";

import { useState, useMemo } from "react";
import { items } from "@/lib/data";
import TopNav from "@/components/TopNav";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications] = useState(true); // mock: true = dot visible

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
    <div className="min-h-screen bg-slate-50 pb-20 dark:bg-slate-900 md:pb-8">
      {/* Top Navigation */}
      <TopNav
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showNotificationDot={notifications}
      />

      {/* Filter Bar */}
      <FilterBar
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Items Grid */}
      <main className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {filteredItems.map((item) => (
              <PriceCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No items found.
          </p>
        )}
      </main>

      {/* Bottom Navigation (mobile only) */}
      <BottomNav />
    </div>
  );
}
