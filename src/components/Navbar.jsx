import React from 'react';

export default function Navbar({ activeTab, go }) {
  const navItems = [
    ["feed", "🎯", "משימות"],
    ["myGigs", "📂", "שלי"],
    ["employer", "💼", "מעסיק"],
    ["profile", "👤", "פרופיל"]
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+14px)]">
      <div className="max-w-md mx-auto px-5">
        <div className="fnav pointer-events-auto rounded-full p-1.5 flex justify-between gap-1 bg-[#121034]/60 backdrop-blur-xl border border-white/10 shadow-2xl">
          {navItems.map(([id, ic, label]) => (
            <button
              key={id}
              onClick={() => go(id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-full transition-all duration-300 ${
                activeTab === id
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold scale-[1.04]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="text-[19px] leading-none">{ic}</span>
              <span className="text-[10.5px]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}