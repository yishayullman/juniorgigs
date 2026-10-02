import React, { useState } from 'react';

export default function Profile({ savedGigs, notify }) {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "ישראל ישראלי",
    title: "Junior Full Stack Developer",
    linkedin: "https://www.linkedin.com/in/israel-israeli",
    github: "https://github.com/israel-israeli",
    portfolio: "https://israel-portfolio.com",
    badges: ["Verified Python", "Top Responder", "React Pro"]
  });

  const reviews = [
    { id: 1, reviewer: "TechFlow Ltd", rating: 5, comment: "עבודה מעולה, מהירה ומקצועית מאוד!" },
    { id: 2, reviewer: "DataWise", rating: 5, comment: "הקוד היה נקי ומסודר. מומלץ בחום." }
  ];

  const handleSave = () => {
    setIsEditing(false);
    notify("הפרופיל עודכן בהצלחה!");
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-3xl p-6 text-center relative">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 left-4 text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-indigo-300 border border-white/10"
        >
          {isEditing ? "סגור ✖" : "ערוך פרופיל ✏️"}
        </button>

        <div className="w-24 h-24 rounded-full mx-auto p-[3px] bg-gradient-to-r from-indigo-500 to-purple-600 mb-4 relative">
          <div className="w-full h-full rounded-full bg-[#0b0c33] flex items-center justify-center text-4xl">👨‍💻</div>
          <span className="absolute bottom-0 right-0 bg-emerald-400 border-2 border-[#04051a] w-5 h-5 rounded-full"></span>
        </div>

        <h2 className="text-2xl font-black text-white">{profile.name}</h2>
        <p className="text-xs text-slate-400 mt-1">{profile.title}</p>

        {isEditing ? (
          <div className="bg-white/5 p-4 rounded-2xl mt-4 space-y-3 text-right">
            <div>
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={profile.linkedin}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">GitHub URL</label>
              <input
                type="text"
                value={profile.github}
                onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Portfolio URL</label>
              <input
                type="text"
                value={profile.portfolio}
                onChange={(e) => setProfile({ ...profile, portfolio: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs text-white px-4 py-2 rounded-xl font-bold">
              שמור שינויים
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-center flex-wrap gap-1.5 mt-3">
              {profile.badges.map((b, i) => (
                <span key={i} className="text-[10.5px] font-semibold px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-200">
                  ✓ {b}
                </span>
              ))}
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <a href={profile.linkedin} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300">
                🔗 LinkedIn
              </a>
              <a href={profile.github} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300">
                💻 GitHub
              </a>
              <a href={profile.portfolio} target="_blank" rel="noreferrer" className="text-xs px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300">
                🌐 Portfolio
              </a>
            </div>
          </>
        )}

        <div className="grid grid-cols-3 gap-2.5 mt-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl py-4">
            <span className="text-xl font-black block text-white">{savedGigs.length}</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">משימות</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl py-4">
            <span className="text-xl font-black block text-amber-300">★ 5.0</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">דירוג</span>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-2xl py-4">
            <span className="text-xl font-black block text-emerald-300">₪1,350</span>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">רווחים</span>
          </div>
        </div>
      </div>

      <div className="px-1 pt-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">חוות דעת ממעסיקים ({reviews.length})</h3>
      </div>
      {reviews.map((rev) => (
        <div key={rev.id} className="bg-slate-900/60 border border-white/10 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-sm text-white">{rev.reviewer}</span>
            <span className="text-amber-300 text-sm">{"★".repeat(rev.rating)}</span>
          </div>
          <p className="text-xs text-slate-300">{rev.comment}</p>
        </div>
      ))}
    </div>
  );
}