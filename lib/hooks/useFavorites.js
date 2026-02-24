"use client";

import { useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "qimat_favorites";

function parseFavorites(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState(() => {
    if (typeof window === "undefined") return [];
    return parseFavorites(localStorage.getItem(FAVORITES_KEY));
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    const onStorage = (event) => {
      if (event.key === FAVORITES_KEY) {
        setFavoriteIds(parseFavorites(event.newValue));
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const toggleFavorite = (productId) => {
    const id = Number(productId);
    if (!Number.isInteger(id) || id <= 0) return;

    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  };

  const isFavorite = (productId) => favoriteSet.has(Number(productId));

  return {
    favoriteIds,
    favoriteSet,
    isFavorite,
    toggleFavorite,
  };
}
