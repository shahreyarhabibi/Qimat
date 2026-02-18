// components/BottomNav.js
"use client";

import { NAV_ITEMS, ACTIVE_NAV_ID } from "@/components/navigationItems";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/30 bg-white/80 px-4 py-2 backdrop-blur-lg dark:border-slate-700/50 dark:bg-slate-900/75 md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            icon={<item.Icon className="h-6 w-6" />}
            label={item.label}
            active={item.id === ACTIVE_NAV_ID}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({ icon, label, active }) {
  return (
    <button
      className={`flex min-w-0 flex-1 flex-col items-center rounded-lg p-1 ${
        active ? "text-primary" : "text-slate-500 dark:text-slate-400"
      }`}
    >
      {icon}
      <span className="mt-1 text-xs">{label}</span>
    </button>
  );
}
