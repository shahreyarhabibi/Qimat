// lib/hooks/useProducts.js
"use client";

import useSWR from "swr";

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useProducts() {
  const { data, error, isLoading, mutate } = useSWR("/api/products", fetcher, {
    revalidateOnFocus: false, // Don't refetch when tab regains focus
    revalidateOnReconnect: false, // Don't refetch on reconnect
    dedupingInterval: 60000, // Dedupe requests within 60 seconds
    refreshInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    keepPreviousData: true, // Show stale data while fetching new
  });

  return {
    items: data?.data?.items ?? [],
    categories: data?.data?.categories ?? [],
    loading: isLoading,
    error: error?.message || (data?.success === false ? data.error : null),
    refetch: mutate,
  };
}
