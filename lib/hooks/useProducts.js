// lib/hooks/useProducts.js
"use client";

import { useState, useEffect, useCallback } from "react";

export function useProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/products");
      const result = await response.json();

      if (result.success) {
        setItems(result.data.items);
        setCategories(result.data.categories);
      } else {
        throw new Error(result.error || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    items,
    categories,
    loading,
    error,
    refetch: fetchProducts,
  };
}
