import React from "react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-black/[0.06] bg-teal-dark text-sand/80">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="font-display text-xl font-semibold text-white">
              Sey<span className="text-hibiscus-light">Market</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-sand/60">
              A single place to find real products from small Seychelles sellers —
              crafts, food, clothing and more — without scrolling ten Instagram pages.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:flex sm:gap-16">
            <div>
              <div className="eyebrow mb-3 !text-hibiscus-light">Marketplace</div>
              <ul className="space-y-2 text-sand/70">
                <li><a href="/" className="hover:text-white">Browse products</a></li>
                <li><a href="/saved" className="hover:text-white">Saved favorites</a></li>
                <li><a href="/dashboard" className="hover:text-white">Sell on SeyMarket</a></li>
              </ul>
            </div>
            <div>
              <div className="eyebrow mb-3 !text-hibiscus-light">Built for</div>
              <ul className="space-y-2 text-sand/70">
                <li>Seychelles Institute of Technology</li>
                <li>NDISE Year 3 Project</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-sand/40">
          Built as a student project. Not affiliated with any payment provider — sellers are contacted directly.
        </div>
      </div>
    </footer>
  );
}
