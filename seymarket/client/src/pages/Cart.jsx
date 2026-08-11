import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../lib/useCart.js";

function buildOrderMessage(shop) {
  const lines = shop.items.map((i) => `• ${i.name} × ${i.qty} — SCR ${(i.price * i.qty).toFixed(0)}`);
  return [
    `Hi ${shop.shop_name}! I'd like to order:`,
    "",
    ...lines,
    "",
    `Total: SCR ${shop.subtotal.toFixed(0)}`,
    "",
    "(Sent via SeyMarket)"
  ].join("\n");
}

function ShopOrderCard({ shop }) {
  const { setQty, removeFromCart, clearShop } = useCart();
  const contact = shop.contact_info || "";
  const isEmail = contact.includes("@");
  const message = buildOrderMessage(shop);
  const sendHref = isEmail
    ? `mailto:${contact}?subject=${encodeURIComponent(`Order from SeyMarket — ${shop.shop_name}`)}&body=${encodeURIComponent(message)}`
    : contact
    ? `https://wa.me/${contact.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`
    : null;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to={`/shop/${shop.seller_id}`} className="font-display text-lg font-semibold text-teal-dark hover:underline">
          {shop.shop_name}
        </Link>
        <button type="button" onClick={() => clearShop(shop.seller_id)} className="text-xs text-stone underline decoration-dotted hover:text-red-700">
          Remove all from this shop
        </button>
      </div>
      {shop.location && <p className="text-sm text-stone">{shop.location}</p>}

      <div className="mt-4 divide-y divide-black/[0.05]">
        {shop.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 py-3">
            <img src={item.photo} alt={item.name} className="h-14 w-14 shrink-0 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <Link to={`/product/${item.id}`} className="line-clamp-1 font-semibold text-ink hover:text-teal-dark">{item.name}</Link>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex items-center rounded-full border border-stone-light">
                  <button type="button" className="px-2.5 py-0.5 text-base" onClick={() => setQty(item.id, item.qty - 1)}>−</button>
                  <span className="min-w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    type="button"
                    className="px-2.5 py-0.5 text-base"
                    onClick={() => setQty(item.id, item.qty + 1)}
                    disabled={item.stock != null && item.qty >= item.stock}
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-stone">SCR {item.price.toFixed(0)} each</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="price-tag">SCR {(item.price * item.qty).toFixed(0)}</span>
              <button type="button" onClick={() => removeFromCart(item.id)} className="text-xs text-stone hover:text-red-700">Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4">
        <span className="font-display text-lg font-semibold text-ink">Total: SCR {shop.subtotal.toFixed(0)}</span>
        {sendHref ? (
          <a href={sendHref} target="_blank" rel="noreferrer" className="btn-primary">
            Send order {isEmail ? "by email" : "on WhatsApp"}
          </a>
        ) : (
          <span className="text-sm text-stone">No contact info for this shop yet.</span>
        )}
      </div>
    </div>
  );
}

export default function Cart() {
  const { shops, count, clearCart } = useCart();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="eyebrow">Your order list</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
        {count === 0 ? "Your order list is empty" : `Order list (${count} item${count === 1 ? "" : "s"})`}
      </h1>
      <p className="mt-2 max-w-xl text-stone">
        SeyMarket doesn't process payments — build a list here, then send it straight to each
        seller on WhatsApp or email to confirm and pay directly with them.
      </p>

      {shops.length === 0 ? (
        <div className="card mt-10 flex flex-col items-center gap-3 p-14 text-center">
          <p className="font-display text-xl font-semibold text-ink">Nothing here yet</p>
          <p className="max-w-sm text-stone">Add products while browsing to build an order list for each shop.</p>
          <Link to="/" className="btn-primary mt-2">Start browsing</Link>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-6">
            {shops.map((shop) => (
              <ShopOrderCard key={shop.seller_id} shop={shop} />
            ))}
          </div>
          <button type="button" onClick={clearCart} className="btn-ghost mt-6 text-sm">
            Clear entire order list
          </button>
        </>
      )}
    </main>
  );
}
