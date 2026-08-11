import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

function isRecentShop(created_at) {
  if (!created_at) return false;
  const created = new Date(created_at.replace(" ", "T") + "Z");
  const days = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 14;
}

export default function Shop() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setShop(null);
    api.shop(id).then(setShop).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="font-display text-2xl font-semibold">{error}</p>
        <Link to="/" className="btn-secondary mt-6 inline-flex">Back to browsing</Link>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="h-40 animate-pulse rounded-xl2 bg-sand-deep" />
      </main>
    );
  }

  const whatsappHref = shop.contact_info
    ? `https://wa.me/${shop.contact_info.replace(/[^\d]/g, "")}`
    : null;

  return (
    <>
      <section className="bg-teal text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            <img
              src={shop.logo_image || "https://picsum.photos/seed/shop/200/200"}
              alt={shop.shop_name}
              className="h-24 w-24 rounded-2xl border-4 border-white/20 object-cover shadow-lift"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow !text-hibiscus-light">{shop.location}</p>
                {isRecentShop(shop.created_at) && <span className="badge-new">New shop</span>}
                {shop.verified === 1 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
                      <path d="M10 1.5l2.1 1.3 2.5-.2 1 2.3 2.3 1-.2 2.5 1.3 2.1-1.3 2.1.2 2.5-2.3 1-1 2.3-2.5-.2L10 18.5l-2.1-1.3-2.5.2-1-2.3-2.3-1 .2-2.5L1 10l1.3-2.1-.2-2.5 2.3-1 1-2.3 2.5.2L10 1.5z" />
                      <path d="M7 10l2 2 4-4" stroke="#0F8B8D" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Verified shop
                  </span>
                )}
              </div>
              <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">{shop.shop_name}</h1>
              {shop.description && (
                <p className="mt-2 max-w-xl text-sand/85">{shop.description}</p>
              )}
            </div>
          </div>

          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn-primary mt-6 inline-flex"
            >
              Message this shop
            </a>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Products</h2>
          <span className="text-sm text-stone">
            {shop.products.length} item{shop.products.length === 1 ? "" : "s"}
          </span>
        </div>

        {shop.products.length === 0 ? (
          <p className="mt-8 text-stone">This shop hasn't listed any products yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {shop.products.map((p) => (
              <ProductCard
                key={p.id}
                product={{ ...p, shop_name: shop.shop_name, location: shop.location, contact_info: shop.contact_info, shop_verified: shop.verified }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
