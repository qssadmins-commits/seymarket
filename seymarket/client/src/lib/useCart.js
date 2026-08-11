import { useCallback, useEffect, useState } from "react";

const KEY = "seymarket:cart";

function readAll() {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(map) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // storage unavailable (private browsing etc.) — fail silently
  }
}

// Fires so every component using the hook stays in sync within the same tab.
const listeners = new Set();
function notify() {
  listeners.forEach((fn) => fn());
}

export function useCart() {
  const [map, setMap] = useState(readAll);

  useEffect(() => {
    const listener = () => setMap(readAll());
    listeners.add(listener);
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  }, []);

  const getQty = useCallback((id) => map[id]?.qty || 0, [map]);

  const addToCart = useCallback((product, qty = 1) => {
    const all = readAll();
    const existingQty = all[product.id]?.qty || 0;
    const maxQty = product.stock == null ? Infinity : product.stock;
    const nextQty = Math.min(existingQty + qty, Math.max(maxQty, 0));
    if (nextQty <= 0) return;
    all[product.id] = {
      id: product.id,
      name: product.name,
      price: product.price,
      photo: product.photo,
      seller_id: product.seller_id,
      shop_name: product.shop_name,
      location: product.location,
      contact_info: product.contact_info,
      stock: product.stock ?? null,
      qty: nextQty
    };
    writeAll(all);
    setMap({ ...all });
    notify();
  }, []);

  const setQty = useCallback((id, qty) => {
    const all = readAll();
    if (!all[id]) return;
    if (qty <= 0) {
      delete all[id];
    } else {
      const maxQty = all[id].stock == null ? Infinity : all[id].stock;
      all[id].qty = Math.min(qty, Math.max(maxQty, 0));
    }
    writeAll(all);
    setMap({ ...all });
    notify();
  }, []);

  const removeFromCart = useCallback((id) => {
    const all = readAll();
    delete all[id];
    writeAll(all);
    setMap({ ...all });
    notify();
  }, []);

  const clearShop = useCallback((sellerId) => {
    const all = readAll();
    Object.keys(all).forEach((id) => {
      if (all[id].seller_id === sellerId) delete all[id];
    });
    writeAll(all);
    setMap({ ...all });
    notify();
  }, []);

  const clearCart = useCallback(() => {
    writeAll({});
    setMap({});
    notify();
  }, []);

  const items = Object.values(map);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  // Group by shop, since each shop is contacted separately (no shared checkout/payment).
  const shops = Object.values(
    items.reduce((acc, item) => {
      const key = item.seller_id;
      if (!acc[key]) {
        acc[key] = {
          seller_id: item.seller_id,
          shop_name: item.shop_name,
          location: item.location,
          contact_info: item.contact_info,
          items: [],
          subtotal: 0
        };
      }
      acc[key].items.push(item);
      acc[key].subtotal += item.price * item.qty;
      return acc;
    }, {})
  );

  return { items, shops, count, getQty, addToCart, setQty, removeFromCart, clearShop, clearCart };
}
