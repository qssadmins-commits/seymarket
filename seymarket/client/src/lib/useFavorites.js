import { useCallback, useEffect, useState } from "react";

const KEY = "seymarket:favorites";

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

export function useFavorites() {
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

  const isFavorite = useCallback((id) => Boolean(map[id]), [map]);

  const toggleFavorite = useCallback((product) => {
    const all = readAll();
    if (all[product.id]) {
      delete all[product.id];
    } else {
      all[product.id] = {
        id: product.id,
        name: product.name,
        price: product.price,
        photo: product.photo,
        shop_name: product.shop_name,
        location: product.location,
        category: product.category
      };
    }
    writeAll(all);
    setMap({ ...all });
    notify();
    return Boolean(all[product.id]);
  }, []);

  const favorites = Object.values(map).sort((a, b) => a.name.localeCompare(b.name));

  return { favorites, isFavorite, toggleFavorite, count: favorites.length };
}
