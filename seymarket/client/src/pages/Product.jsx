import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useFavorites } from "../lib/useFavorites.js";
import { useCart } from "../lib/useCart.js";
import { useToast } from "../lib/ToastContext.jsx";

function StarRow({ value, size = 16 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" width={size} height={size} fill={n <= Math.round(value) ? "#E4467D" : "#e5decf"}>
          <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.7l-5.2 2.8 1-5.8L1.6 7.6l5.8-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

export default function Product() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [reportOpen, setReportOpen] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToCart, getQty } = useCart();
  const showToast = useToast();

  useEffect(() => {
    setProduct(null);
    setActiveImage(0);
    setQty(1);
    api.product(id).then(setProduct).catch((e) => setError(e.message));
  }, [id]);

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="font-display text-2xl font-semibold">{error}</p>
        <Link to="/" className="btn-secondary mt-6 inline-flex">Back to browsing</Link>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 sm:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl2 bg-sand-deep" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-sand-deep" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-sand-deep" />
          </div>
        </div>
      </main>
    );
  }

  const contact = product.contact_info || "";
  const isEmail = contact.includes("@");
  const contactHref = isEmail
    ? `mailto:${contact}?subject=${encodeURIComponent(`Interested in ${product.name}`)}`
    : contact
    ? `https://wa.me/${contact.replace(/[^\d]/g, "")}?text=${encodeURIComponent(`Hi! I'm interested in ${product.name} (SCR ${product.price})`)}`
    : null;

  const outOfStock = product.stock === 0;
  const limitedStock = typeof product.stock === "number" && product.stock > 0 && product.stock <= 5;
  const images = [product.photo, ...(product.gallery || [])];
  const maxQty = product.stock == null ? 99 : product.stock;
  const alreadyInCart = getQty(product.id);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <nav className="mb-6 text-sm text-stone">
        <Link to="/" className="hover:text-teal-dark">Browse</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop/${product.seller_id}`} className="hover:text-teal-dark">{product.shop_name}</Link>
      </nav>

      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl2 bg-sand-deep shadow-soft">
            <img src={images[activeImage]} alt={product.name} className={`h-full w-full object-cover ${outOfStock ? "grayscale opacity-70" : ""}`} />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActiveImage(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === activeImage ? "border-teal" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <span className="chip">{product.category}</span>
            <button
              type="button"
              onClick={() => {
                const nowFav = toggleFavorite(product);
                showToast?.(nowFav ? "Saved to your favorites" : "Removed from favorites");
              }}
              aria-pressed={isFavorite(product.id)}
              className={`fav-btn ${isFavorite(product.id) ? "is-fav" : ""}`}
              aria-label={isFavorite(product.id) ? "Remove from favorites" : "Save to favorites"}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill={isFavorite(product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7.5-4.6-10-9.1C.4 8.2 2 4.5 5.6 4c2-.3 3.8.7 6.4 3.1C14.6 4.7 16.4 3.7 18.4 4c3.6.5 5.2 4.2 3.6 7.9C19.5 16.4 12 21 12 21z" />
              </svg>
            </button>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
            {product.name}
          </h1>

          <ReviewSummary productId={product.id} />

          <div className="mt-4 flex items-center gap-3">
            <span className="price-tag !text-base">SCR {Number(product.price).toFixed(0)}</span>
            {outOfStock ? (
              <span className="text-sm font-semibold text-red-700">Out of stock</span>
            ) : limitedStock ? (
              <span className="text-sm font-semibold text-hibiscus-dark">Only {product.stock} left</span>
            ) : null}
          </div>

          {product.description && (
            <p className="mt-6 leading-relaxed text-ink/80">{product.description}</p>
          )}

          {/* Add to order list */}
          <div className="card mt-6 p-5">
            <div className="flex items-center gap-3">
              <label className="label !mb-0">Qty</label>
              <div className="flex items-center rounded-full border border-stone-light">
                <button type="button" className="px-3 py-1 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={outOfStock}>−</button>
                <span className="min-w-8 text-center text-sm font-semibold">{qty}</span>
                <button type="button" className="px-3 py-1 text-lg" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} disabled={outOfStock || qty >= maxQty}>+</button>
              </div>
              <button
                type="button"
                disabled={outOfStock}
                onClick={() => {
                  addToCart(product, qty);
                  showToast?.(`Added ${qty} × ${product.name} to your order list`);
                }}
                className="btn-primary flex-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {outOfStock ? "Out of stock" : "Add to order list"}
              </button>
            </div>
            {alreadyInCart > 0 && (
              <p className="mt-2 text-xs text-stone">
                Already {alreadyInCart} of this in your order list — <Link to="/cart" className="font-semibold text-teal-dark hover:underline">view order list</Link>
              </p>
            )}
          </div>

          <div className="card mt-4 p-5">
            <div className="text-sm text-stone">Sold by</div>
            <Link to={`/shop/${product.seller_id}`} className="flex items-center gap-1.5 font-display text-lg font-semibold text-teal-dark hover:underline">
              {product.shop_name}
              {product.shop_verified === 1 && (
                <svg viewBox="0 0 20 20" width="14" height="14" fill="#0F8B8D" aria-label="Verified shop">
                  <path d="M10 1.5l2.1 1.3 2.5-.2 1 2.3 2.3 1-.2 2.5 1.3 2.1-1.3 2.1.2 2.5-2.3 1-1 2.3-2.5-.2L10 18.5l-2.1-1.3-2.5.2-1-2.3-2.3-1 .2-2.5L1 10l1.3-2.1-.2-2.5 2.3-1 1-2.3 2.5.2L10 1.5z" />
                  <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Link>
            <div className="mt-1 text-sm text-stone">{product.location}</div>

            {contactHref ? (
              <a href={contactHref} target="_blank" rel="noreferrer" className="btn-secondary mt-4 w-full">
                Contact seller {isEmail ? "by email" : "on WhatsApp"}
              </a>
            ) : (
              <p className="mt-4 text-sm text-stone">No contact info provided for this shop yet.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setReportOpen(true)}
            className="mt-4 text-xs text-stone underline decoration-dotted hover:text-red-700"
          >
            Report this listing
          </button>
        </div>
      </div>

      <Reviews productId={product.id} />

      {reportOpen && <ReportModal productId={product.id} onClose={() => setReportOpen(false)} />}
    </main>
  );
}

function ReviewSummary({ productId }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    api.reviews(productId).then(setData).catch(() => {});
  }, [productId]);
  if (!data || data.count === 0) return <p className="mt-2 text-sm text-stone">No reviews yet</p>;
  return (
    <div className="mt-2 flex items-center gap-2">
      <StarRow value={data.average} />
      <span className="text-sm text-stone">
        {data.average.toFixed(1)} ({data.count} review{data.count === 1 ? "" : "s"})
      </span>
    </div>
  );
}

function Reviews({ productId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ reviewer_name: "", rating: 5, comment: "" });
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  const load = () => api.reviews(productId).then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [productId]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.addReview(productId, form);
      setForm({ reviewer_name: "", rating: 5, comment: "" });
      showToast?.("Thanks for your review!");
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-16 grid gap-10 sm:grid-cols-2">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">Reviews</h2>
        {!data ? (
          <p className="mt-4 text-stone">Loading…</p>
        ) : data.reviews.length === 0 ? (
          <p className="mt-4 text-stone">No reviews yet — be the first to leave one.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {data.reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">{r.reviewer_name}</span>
                  <StarRow value={r.rating} size={14} />
                </div>
                {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink/80">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-display text-xl font-semibold text-ink">Leave a review</h3>
        <form onSubmit={submit} className="card mt-4 space-y-4 p-5">
          <div>
            <label className="label">Your name</label>
            <input
              required
              className="input"
              value={form.reviewer_name}
              onChange={(e) => setForm((f) => ({ ...f, reviewer_name: e.target.value }))}
              placeholder="e.g. Marie L."
            />
          </div>
          <div>
            <label className="label">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <svg viewBox="0 0 20 20" width="24" height="24" fill={n <= form.rating ? "#E4467D" : "#e5decf"}>
                    <path d="M10 1.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.7l-5.2 2.8 1-5.8L1.6 7.6l5.8-.8L10 1.5z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea
              className="input"
              rows={3}
              value={form.comment}
              onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="What did you think?"
            />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full">{busy ? "Submitting…" : "Submit review"}</button>
        </form>
      </div>
    </section>
  );
}

const REPORT_REASONS = ["Misleading description", "Prohibited item", "Suspected scam", "Offensive content", "Other"];

function ReportModal({ productId, onClose }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const showToast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.reportProduct(productId, { reason, details });
      setSent(true);
      showToast?.("Report submitted — thank you");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="card max-h-[90vh] w-full max-w-md overflow-y-auto p-6 sm:m-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Report listing</h2>
          <button onClick={onClose} className="text-2xl leading-none text-stone hover:text-ink" aria-label="Close">×</button>
        </div>

        {sent ? (
          <p className="mt-6 text-ink/80">Thanks — our team will take a look. You can close this window.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="label">Reason</label>
              <select className="input" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Details (optional)</label>
              <textarea className="input" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything else we should know?" />
            </div>
            {error && <p className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="btn-primary w-full">{busy ? "Sending…" : "Submit report"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
