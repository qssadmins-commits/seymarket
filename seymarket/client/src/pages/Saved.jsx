import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard.jsx";
import { useFavorites } from "../lib/useFavorites.js";

export default function Saved() {
  const { favorites } = useFavorites();

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <p className="eyebrow">Your list</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Saved favorites</h1>
      <p className="mt-2 max-w-xl text-stone">
        Products you've hearted while browsing, kept on this device so you can find them again.
      </p>

      {favorites.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center gap-3 p-14 text-center">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal/40">
            <path d="M12 21s-7.5-4.6-10-9.1C.4 8.2 2 4.5 5.6 4c2-.3 3.8.7 6.4 3.1C14.6 4.7 16.4 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.9C19.5 16.4 12 21 12 21z" />
          </svg>
          <p className="font-display text-xl font-semibold text-ink">Nothing saved yet</p>
          <p className="max-w-sm text-stone">Tap the heart on any product while browsing to keep it here.</p>
          <Link to="/" className="btn-primary mt-2">Start browsing</Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {favorites.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
