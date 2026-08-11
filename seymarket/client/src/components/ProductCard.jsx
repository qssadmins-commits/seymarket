import React from "react";
import { Link } from "react-router-dom";
import { useFavorites } from "../lib/useFavorites.js";
import { useCart } from "../lib/useCart.js";
import { useToast } from "../lib/ToastContext.jsx";

const NEW_WINDOW_DAYS = 7;

function isRecent(created_at) {
  if (!created_at) return false;
  const created = new Date(created_at.replace(" ", "T") + "Z");
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= NEW_WINDOW_DAYS;
}

export default function ProductCard({ product }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, getQty } = useCart();
  const showToast = useToast();
  const fav = isFavorite(product.id);
  const outOfStock = product.stock === 0;
  const inCart = getQty(product.id) > 0;

  const onToggleFav = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nowFav = toggleFavorite(product);
    showToast?.(nowFav ? "Saved to your favorites" : "Removed from favorites");
  };

  const onAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addToCart(product, 1);
    showToast?.(`Added ${product.name} to your order list`);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="card group block overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div className="relative aspect-square overflow-hidden bg-sand-deep">
        <img
          src={product.photo}
          alt={product.name}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${outOfStock ? "grayscale opacity-70" : ""}`}
        />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-teal-dark backdrop-blur">
            {product.category}
          </span>
          {isRecent(product.created_at) && !outOfStock && <span className="badge-new">New</span>}
          {outOfStock && (
            <span className="rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
              Out of stock
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleFav}
          aria-pressed={fav}
          aria-label={fav ? "Remove from favorites" : "Save to favorites"}
          className={`fav-btn absolute right-3 top-3 ${fav ? "is-fav" : ""}`}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M12 21s-7.5-4.6-10-9.1C.4 8.2 2 4.5 5.6 4c2-.3 3.8.7 6.4 3.1C14.6 4.7 16.4 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.9C19.5 16.4 12 21 12 21z" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <h3 className="font-display text-[17px] font-semibold leading-snug text-ink line-clamp-1">
          {product.name}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-sm text-stone line-clamp-1">
          {product.shop_name}
          {product.shop_verified ? (
            <svg viewBox="0 0 20 20" width="13" height="13" fill="currentColor" className="shrink-0 text-teal" aria-label="Verified shop">
              <path d="M10 1.5l2.1 1.3 2.5-.2 1 2.3 2.3 1-.2 2.5 1.3 2.1-1.3 2.1.2 2.5-2.3 1-1 2.3-2.5-.2L10 18.5l-2.1-1.3-2.5.2-1-2.3-2.3-1 .2-2.5L1 10l1.3-2.1-.2-2.5 2.3-1 1-2.3 2.5.2L10 1.5z" />
              <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="price-tag">SCR {Number(product.price).toFixed(0)}</span>
          <span className="text-xs text-stone">{product.location}</span>
        </div>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={outOfStock}
          className={`mt-3 w-full rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
            outOfStock
              ? "cursor-not-allowed bg-sand-deep text-stone"
              : inCart
              ? "bg-teal/10 text-teal-dark hover:bg-teal/20"
              : "bg-teal text-white hover:bg-teal-dark"
          }`}
        >
          {outOfStock ? "Out of stock" : inCart ? `In order list (${getQty(product.id)}) · Add another` : "Add to order list"}
        </button>
      </div>
    </Link>
  );
}
