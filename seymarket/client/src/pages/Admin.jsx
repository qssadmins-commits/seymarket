import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { api } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";

export default function Admin() {
  const [admin, setAdmin] = useState(undefined); // undefined = loading, null = logged out

  useEffect(() => {
    api.adminMe().then(setAdmin).catch(() => setAdmin(null));
  }, []);

  if (admin === undefined) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="h-40 animate-pulse rounded-xl2 bg-sand-deep" />
      </main>
    );
  }

  if (!admin) {
    return <AdminLogin onLoggedIn={setAdmin} />;
  }

  return <AdminPanel admin={admin} onLogout={async () => { await api.adminLogout(); setAdmin(null); }} />;
}

function AdminLogin({ onLoggedIn }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const a = await api.adminLogin(form);
      onLoggedIn(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <p className="eyebrow">Restricted</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Admin sign in</h1>
      <p className="mt-2 text-stone">Moderation access for the SeyMarket team.</p>

      <form onSubmit={submit} className="card mt-8 space-y-4 p-6">
        <div>
          <label className="label">Email</label>
          <input required type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Password</label>
          <input required type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
      <p className="mt-3 text-center text-xs text-stone">Demo login: admin@seymarket.com / admin1234</p>
    </main>
  );
}

function AdminPanel({ admin, onLogout }) {
  const [stats, setStats] = useState(null);
  const [shops, setShops] = useState(null);
  const [products, setProducts] = useState(null);
  const [reports, setReports] = useState(null);
  const [reportFilter, setReportFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("overview");
  const [error, setError] = useState("");
  const showToast = useToast();

  const loadAll = () => {
    api.adminStats().then(setStats).catch((e) => setError(e.message));
    api.adminShops().then(setShops).catch((e) => setError(e.message));
    api.adminProducts().then(setProducts).catch((e) => setError(e.message));
  };

  useEffect(loadAll, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.adminProducts(search).then(setProducts).catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (tab !== "reports") return;
    api.adminReports(reportFilter === "all" ? undefined : reportFilter).then(setReports).catch((e) => setError(e.message));
  }, [tab, reportFilter]);

  const deleteShop = async (id) => {
    if (!confirm("Delete this shop and all of its products?")) return;
    await api.adminDeleteShop(id);
    showToast?.("Shop deleted");
    loadAll();
  };
  const deleteProduct = async (id) => {
    if (!confirm("Delete this product listing?")) return;
    await api.adminDeleteProduct(id);
    showToast?.("Product deleted");
    loadAll();
  };
  const toggleVerify = async (id) => {
    await api.adminVerifyShop(id);
    showToast?.("Shop verification updated");
    loadAll();
  };
  const resolveReport = async (id) => {
    await api.adminResolveReport(id);
    showToast?.("Report marked resolved");
    api.adminReports(reportFilter === "all" ? undefined : reportFilter).then(setReports);
    api.adminStats().then(setStats);
  };
  const deleteReport = async (id) => {
    if (!confirm("Dismiss and delete this report?")) return;
    await api.adminDeleteReport(id);
    showToast?.("Report dismissed");
    api.adminReports(reportFilter === "all" ? undefined : reportFilter).then(setReports);
    api.adminStats().then(setStats);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Admin</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Moderation</h1>
        </div>
        <button onClick={onLogout} className="btn-secondary">Log out</button>
      </div>

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Shops" value={stats?.shopCount} />
        <StatCard label="Products" value={stats?.productCount} />
        <StatCard label="Reviews" value={stats?.reviewCount} />
        <StatCard label="Open reports" value={stats?.openReportCount} highlight={stats?.openReportCount > 0} />
      </div>

      <div className="mt-10 flex flex-wrap gap-2">
        <button onClick={() => setTab("overview")} className={tab === "overview" ? "chip-active" : "chip"}>Overview</button>
        <button onClick={() => setTab("shops")} className={tab === "shops" ? "chip-active" : "chip"}>Shops</button>
        <button onClick={() => setTab("products")} className={tab === "products" ? "chip-active" : "chip"}>Products</button>
        <button onClick={() => setTab("reports")} className={tab === "reports" ? "chip-active" : "chip"}>
          Reports{stats?.openReportCount > 0 ? ` (${stats.openReportCount})` : ""}
        </button>
      </div>

      {tab === "overview" && (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Products by category</h3>
            <div className="mt-4 h-64">
              {stats?.byCategory ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.byCategory} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5decf" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="category" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0F8B8D" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-stone">Loading…</p>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-display text-lg font-semibold text-ink">Top viewed products</h3>
            <div className="mt-4 h-64">
              {stats?.topViewed ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topViewed} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5decf" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#E4467D" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-stone">Loading…</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "shops" && (
        <div className="card mt-6 divide-y divide-black/[0.05] overflow-hidden">
          {!shops ? (
            <div className="p-6 text-stone">Loading…</div>
          ) : shops.length === 0 ? (
            <div className="p-6 text-stone">No shops yet.</div>
          ) : (
            shops.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-ink">
                    {s.shop_name}
                    {s.verified === 1 && (
                      <svg viewBox="0 0 20 20" width="13" height="13" fill="#0F8B8D" aria-label="Verified">
                        <path d="M10 1.5l2.1 1.3 2.5-.2 1 2.3 2.3 1-.2 2.5 1.3 2.1-1.3 2.1.2 2.5-2.3 1-1 2.3-2.5-.2L10 18.5l-2.1-1.3-2.5.2-1-2.3-2.3-1 .2-2.5L1 10l1.3-2.1-.2-2.5 2.3-1 1-2.3 2.5.2L10 1.5z" />
                        <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <div className="text-sm text-stone">{s.email} · {s.location} · {s.product_count} product{s.product_count === 1 ? "" : "s"}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleVerify(s.id)} className="btn-secondary !px-3 !py-1.5 text-xs">
                    {s.verified === 1 ? "Remove verification" : "Verify shop"}
                  </button>
                  <button onClick={() => deleteShop(s.id)} className="btn-danger !px-3 !py-1.5 text-xs">Delete shop</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "products" && (
        <>
          <input
            className="input mt-6 max-w-sm"
            placeholder="Search products or shop name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="card mt-4 divide-y divide-black/[0.05] overflow-hidden">
            {!products ? (
              <div className="p-6 text-stone">Loading…</div>
            ) : products.length === 0 ? (
              <div className="p-6 text-stone">No products found.</div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <img src={p.photo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <div className="font-semibold text-ink">{p.name}</div>
                      <div className="text-sm text-stone">{p.shop_name} · SCR {Number(p.price).toFixed(0)} · {p.views || 0} views</div>
                    </div>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="btn-danger !px-3 !py-1.5 text-xs">Delete</button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "reports" && (
        <>
          <div className="mt-6 flex gap-2">
            <button onClick={() => setReportFilter("open")} className={reportFilter === "open" ? "chip-active" : "chip"}>Open</button>
            <button onClick={() => setReportFilter("resolved")} className={reportFilter === "resolved" ? "chip-active" : "chip"}>Resolved</button>
            <button onClick={() => setReportFilter("all")} className={reportFilter === "all" ? "chip-active" : "chip"}>All</button>
          </div>
          <div className="card mt-4 divide-y divide-black/[0.05] overflow-hidden">
            {!reports ? (
              <div className="p-6 text-stone">Loading…</div>
            ) : reports.length === 0 ? (
              <div className="p-6 text-stone">No reports here.</div>
            ) : (
              reports.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="flex items-center gap-3">
                    <img src={r.product_photo} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    <div>
                      <div className="font-semibold text-ink">{r.product_name} <span className="font-normal text-stone">· {r.shop_name}</span></div>
                      <div className="text-sm text-stone">Reason: {r.reason}</div>
                      {r.details && <div className="mt-0.5 max-w-md text-sm text-ink/70">{r.details}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.resolved === 0 ? (
                      <span className="rounded-full bg-hibiscus/10 px-2.5 py-1 text-[11px] font-semibold text-hibiscus-dark">Open</span>
                    ) : (
                      <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[11px] font-semibold text-teal-dark">Resolved</span>
                    )}
                    {r.resolved === 0 && (
                      <button onClick={() => resolveReport(r.id)} className="btn-secondary !px-3 !py-1.5 text-xs">Mark resolved</button>
                    )}
                    <button onClick={() => deleteReport(r.id)} className="btn-danger !px-3 !py-1.5 text-xs">Dismiss</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value, isText, highlight }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-stone">{label}</div>
      <div className={isText ? "mt-1 font-display text-xl font-semibold text-ink" : `mt-1 font-mono text-3xl font-semibold ${highlight ? "text-hibiscus-dark" : "text-teal-dark"}`}>
        {value ?? "—"}
      </div>
    </div>
  );
}
