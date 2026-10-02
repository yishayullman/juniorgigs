import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';

const CAT = {
  "פיתוח": { badge:"bg-cyan-400/10 text-cyan-200 border-cyan-400/30", dot:"bg-cyan-400" },
  "עיצוב": { badge:"bg-fuchsia-400/10 text-fuchsia-200 border-fuchsia-400/30", dot:"bg-fuchsia-400" },
  "QA":    { badge:"bg-amber-400/10 text-amber-200 border-amber-400/30", dot:"bg-amber-400" },
  "שיווק": { badge:"bg-emerald-400/10 text-emerald-200 border-emerald-400/30", dot:"bg-emerald-400" }
};
const cs = (c) => CAT[c] || CAT["פיתוח"];

function Badge({ cat }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${cs(cat).badge}`}>
      <i className={`w-1.5 h-1.5 rounded-full ${cs(cat).dot}`}></i>{cat}
    </span>
  );
}

export default function App() {
  const [gigs, setGigs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [chats, setChats] = useState({});
  const [employerView, setEmployerView] = useState("posted");
  const [openGigId, setOpenGigId] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedGig, setSelectedGig] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(1000);

  const [profile] = useState({
    name: "ישראל ישראלי",
    title: "Junior Full Stack Developer"
  });

  const [activeChat, setActiveChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const emptyForm = { title:"", company:"", category:"פיתוח", price:"", estimatedHours:"", description:"" };
  const [newGigForm, setNewGigForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const endRef = useRef(null);

  const notify = (text, type="ok") => setToast({ text, type, k:Date.now() });
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 2600); return () => clearTimeout(t); }, [toast]);

  // 1. הזרמת משימות בלייב מ-Firebase
  useEffect(() => {
    const q = query(collection(db, "gigs"));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGigs(data);
    });
    return () => unsub();
  }, []);

  // 2. הזרמת מועמדויות בלייב מ-Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "applications"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(data);
    });
    return () => unsub();
  }, []);

  // 3. הזרמת הודעות צ'אט בלייב מ-Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "chats"), (snapshot) => {
      const chatMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!chatMap[data.appId]) chatMap[data.appId] = [];
        chatMap[data.appId].push(data);
      });
      setChats(chatMap);
    });
    return () => unsub();
  }, []);

  const now = () => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  const filteredGigs = gigs.filter(gig => {
    const q = searchQuery.toLowerCase();
    const matchesCat = selectedCategory === "הכל" || gig.category === selectedCategory;
    const matchesQuery = (gig.title || "").toLowerCase().includes(q) || (gig.description || "").toLowerCase().includes(q);
    const matchesPrice = Number(gig.price) <= maxPrice;
    return matchesCat && matchesQuery && matchesPrice;
  });

  const myPosted = gigs.filter(g => g.owner === "me");
  const savedGigs = applications.filter(a => a.applicantId === "me");
  const appsFor = (gigId) => applications.filter(a => String(a.gigId) === String(gigId));
  const hasApplied = (gigId) => applications.some(a => String(a.gigId) === String(gigId) && a.applicantId === "me");

  const threads = [
    ...applications.filter(a => a.applicantId === "me").map(app => ({ app, role:"junior" })),
    ...applications.filter(a => gigs.some(g => String(g.id) === String(a.gigId) && g.owner === "me")).map(app => ({ app, role:"employer" }))
  ];

  const chatApp = activeChat ? applications.find(a => String(a.id) === String(activeChat.appId)) : null;
  const chatMsgs = activeChat ? (chats[activeChat.appId] || []) : [];

  const openChat = (appId, role) => setActiveChat({ appId, role });

  // הגשת מועמדות ושמירה בענן
  const handleApply = async (gig) => {
    if (hasApplied(gig.id)) return notify("כבר הגשת מועמדות למשימה הזו", "err");
    
    try {
      const appRef = await addDoc(collection(db, "applications"), {
        gigId: gig.id,
        applicantId: "me",
        applicantName: profile.name,
        applicantTitle: profile.title,
        status: "ממתין",
        appliedAt: now(),
        gig: { title: gig.title, company: gig.company || "חברה", price: gig.price, category: gig.category }
      });

      await addDoc(collection(db, "chats"), {
        appId: appRef.id,
        from: "employer",
        text: "שלום! אשמח לראות תוצר ראשוני בהקדם.",
        time: now(),
        createdAt: serverTimestamp()
      });

      notify(`🎉 הגשת מועמדות בהצלחה: "${gig.title}"`);
      setSelectedGig(null);
    } catch (e) {
      notify("שגיאה בהגשת המועמדות", "err");
    }
  };

  // יצירת משימה ושמירה בענן
  const handleCreateGig = async (e) => {
    e.preventDefault();
    if (!newGigForm.title || !newGigForm.price) return notify("נא למלא שדות חובה", "err");

    try {
      await addDoc(collection(db, "gigs"), {
        ...newGigForm,
        company: newGigForm.company || "העסק שלי",
        owner: "me",
        price: Number(newGigForm.price),
        createdAt: serverTimestamp()
      });

      notify("✨ המשימה פורסמה ונשמרה בענן!");
      setNewGigForm(emptyForm);
      setEmployerView("posted");
    } catch (e) {
      notify("שגיאה בשמירת המשימה", "err");
    }
  };

  // שליחת הודעה בצ'אט
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    try {
      await addDoc(collection(db, "chats"), {
        appId: activeChat.appId,
        from: activeChat.role,
        text: newMessage,
        time: now(),
        createdAt: serverTimestamp()
      });
      setNewMessage("");
    } catch (e) {
      notify("שגיאה בשליחת ההודעה", "err");
    }
  };

  const deleteGig = async (id) => {
    if (!window.confirm("למחוק את המשימה?")) return;
    try {
      await deleteDoc(doc(db, "gigs", id));
      notify("המשימה נמחקה מהענן");
    } catch (e) {
      notify("שגיאה במחיקה", "err");
    }
  };

  const go = (tab) => { setActiveTab(tab); setSelectedGig(null); setActiveChat(null); };

  return (
    <div dir="rtl" className="min-h-screen bg-[#04051a] text-white">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full text-xs font-bold border backdrop-blur-md ${toast.type==="err" ? "bg-rose-500/20 border-rose-500 text-rose-200" : "bg-emerald-500/20 border-emerald-500 text-emerald-200"}`}>{toast.text}</div>
      )}

      <header className="sticky top-0 z-40 bg-[#04051a]/90 backdrop-blur border-b border-white/10 px-5 py-3.5 flex justify-between items-center max-w-md mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => go("feed")}>
          <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">⚡</span>
          <h1 className="font-black text-xl tracking-tight">JuniorGigs</h1>
        </div>
        <button onClick={() => { go("employer"); setEmployerView("post"); }} className="bg-indigo-600 text-xs font-bold px-3.5 py-2 rounded-full">+ פרסם משימה</button>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 pb-28">
        {activeChat && chatApp ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[70vh]">
            <div className="pb-3 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm">{activeChat.role === "employer" ? chatApp.applicantName : chatApp.gig?.title}</h3>
                <p className="text-xs text-slate-400">{chatApp.gig?.company}</p>
              </div>
              <button onClick={() => setActiveChat(null)} className="text-xs bg-white/10 px-3 py-1.5 rounded-full">חזרה ←</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 py-3">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.from === activeChat.role ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3.5 py-2 rounded-2xl text-xs max-w-[80%] ${msg.from === activeChat.role ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200'}`}>{msg.text}</div>
                  <span className="text-[9px] text-slate-500 mt-1">{msg.time}</span>
                </div>
              ))}
              <div ref={endRef}></div>
            </div>
            <div className="flex gap-2 pt-2">
              <input type="text" placeholder="כתוב הודעה..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSendMessage()} className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 text-xs focus:outline-none" />
              <button onClick={handleSendMessage} className="bg-indigo-600 w-9 h-9 rounded-full text-xs font-bold">➤</button>
            </div>
          </div>

        ) : selectedGig ? (
          <div className="space-y-4">
            <button onClick={() => setSelectedGig(null)} className="text-xs bg-white/10 px-3 py-1.5 rounded-full">← חזרה למשימות</button>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <Badge cat={selectedGig.category} />
              </div>
              <h2 className="text-xl font-bold">{selectedGig.title}</h2>
              <p className="text-xs text-slate-400">{selectedGig.company}</p>
              <div className="bg-indigo-950/40 border border-indigo-500/20 p-3 rounded-xl flex justify-between items-center">
                <span className="text-xs text-slate-300">תשלום:</span>
                <span className="text-xl font-black text-amber-400">₪{selectedGig.price}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{selectedGig.description}</p>
              <button onClick={() => handleApply(selectedGig)} disabled={hasApplied(selectedGig.id)} className="w-full py-3 bg-indigo-600 font-bold rounded-xl text-xs disabled:opacity-50">
                {hasApplied(selectedGig.id) ? "הגשת מועמדות ✓" : "הגש מועמדות למשימה ✨"}
              </button>
            </div>
          </div>

        ) : activeTab === "feed" ? (
          <div className="space-y-4">
            <input type="text" placeholder="🔍 חפש משימה..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-xs" />
            <div className="space-y-3">
              {filteredGigs.length === 0 ? <p className="text-center py-10 text-xs text-slate-500">אין משימות פעילות</p> : filteredGigs.map((gig) => (
                <div key={gig.id} onClick={() => setSelectedGig(gig)} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-indigo-500/50 transition cursor-pointer space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge cat={gig.category} />
                    <span className="text-emerald-400 font-bold text-sm">₪{gig.price}</span>
                  </div>
                  <h3 className="font-bold text-sm">{gig.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{gig.description}</p>
                </div>
              ))}
            </div>
          </div>

        ) : activeTab === "employer" ? (
          <div className="space-y-4">
            <div className="flex bg-white/5 p-1 rounded-full text-xs font-bold">
              <button onClick={() => setEmployerView("posted")} className={`flex-1 py-2 rounded-full ${employerView === "posted" ? "bg-indigo-600" : "text-slate-400"}`}>המשימות שלי ({myPosted.length})</button>
              <button onClick={() => setEmployerView("post")} className={`flex-1 py-2 rounded-full ${employerView === "post" ? "bg-indigo-600" : "text-slate-400"}`}>+ פרסם חדשה</button>
            </div>

            {employerView === "post" ? (
              <form onSubmit={handleCreateGig} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
                <div>
                  <label className="block mb-1 text-slate-400">כותרת המשימה *</label>
                  <input type="text" value={newGigForm.title} onChange={(e) => setNewGigForm({...newGigForm, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" placeholder="למשל: בניית דף נחיתה" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-slate-400">מחיר (₪) *</label>
                    <input type="number" value={newGigForm.price} onChange={(e) => setNewGigForm({...newGigForm, price: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white" placeholder="300" />
                  </div>
                  <div>
                    <label className="block mb-1 text-slate-400">קטגוריה</label>
                    <select value={newGigForm.category} onChange={(e) => setNewGigForm({...newGigForm, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white bg-indigo-950">
                      <option value="פיתוח">פיתוח</option>
                      <option value="עיצוב">עיצוב</option>
                      <option value="QA">QA</option>
                      <option value="שיווק">שיווק</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block mb-1 text-slate-400">תיאור המשימה</label>
                  <textarea rows="3" value={newGigForm.description} onChange={(e) => setNewGigForm({...newGigForm, description: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white resize-none" placeholder="פירוט..." />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-600 rounded-xl font-bold text-white">פרסם ושמור בענן ✨</button>
              </form>
            ) : (
              <div className="space-y-3">
                {myPosted.length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-500">עדיין לא פרסמת משימות.</p>
                ) : myPosted.map(g => {
                  const apps = appsFor(g.id);
                  const isOpen = openGigId === g.id;
                  return (
                    <div key={g.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center cursor-pointer" onClick={() => setOpenGigId(isOpen ? null : g.id)}>
                        <div>
                          <h4 className="font-bold text-sm">{g.title}</h4>
                          <span className="text-xs text-amber-400 font-bold">₪{g.price}</span>
                        </div>
                        <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full">מועמדים ({apps.length})</span>
                      </div>

                      {isOpen && (
                        <div className="pt-3 border-t border-white/10 space-y-2">
                          <p className="text-[11px] text-slate-400">רשימת מועמדים:</p>
                          {apps.length === 0 ? (
                            <p className="text-xs text-slate-500 italic">אין מועמדים כרגע.</p>
                          ) : apps.map(a => (
                            <div key={a.id} className="bg-white/5 p-2.5 rounded-xl flex justify-between items-center">
                              <div>
                                <p className="font-bold text-xs">{a.applicantName}</p>
                                <p className="text-[10px] text-slate-400">{a.appliedAt}</p>
                              </div>
                              <button onClick={() => openChat(a.id, "employer")} className="bg-indigo-600 px-2.5 py-1 rounded-lg text-xs">💬 צ'אט</button>
                            </div>
                          ))}
                          <button onClick={() => deleteGig(g.id)} className="text-[10px] text-rose-400 underline pt-1 block">מחק משימה זו</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : activeTab === "myGigs" ? (
          <div className="space-y-3">
            <h2 className="font-bold text-sm">המשימות שהגשתי אליהן ({savedGigs.length})</h2>
            {savedGigs.map(app => (
              <div key={app.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-xs">{app.gig?.title}</h4>
                  <p className="text-[10px] text-slate-400">{app.gig?.company} · ₪{app.gig?.price}</p>
                </div>
                <button onClick={() => openChat(app.id, "junior")} className="bg-indigo-600 text-xs px-3 py-1.5 rounded-lg">💬 צ'אט</button>
              </div>
            ))}
          </div>

        ) : activeTab === "chats" ? (
          <div className="space-y-3">
            <h2 className="font-bold text-sm">שיחות פעילות ({threads.length})</h2>
            {threads.map(({ app, role }) => (
              <div key={app.id + role} onClick={() => openChat(app.id, role)} className="bg-white/5 border border-white/10 p-3 rounded-xl cursor-pointer flex justify-between items-center">
                <div>
                  <p className="font-bold text-xs">{role === "employer" ? app.applicantName : app.gig?.title}</p>
                  <p className="text-[10px] text-indigo-300">{role === "employer" ? "הגיש מועמדות" : "אתה מועמד"}</p>
                </div>
                <span className="text-xs">💬</span>
              </div>
            ))}
          </div>

        ) : (
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl text-center space-y-2">
            <h2 className="font-bold text-lg">{profile.name}</h2>
            <p className="text-xs text-slate-400">{profile.title}</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#04051a]/95 border-t border-white/10 py-2 z-40 max-w-md mx-auto">
        <div className="flex justify-around text-xs">
          {[["feed","🎯","משימות"],["myGigs","📂","שלי"],["chats","💬","צ'אטים"],["employer","💼","מעסיק"],["profile","👤","פרופיל"]].map(([id, ic, label]) => (
            <button key={id} onClick={() => go(id)} className={`flex flex-col items-center gap-1 ${activeTab === id ? "text-indigo-400 font-bold" : "text-slate-400"}`}>
              <span>{ic}</span>
              <span className="text-[10px]">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}