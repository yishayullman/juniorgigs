import React, { useState } from 'react';

export default function EmployerPortal({ myGigs, onAddGig, onOpenEscrow }) {
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !budget) return;

    const newGig = {
      id: Date.now(),
      title,
      budget: Number(budget),
      description,
      status: "pending_deposit",
      applicantsCount: 0
    };

    onAddGig(newGig);
    setTitle('');
    setBudget('');
    setDescription('');
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      {/* כותרת וכפתור הוספה */}
      <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-2xl border border-white/10">
        <div>
          <h2 className="text-lg font-bold text-white">פורטל מעסיק 💼</h2>
          <p className="text-xs text-slate-400">ניהול משימות והפקדת תשלום</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all"
        >
          + משימה חדשה
        </button>
      </div>

      {/* רשימת המשימות של המעסיק */}
      <div className="space-y-3">
        {myGigs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 border border-white/5 rounded-2xl text-slate-400 text-xs">
            עדיין לא העלית משימות. לחץ על "+ משימה חדשה" למעלה!
          </div>
        ) : (
          myGigs.map((gig) => (
            <div key={gig.id} className="bg-slate-900/80 border border-white/10 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{gig.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{gig.description}</p>
                </div>
                <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  ₪{gig.budget}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/5 text-xs">
                <span className="text-slate-400">👥 {gig.applicantsCount || 0} הצעות</span>
                
                <button
                  onClick={() => onOpenEscrow(gig)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 transition-all ${
                    gig.status === "pending_deposit"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  }`}
                >
                  {gig.status === "pending_deposit" ? "🛡️ הפקד בנאמנות" : "✓ מוגן בנאמנות"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* טופס הוספת משימה */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-[#0f102e] border border-white/10 rounded-2xl max-w-sm w-full p-5 space-y-3 text-right">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white">יצירת משימה חדשה</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <input
              type="text"
              placeholder="כותרת המשימה (לדוגמה: דף נחיתה)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
              required
            />

            <input
              type="number"
              placeholder="תקציב בש״ח (לדוגמה: 500)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
              required
            />

            <textarea
              placeholder="תיאור קצר..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500 h-20 resize-none"
            ></textarea>

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs">
              שמור ופרסם משימה
            </button>
          </form>
        </div>
      )}
    </div>
  );
}