import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import { useFavorites } from "../lib/useFavorites.js";
import { useCart } from "../lib/useCart.js";

const navLinkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-teal text-white" : "text-teal-dark hover:bg-teal/[0.06]"
  }`;

function CartIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

export default function Header() {
  const { seller } = useAuth();
  const { count: savedCount } = useFavorites();
  const { count: cartCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-sand/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-[22px] font-semibold tracking-tight text-teal-dark">
            Sey<span className="text-hibiscus">Market</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink to="/" end className={navLinkClass}>
            Browse
          </NavLink>
          <NavLink to="/cart" className={navLinkClass}>
            Order list{cartCount > 0 ? ` (${cartCount})` : ""}
          </NavLink>
          <NavLink to="/saved" className={navLinkClass}>
            Saved{savedCount > 0 ? ` (${savedCount})` : ""}
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            {seller ? "My shop" : "Sell on SeyMarket"}
          </NavLink>
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/dashboard" className="btn-primary hidden sm:inline-flex">
            {seller ? seller.shop_name : "Get started"}
          </Link>

          {/* Mobile: cart + favorites shortcuts + hamburger */}
          <Link
            to="/cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-teal-dark hover:bg-teal/[0.06] sm:hidden"
            aria-label="Order list"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hibiscus px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <Link
            to="/saved"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-teal-dark hover:bg-teal/[0.06] sm:hidden"
            aria-label="Saved products"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7.5-4.6-10-9.1C.4 8.2 2 4.5 5.6 4c2-.3 3.8.7 6.4 3.1C14.6 4.7 16.4 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.9C19.5 16.4 12 21 12 21z" />
            </svg>
            {savedCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-hibiscus px-1 text-[10px] font-bold text-white">
                {savedCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-teal-dark hover:bg-teal/[0.06] sm:hidden"
            aria-label="Open menu"
            aria-expanded={open}
          >
            {open ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="flex flex-col gap-1 border-t border-black/[0.06] bg-sand px-6 py-4 sm:hidden">
          <NavLink to="/" end className={navLinkClass} onClick={() => setOpen(false)}>Browse</NavLink>
          <NavLink to="/cart" className={navLinkClass} onClick={() => setOpen(false)}>
            Order list{cartCount > 0 ? ` (${cartCount})` : ""}
          </NavLink>
          <NavLink to="/saved" className={navLinkClass} onClick={() => setOpen(false)}>
            Saved{savedCount > 0 ? ` (${savedCount})` : ""}
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass} onClick={() => setOpen(false)}>
            {seller ? "My shop" : "Sell on SeyMarket"}
          </NavLink>
        </nav>
      )}
    </header>
  );
}
