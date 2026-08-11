async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  // auth (seller)
  signup: (payload) => request("/auth/signup", { method: "POST", body: JSON.stringify(payload) }),
  login: (payload) => request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  // products
  categories: () => request("/products/categories"),
  products: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));
    return request(`/products${qs.toString() ? `?${qs}` : ""}`);
  },
  product: (id) => request(`/products/${id}`),
  createProduct: (formData) => request("/products", { method: "POST", body: formData }),
  updateProduct: (id, formData) => request(`/products/${id}`, { method: "PUT", body: formData }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // reviews
  reviews: (productId) => request(`/products/${productId}/reviews`),
  addReview: (productId, payload) =>
    request(`/products/${productId}/reviews`, { method: "POST", body: JSON.stringify(payload) }),

  // reports
  reportProduct: (productId, payload) =>
    request(`/products/${productId}/report`, { method: "POST", body: JSON.stringify(payload) }),

  // shops
  shops: () => request("/shops"),
  shop: (id) => request(`/shops/${id}`),

  // admin
  adminLogin: (payload) => request("/admin/login", { method: "POST", body: JSON.stringify(payload) }),
  adminLogout: () => request("/admin/logout", { method: "POST" }),
  adminMe: () => request("/admin/me"),
  adminStats: () => request("/admin/stats"),
  adminShops: () => request("/admin/shops"),
  adminDeleteShop: (id) => request(`/admin/shops/${id}`, { method: "DELETE" }),
  adminVerifyShop: (id) => request(`/admin/shops/${id}/verify`, { method: "PUT" }),
  adminProducts: (search) => request(`/admin/products${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  adminDeleteProduct: (id) => request(`/admin/products/${id}`, { method: "DELETE" }),
  adminReports: (status) => request(`/admin/reports${status ? `?status=${status}` : ""}`),
  adminResolveReport: (id) => request(`/admin/reports/${id}/resolve`, { method: "PUT" }),
  adminDeleteReport: (id) => request(`/admin/reports/${id}`, { method: "DELETE" })
};
