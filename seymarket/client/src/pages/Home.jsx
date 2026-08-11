import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

const CATEGORY_ICONS = {
  "Food & Drink": "🍽️",
  "Crafts & Art": "🎨",
  "Clothing & Accessories": "👕",
  "Beauty & Wellness": "🌿",
  "Home & Garden": "🏡",
  Other: "🛍️"
};

const SORT_LABELS = {
  newest: "Newest first",
  popular: "Most viewed",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  name_asc: "Name: A to Z"
};

export default function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";
  const category = params.get("category") || "All";
  const sort = params.get("sort") || "newest";
  const priceMin = params.get("priceMin") || "";
  const priceMax = params.get("priceMax") || "";
  const inStock = params.get("inStock") === "1";
  const verifiedOnly = params.get("verifiedOnly") === "1";
  const page = parseInt(params.get("page") || "1", 10);

  const [categories, setCategories] = useState([]);
  const [result, setResult] = useState(null); // { items, total, page, totalPages }
  const [inputValue, setInputValue] = useState(search);
  const [priceMinInput, setPriceMinInput] = useState(priceMin);
  const [priceMaxInput, setPriceMaxInput] = useState(priceMax);
  const [error, setError] = useState("");

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setResult(null);
    api
      .products({ search, category, sort, priceMin, priceMax, inStock: inStock ? "1" : "", verifiedOnly: verifiedOnly ? "1" : "", page, pageSize: 12 })
      .then(setResult)
      .catch((e) => setError(e.message));
  }, [search, category, sort, priceMin, priceMax, inStock, verifiedOnly, page]);

  const updateParam = (updates, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (resetPage) next.delete("page");
    setParams(next);
  };

  const setSearch = (value) => updateParam({ q: value || undefined });
  const setCategory = (value) => updateParam({ category: value && value !== "All" ? value : undefined });
  const setSort = (value) => updateParam({ sort: value && value !== "newest" ? value : undefined });
  const applyPriceRange = () => updateParam({ priceMin: priceMinInput || undefined, priceMax: priceMaxInput || undefined });
  const toggleInStock = () => updateParam({ inStock: !inStock ? "1" : undefined });
  const toggleVerifiedOnly = () => updateParam({ verifiedOnly: !verifiedOnly ? "1" : undefined });
  const goToPage = (p) => {
    updateParam({ page: p > 1 ? String(p) : undefined }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const clearFilters = () => {
    setPriceMinInput("");
    setPriceMaxInput("");
    setParams(new URLSearchParams());
  };

  const resultsTitle = useMemo(() => {
    if (search) return `Results for "${search}"`;
    if (category !== "All") return category;
    return "All products";
  }, [search, category]);

  const hasActiveFilters = Boolean(search || category !== "All" || priceMin || priceMax || inStock || verifiedOnly);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-teal text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-hibiscus/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-palm/25 blur-3xl" />
        {/* Palm frond motif */}
        <svg className="pointer-events-none absolute -right-6 bottom-0 h-48 w-48 text-palm-light/30 sm:h-64 sm:w-64" viewBox="0 0 200 200" fill="none">
          <path d="M100 190C100 190 92 140 100 100C108 60 140 30 180 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M100 100C100 100 70 85 40 90" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M100 80C100 80 72 60 50 55" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M110 60C110 60 95 30 100 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          <path d="M118 70C118 70 145 55 165 45" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 sm:pb-24 sm:pt-20">
          <p className="eyebrow !text-hibiscus-light">Made by island sellers</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-semibold leading-[1.08] sm:text-[52px]">
            Find local Seychelles shops without scrolling ten Instagram pages.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-sand/85">
            Browse and search real products from small sellers across the islands —
            crafts, food, clothing and more, all in one place.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(inputValue.trim());
            }}
            className="mt-8 flex max-w-xl gap-2 rounded-full bg-white p-1.5 shadow-lift"
          >
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              type="text"
              placeholder='Search for a product, e.g. "coconut soap"'
              className="min-w-0 flex-1 rounded-full bg-transparent px-4 py-2 text-[15px] text-ink placeholder:text-stone focus:outline-none"
            />
            <button type="submit" className="btn-primary shrink-0">
              Search
            </button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory("All")}
            className={category === "All" ? "chip-active" : "chip"}
          >
            All
          </button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={category === c ? "chip-active" : "chip"}>
              <span className="mr-1">{CATEGORY_ICONS[c] || "🛍️"}</span>
              {c}
            </button>
          ))}
        </div>

        {/* Filter bar: price range + toggles */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl2 border border-black/[0.06] bg-card p-4">
          <div>
            <label className="label !mb-1">Min price (SCR)</label>
            <input
              type="number"
              min="0"
              className="input !w-28 !py-1.5"
              value={priceMinInput}
              onChange={(e) => setPriceMinInput(e.target.value)}
              onBlur={applyPriceRange}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label !mb-1">Max price (SCR)</label>
            <input
              type="number"
              min="0"
              className="input !w-28 !py-1.5"
              value={priceMaxInput}
              onChange={(e) => setPriceMaxInput(e.target.value)}
              onBlur={applyPriceRange}
              placeholder="Any"
            />
          </div>
          <button type="button" onClick={applyPriceRange} className="btn-secondary !py-1.5 !px-4 text-sm">
            Apply
          </button>
          <label className="ml-1 flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={inStock} onChange={toggleInStock} className="h-4 w-4 rounded accent-teal" />
            In stock only
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={verifiedOnly} onChange={toggleVerifiedOnly} className="h-4 w-4 rounded accent-teal" />
            Verified shops only
          </label>
          {hasActiveFilters && (
            <button type="button" onClick={clearFilters} className="btn-ghost ml-auto !py-1.5 !px-4 text-sm">
              Clear all filters
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink">{resultsTitle}</h2>
            {result && <span className="text-sm text-stone">{result.total} item{result.total === 1 ? "" : "s"}</span>}
          </div>

          <label className="flex items-center gap-2 text-sm text-stone">
            Sort by
            <select className="select !py-2 !w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

        {!result && !error && (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-xl2 bg-sand-deep" />
            ))}
          </div>
        )}

        {result && result.items.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center">
            <div className="font-display text-2xl font-semibold text-ink">No products found</div>
            <p className="mt-2 max-w-sm text-stone">
              Try a different search term, widen your filters, or browse a different category.
            </p>
          </div>
        )}

        {result && result.items.length > 0 && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {result.items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {result.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  className="btn-secondary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  ← Previous
                </button>
                <span className="px-3 text-sm text-stone">
                  Page {result.page} of {result.totalPages}
                </span>
                <button
                  className="btn-secondary !px-4 !py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={page >= result.totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
