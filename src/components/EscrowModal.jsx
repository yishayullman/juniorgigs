import React, { useState } from 'react';

export default function EscrowModal({ gig, onClose, onReleasePayment }) {
  const [status, setStatus] = useState(gig?.escrowStatus || "held");
  const [invoiceType, setInvoiceType] = useState("exempt");
  const [loading, setLoading] = useState(false);

  // שחרור הכסף ב-Stripe מול השרת
  const handleRelease = async () => {
    setLoading(true);
    try {
      // קריאה ל-Backend לשחרור ה-Hold ב-Stripe
      const res = await fetch('/api/release-escrow-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paymentIntentId: gig?.paymentIntentId // מזהה ה-Hold של Stripe
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("released");
        if (onReleasePayment) onReleasePayment(gig.id);
      } else {
        alert("שגיאה בשחרור התשלום: " + data.error);
      }
    } catch (err) {
      alert("תקלה בתקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f102e] border border-white/10 rounded-3xl max-w-md w-full p-6 text-right relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-white text-sm"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">מנגנון תשלום בנאמנות (Escrow)</h3>
            <p className="text-xs text-slate-400">אבטחת כספים ומסמכים משפטיים</p>
          </div>
        </div>

        {/* Timeline representation */}
        <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5 mb-5">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${status !== 'held' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">1. הפקדת סכום המשימה (₪{gig?.budget || 500})</p>
              <p className="text-[11px] text-slate-400">הכסף שמור בחשבון הנאמנות של JuniorGigs</p>
            </div>
          </div>

          <div className="border-r-2 border-dashed border-white/10 mr-1.5 h-4"></div>

          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${status === 'released' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">2. אישור תוצר ושחרור תשלום</p>
              <p className="text-[11px] text-slate-400">המעסיק מאשר את הקוד/תוצר והכסף מועבר</p>
            </div>
          </div>
        </div>

        {/* Invoice selection for Juniors without Osek Patur */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 block mb-2">פתרון חשבוניות לג'וניור:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setInvoiceType("exempt")}
              className={`p-3 rounded-xl border text-right transition-all ${
                invoiceType === "exempt" 
                  ? "bg-indigo-600/20 border-indigo-500 text-white" 
                  : "bg-white/5 border-white/5 text-slate-400"
              }`}
            >
              <p className="text-xs font-bold">עוסק פטור / מורשה</p>
              <p className="text-[10px] text-slate-400 mt-0.5">הפקת קבלה ישירה מהאפליקציה</p>
            </button>

            <button
              onClick={() => setInvoiceType("freelance_service")}
              className={`p-3 rounded-xl border text-right transition-all ${
                invoiceType === "freelance_service" 
                  ? "bg-indigo-600/20 border-indigo-500 text-white" 
                  : "bg-white/5 border-white/5 text-slate-400"
              }`}
            >
              <p className="text-xs font-bold">אין לי עוסק (שכיר-פרילנס)</p>
              <p className="text-[10px] text-slate-400 mt-0.5">הפקת תלוש/חשבונית דרך שותף</p>
            </button>
          </div>
        </div>

        {/* Actions */}
        {status !== "released" ? (
          <button
            onClick={handleRelease}
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold py-3 rounded-xl text-xs hover:opacity-90 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {loading ? "משחרר תשלום מול Stripe..." : `אישור התוצר ושחרור ₪${gig?.budget || 500} לג'וניור`}
          </button>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-center text-xs font-bold">
            ✓ התשלום שוחרר בהצלחה! החשבונית נשלחה במייל.
          </div>
        )}
      </div>
    </div>
  );
}