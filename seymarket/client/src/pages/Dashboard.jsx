import React, { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import { api } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";

export default function Dashboard() {
  const { seller, loading, login, signup, logout } = useAuth();

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="h-40 animate-pulse rounded-xl2 bg-sand-deep" />
      </main>
    );
  }

  return seller ? <SellerPanel seller={seller} onLogout={logout} /> : <AuthPanel login={login} signup={signup} />;
}

function AuthPanel({ login, signup }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ shop_name: "", email: "", password: "", location: "", description: "", contact_info: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
      } else {
        await signup(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="eyebrow">{mode === "login" ? "Welcome back" : "Start selling"}</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {mode === "login" ? "Log in to your shop" : "Create your shop"}
      </h1>
      <p className="mt-2 text-stone">
        {mode === "login"
          ? "Manage your listings and see what buyers are searching for."
          : "It takes two minutes. You can add products right after."}
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
        {mode === "signup" && (
          <div>
            <label className="label">Shop name</label>
            <input required className="input" value={form.shop_name} onChange={update("shop_name")} placeholder="e.g. Anse Coco Crafts" />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input required type="email" className="input" value={form.email} onChange={update("email")} placeholder="you@example.com" />
        </div>
        <div>
          <label className="label">Password</label>
          <input required type="password" className="input" value={form.password} onChange={update("password")} placeholder="At least 6 characters" />
        </div>
        {mode === "signup" && (
          <>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={update("location")} placeholder="e.g. Victoria, Mahe" />
            </div>
            <div>
              <label className="label">Contact (WhatsApp number or email)</label>
              <input className="input" value={form.contact_info} onChange={update("contact_info")} placeholder="+248 2 XXX XXX" />
            </div>
            <div>
              <label className="label">Shop description</label>
              <textarea className="input" rows={3} value={form.description} onChange={update("description")} placeholder="What do you sell?" />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-700">{error}</p>}

        <button disabled={busy} className="btn-primary w-full">
          {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create shop"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone">
        {mode === "login" ? "New to SeyMarket?" : "Already have a shop?"}{" "}
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="font-semibold text-teal-dark hover:underline"
        >
          {mode === "login" ? "Create a shop" : "Log in"}
        </button>
      </p>

      <p className="mt-3 text-center text-xs text-stone">
        Demo login: take5@example.com / demo1234
      </p>
    </main>
  );
}

const EMPTY_PRODUCT = { name: "", price: "", description: "", category: "", stock: "" };

function SellerPanel({ seller, onLogout }) {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null); // null = not open, {} = new, product = editing
  const [error, setError] = useState("");
  const [tab, setTab] = useState("listings");
  const showToast = useToast();

  const load = () =>
    api.products({ sellerId: seller.id, pageSize: 48 })
      .then((res) => setProducts(res.items))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
    api.categories().then(setCategories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seller.id]);

  const remove = async (id) => {
    if (!confirm("Delete this listing? This can't be undone.")) return;
    try {
      await api.deleteProduct(id);
      showToast?.("Listing deleted");
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const totalViews = products ? products.reduce((sum, p) => sum + (p.views || 0), 0) : 0;
  const topProducts = products ? [...products].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5) : [];
  const outOfStockCount = products ? products.filter((p) => p.stock === 0).length : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Seller dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{seller.shop_name}</h1>
          <p className="mt-1 text-stone">{seller.location}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditing({ ...EMPTY_PRODUCT })} className="btn-primary">
            + Add product
          </button>
          <button onClick={onLogout} className="btn-secondary">Log out</button>
        </div>
      </div>

      <div className="mt-8 flex gap-2">
        <button onClick={() => setTab("listings")} className={tab === "listings" ? "chip-active" : "chip"}>Listings</button>
        <button onClick={() => setTab("analytics")} className={tab === "analytics" ? "chip-active" : "chip"}>Analytics</button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      {tab === "analytics" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="card p-5">
              <div className="text-sm text-stone">Total listings</div>
              <div className="mt-1 font-mono text-3xl font-semibold text-teal-dark">{products ? products.length : "—"}</div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-stone">Total product views</div>
              <div className="mt-1 font-mono text-3xl font-semibold text-teal-dark">{products ? totalViews : "—"}</div>
            </div>
            <div className="card p-5">
              <div className="text-sm text-stone">Out of stock</div>
              <div className="mt-1 font-mono text-3xl font-semibold text-teal-dark">{products ? outOfStockCount : "—"}</div>
            </div>
          </div>

          <div className="card mt-4 p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Most viewed listings</h3>
            {!products ? (
              <p className="mt-3 text-stone">Loading…</p>
            ) : topProducts.length === 0 ? (
              <p className="mt-3 text-stone">No listings yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {topProducts.map((p) => {
                  const max = topProducts[0].views || 1;
                  const width = Math.max(6, Math.round(((p.views || 0) / max) * 100));
                  return (
                    <div key={p.id}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-ink line-clamp-1">{p.name}</span>
                        <span className="text-stone">{p.views || 0} views</span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-sand-deep">
                        <div className="h-2 rounded-full bg-teal" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "listings" && (
        <>
          {!products ? (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] animate-pulse rounded-xl2 bg-sand-deep" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="card mt-10 flex flex-col items-center gap-3 p-14 text-center">
              <p className="font-display text-xl font-semibold text-ink">No listings yet</p>
              <p className="max-w-sm text-stone">Add your first product so buyers can find it while browsing SeyMarket.</p>
              <button onClick={() => setEditing({ ...EMPTY_PRODUCT })} className="btn-primary mt-2">+ Add product</button>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <div key={p.id} className="card overflow-hidden">
                  <div className="relative aspect-square bg-sand-deep">
                    <img src={p.photo} alt={p.name} className={`h-full w-full object-cover ${p.stock === 0 ? "grayscale opacity-70" : ""}`} />
                    {p.stock === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Out of stock
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-[16px] font-semibold text-ink line-clamp-1">{p.name}</h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="price-tag">SCR {Number(p.price).toFixed(0)}</span>
                      <span className="text-xs text-stone">{p.views || 0} views</span>
                    </div>
                    <p className="mt-1 text-xs text-stone">
                      {p.stock == null ? "Stock not tracked" : `${p.stock} in stock`}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => setEditing(p)} className="btn-ghost !px-3 !py-1.5 text-xs">Edit</button>
                      <button onClick={() => remove(p.id)} className="btn-danger !px-3 !py-1.5 text-xs">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <ProductModal
          product={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </main>
  );
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const isNew = !product.id;
  const [form, setForm] = useState({
    name: product.name || "",
    price: product.price ?? "",
    description: product.description || "",
    category: product.category || categories[0] || "",
    stock: product.stock ?? ""
  });
  const [file, setFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("price", form.price);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("stock", form.stock);
      if (file) fd.append("photo", file);
      galleryFiles.forEach((f) => fd.append("gallery", f));

      if (isNew) await api.createProduct(fd);
      else await api.updateProduct(product.id, fd);
      showToast?.(isNew ? "Product added" : "Changes saved");
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:m-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">
            {isNew ? "Add product" : "Edit product"}
          </h2>
          <button onClick={onClose} className="text-2xl leading-none text-stone hover:text-ink" aria-label="Close">×</button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={update("name")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (SCR)</label>
              <input required type="number" min="0" step="0.01" className="input" value={form.price} onChange={update("price")} />
            </div>
            <div>
              <label className="label">Category</label>
              <select required className="input" value={form.category} onChange={update("category")}>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Stock quantity (leave blank if you don't track stock)</label>
            <input type="number" min="0" step="1" className="input" value={form.stock} onChange={update("stock")} placeholder="e.g. 10, or 0 for out of stock" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={update("description")} />
          </div>
          <div>
            <label className="label">Cover photo {isNew ? "" : "(leave blank to keep current)"}</label>
            <input type="file" accept="image/*" className="input" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <div>
            <label className="label">Extra gallery photos (up to 4, optional{isNew ? "" : " — replaces existing gallery"})</label>
            <input type="file" accept="image/*" multiple className="input" onChange={(e) => setGalleryFiles(Array.from(e.target.files).slice(0, 4))} />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button disabled={busy} className="btn-primary flex-1">
              {busy ? "Saving…" : isNew ? "Add product" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
