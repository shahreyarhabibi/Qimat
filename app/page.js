// app/page.js
"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { useProducts } from "@/lib/hooks/useProducts";
import { useFavorites } from "@/lib/hooks/useFavorites";
import { CurrencyProvider, useCurrency } from "@/lib/context/CurrencyContext";
import TopNav from "@/components/TopNav";
import FilterBar from "@/components/FilterBar";
import PriceCard from "@/components/PriceCard";
import PriceListItem from "@/components/PriceListItem";
import ProductModal from "@/components/ProductModal";
import SpendingCalculator, {
  CalculatorFAB,
} from "@/components/SpendingCalculator";
import SiteFooter from "@/components/SiteFooter";
import FullScreenLoader from "@/components/FullScreenLoader";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { useI18n } from "@/lib/i18n/useI18n";
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

export default function Home() {
  const { items, categories, loading, error } = useProducts();
  const providerItems = loading || error ? [] : items;

  return (
    <CurrencyProvider items={providerItems}>
      <HomeContent
        items={items}
        categories={categories}
        loading={loading}
        error={error}
      />
    </CurrencyProvider>
  );
}

function HomeContent({ items, categories, loading, error }) {
  const { t } = useI18n();
  const { selectedLanguage } = useCurrency();
  const { favoriteIds, favoriteSet, isFavorite, toggleFavorite } =
    useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window === "undefined") return "grid";
    const saved = localStorage.getItem("qimat_view_mode");
    return saved === "list" ? "list" : "grid";
  });
  const desktopCalcRef = useRef(null);
  const mobileCalcRef = useRef(null);

  const pickLocalized = useCallback(
    (enValue, faValue, psValue) => {
      if (selectedLanguage === "fa" && faValue) return faValue;
      if (selectedLanguage === "ps" && psValue) return psValue;
      return enValue;
    },
    [selectedLanguage],
  );

  const localizedItems = useMemo(() => {
    return items.map((item) => ({
      ...item,
      name: pickLocalized(item.name, item.nameFa, item.namePs),
      unit: pickLocalized(item.unit, item.unitFa, item.unitPs),
      description: pickLocalized(
        item.description,
        item.descriptionFa,
        item.descriptionPs,
      ),
      source: item.source
        ? {
            ...item.source,
            name: pickLocalized(
              item.source.name,
              item.source.nameFa,
              item.source.namePs,
            ),
            shortName: pickLocalized(
              item.source.shortName,
              item.source.shortNameFa,
              item.source.shortNamePs,
            ),
          }
        : item.source,
    }));
  }, [items, pickLocalized]);

  const localizedCategories = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      name: pickLocalized(cat.name, cat.nameFa, cat.namePs),
    }));
  }, [categories, pickLocalized]);

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setCurrentPage(1);
    localStorage.setItem("qimat_view_mode", mode);
  };

  const handleSearchQueryChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setCurrentPage(1);
  };

  const itemsPerPage = viewMode === "grid" ? 15 : 18;

  const filteredItems = useMemo(() => {
    const filtered = localizedItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory
        ? true
        : item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // If user has favorites, pin them first. Otherwise, pin featured first.
    const shouldPrioritizeFavorites = favoriteIds.length > 0;
    const indexed = filtered.map((item, index) => ({ item, index }));

    indexed.sort((a, b) => {
      if (shouldPrioritizeFavorites) {
        const aFav = favoriteSet.has(Number(a.item.id)) ? 1 : 0;
        const bFav = favoriteSet.has(Number(b.item.id)) ? 1 : 0;
        if (aFav !== bFav) return bFav - aFav;
      } else {
        const aFeatured = a.item.isFeatured ? 1 : 0;
        const bFeatured = b.item.isFeatured ? 1 : 0;
        if (aFeatured !== bFeatured) return bFeatured - aFeatured;
      }

      // Keep stable original order for items with equal priority.
      return a.index - b.index;
    });

    return indexed.map((entry) => entry.item);
  }, [
    localizedItems,
    searchQuery,
    selectedCategory,
    favoriteIds.length,
    favoriteSet,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / itemsPerPage),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, safeCurrentPage, itemsPerPage]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = [1];
    const start = Math.max(2, safeCurrentPage - 1);
    const end = Math.min(totalPages - 1, safeCurrentPage + 1);

    if (start > 2) pages.push("ellipsis-left");
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    if (end < totalPages - 1) pages.push("ellipsis-right");
    pages.push(totalPages);

    return pages;
  }, [safeCurrentPage, totalPages]);

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

  if (loading) {
    return (
      <>
        <PwaInstallPrompt />
        <FullScreenLoader />
      </>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <PwaInstallPrompt />
        <TopNav
          items={[]}
          searchQuery={searchQuery}
          setSearchQuery={handleSearchQueryChange}
          favoriteIds={favoriteIds}
        />
        <main className="flex min-h-[60vh] items-center justify-center px-6">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white">
              {t("home.failedTitle")}
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              {t("home.tryAgain")}
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <PwaInstallPrompt />
      <TopNav
        items={localizedItems}
        searchQuery={searchQuery}
        setSearchQuery={handleSearchQueryChange}
        favoriteIds={favoriteIds}
      />

      <main className="mx-auto max-w-350 px-5 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          <div className="min-w-0 flex-1">
            <div className="mb-8">
              <FilterBar
                categories={localizedCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={handleCategoryChange}
              />

              <div className="relative mt-4 md:hidden">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t("topNav.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearchQueryChange(e.target.value)}
                  className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-800 dark:text-white dark:ring-slate-700"
                />
              </div>
            </div>

            {filteredItems.length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t("home.showing")}{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {(safeCurrentPage - 1) * itemsPerPage + 1}-
                    {Math.min(
                      safeCurrentPage * itemsPerPage,
                      filteredItems.length,
                    )}
                  </span>{" "}
                  /{" "}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {filteredItems.length}
                  </span>{" "}
                  {filteredItems.length === 1
                    ? t("common.item")
                    : t("common.items")}
                </p>
                <div className="inline-flex items-center rounded-lg bg-white p-0.5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                  <button
                    onClick={() => handleViewModeChange("grid")}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === "grid"
                        ? "bg-primary text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    }`}
                    title={t("topNav.gridView")}
                    aria-label={t("topNav.gridView")}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleViewModeChange("list")}
                    className={`rounded-md p-1.5 transition-colors ${
                      viewMode === "list"
                        ? "bg-primary text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    }`}
                    title={t("topNav.listView")}
                    aria-label={t("topNav.listView")}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {filteredItems.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
                  {paginatedItems.map((item) => (
                    <PriceCard
                      key={item.id}
                      item={item}
                      onClick={handleOpenModal}
                      onAdd={handleAddToSpendingList}
                      isFavorite={isFavorite(item.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {paginatedItems.map((item) => (
                    <PriceListItem
                      key={item.id}
                      item={item}
                      onClick={handleOpenModal}
                      onAdd={handleAddToSpendingList}
                      isFavorite={isFavorite(item.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-20 text-center shadow-sm ring-1 ring-slate-100 dark:bg-slate-800/50 dark:ring-slate-800">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-700">
                  <MagnifyingGlassIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                  {t("home.noItemsTitle")}
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {t("home.noItemsSubtitle")}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="mt-6 inline-flex items-center rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  {t("home.viewAll")}
                </button>
              </div>
            )}

            {filteredItems.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={safeCurrentPage === 1}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  {t("pagination.previous")}
                </button>

                {paginationItems.map((entry, index) => {
                  if (typeof entry === "string") {
                    return (
                      <span
                        key={`${entry}-${index}`}
                        className="px-2 text-sm text-slate-400"
                      >
                        ...
                      </span>
                    );
                  }

                  const isActive = entry === safeCurrentPage;
                  return (
                    <button
                      key={entry}
                      onClick={() => setCurrentPage(entry)}
                      className={`h-9 min-w-9 rounded-lg px-2 text-sm font-semibold transition ${
                        isActive
                          ? "bg-primary text-white"
                          : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                      }`}
                    >
                      {entry}
                    </button>
                  );
                })}

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={safeCurrentPage === totalPages}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
                >
                  {t("pagination.next")}
                </button>

                <p className="w-full pt-1 text-center text-xs text-slate-500 dark:text-slate-400">
                  {t("pagination.page")} {safeCurrentPage} {t("pagination.of")}{" "}
                  {totalPages}
                </p>
              </div>
            )}
          </div>

          <div className="hidden w-85 shrink-0 lg:block xl:w-95">
            <div className="sticky top-32">
              <SpendingCalculator
                ref={desktopCalcRef}
                items={localizedItems}
                isOpen={true}
                onClose={() => {}}
              />
            </div>
          </div>
        </div>
      </main>

      <CalculatorFAB onClick={() => setCalculatorOpen(true)} itemCount={0} />
      <div className="lg:hidden">
        <SpendingCalculator
          ref={mobileCalcRef}
          items={localizedItems}
          isOpen={calculatorOpen}
          onClose={() => setCalculatorOpen(false)}
        />
      </div>

      <ProductModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        isFavorite={selectedItem ? isFavorite(selectedItem.id) : false}
        onToggleFavorite={toggleFavorite}
      />
      <SiteFooter />
    </div>
  );
}
