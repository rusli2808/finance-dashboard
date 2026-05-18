import ResetPassword from "./ResetPassword";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "./supabase";
import Auth from "./Auth";
import { translations, detectLang, saveLang } from "./lang";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const C = {
  bg: "#f7f6f3", surface: "#ffffff", border: "#e8e4dc", text: "#1c1a17",
  sub: "#9b9488", accent: "#2a6049", accentLight: "#e8f2ee", accentMid: "#4a9070",
  danger: "#c0392b", dangerLight: "#fdf0ee", warning: "#c47d2a",
  warningLight: "#fdf5e8", success: "#2a6049", successLight: "#e8f2ee", gold: "#b8952a",
};

const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => n >= 1000000 ? `Rp${(n / 1000000).toFixed(1)}jt` : n >= 1000 ? `Rp${(n / 1000).toFixed(0)}rb` : `Rp${n}`;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function KPICard({ label, value, sub, trend, color = C.accent }) {
  const up = trend >= 0;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 800, color: C.text, fontFamily: "'Fraunces', serif", letterSpacing: -0.5, wordBreak: "break-all" }}>{value}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ fontSize: 11, color: up ? C.success : C.danger, fontWeight: 600 }}>{up ? "▲" : "▼"} {Math.abs(trend)}%</span>
        <span style={{ fontSize: 10, color: C.sub }}>{sub}</span>
      </div>
      <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 2 }}>
        <div style={{ height: "100%", width: `${Math.min(100, Math.abs(trend) * 3)}%`, background: color, borderRadius: 2 }} />
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.text, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ color: "#fff8", fontSize: 11, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>
          <span style={{ color: p.color }}>{p.name}: </span>{fmtShort(p.value)}
        </div>
      ))}
    </div>
  );
}

function TransactionRow({ tx, onDelete, t }) {
  const isIncome = tx.type === "pemasukan" || tx.type === "income";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${C.border}`, transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: isIncome ? C.accentLight : C.dangerLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {isIncome ? "↓" : "↑"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.desc}</div>
        <div style={{ fontSize: 11, color: C.sub }}>{tx.date} · {tx.category}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: isIncome ? C.success : C.danger, flexShrink: 0 }}>
        {isIncome ? "+" : "-"}{fmt(tx.amount)}
      </div>
      <button onClick={() => onDelete(tx.id)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.5 }}>×</button>
    </div>
  );
}

function AddModal({ onAdd, onClose, t }) {
  const today = new Date();
  const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [form, setForm] = useState({ date: formattedDate, desc: "", category: t.categories[0], amount: "", type: t.typeIncome });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "16px" }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 24px 60px #0002" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: C.text }}>{t.modalTitle}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: C.sub, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {[t.typeIncome, t.typeExpense].map(tp => (
              <button key={tp} onClick={() => set("type", tp)} style={{
                flex: 1, padding: "8px", borderRadius: 8,
                border: `2px solid ${form.type === tp ? (tp === t.typeIncome ? C.accent : C.danger) : C.border}`,
                background: form.type === tp ? (tp === t.typeIncome ? C.accentLight : C.dangerLight) : "transparent",
                color: form.type === tp ? (tp === t.typeIncome ? C.accent : C.danger) : C.sub,
                fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize"
              }}>{tp}</button>
            ))}
          </div>
          <input style={inputStyle} placeholder={t.descPlaceholder} value={form.desc} onChange={e => set("desc", e.target.value)} />
          <input style={inputStyle} type="number" placeholder={t.amountPlaceholder} value={form.amount} onChange={e => set("amount", e.target.value)} />
          <input style={inputStyle} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            {t.categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => { if (form.desc && form.amount) { onAdd({ ...form, amount: parseFloat(form.amount) }); onClose(); } }}
            style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>
            {t.btnSubmit}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // Detect reset password page
if (window.location.pathname === '/reset-password' || window.location.hash.includes('access_token')) {
  return <ResetPassword />;
}
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lang, setLang] = useState(detectLang());
  const isMobile = useIsMobile();
  const t = translations[lang];

  const toggleLang = () => {
    const next = lang === 'id' ? 'en' : 'id';
    setLang(next);
    saveLang(next);
    setActiveTab("summary");
    setFilterType("all");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) fetchTransactions();
    else setLoading(false);
  }, [user]);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (data) setTransactions(data);
    setLoading(false);
  };

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === "pemasukan" || t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = transactions.filter(t => t.type === "pengeluaran" || t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const profit = income - expense;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;
    return { income, expense, profit, margin };
  }, [transactions]);

  const cashflowData = useMemo(() => {
    const grouped = {};
    transactions.forEach(tx => {
      const month = tx.date?.slice(0, 7);
      if (!month) return;
      if (!grouped[month]) grouped[month] = { month, income: 0, expense: 0 };
      if (tx.type === "pemasukan" || tx.type === "income") grouped[month].income += Number(tx.amount);
      if (tx.type === "pengeluaran" || tx.type === "expense") grouped[month].expense += Number(tx.amount);
    });
    return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const expenseCategories = useMemo(() => {
    const COLORS = ["#c0392b", "#e74c3c", "#e67e22", "#f39c12", "#c47d2a", "#e8a87c", "#f0d5b8"];
    const grouped = {};
    transactions.filter(tx => tx.type === "pengeluaran" || tx.type === "expense").forEach(tx => {
      if (!grouped[tx.category]) grouped[tx.category] = 0;
      grouped[tx.category] += Number(tx.amount);
    });
    return Object.entries(grouped).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }));
  }, [transactions]);

  const filtered = useMemo(() => transactions
    .filter(tx => filterType === "all" || tx.type === filterType)
    .filter(tx => (tx.desc || "").toLowerCase().includes(search.toLowerCase()) || (tx.category || "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, search, filterType]
  );

  const addTx = async (tx) => {
    const { data } = await supabase
      .from('transactions')
      .insert([{ desc: tx.desc, amount: tx.amount, type: tx.type, category: tx.category, date: tx.date, user_id: user.id }])
      .select();
    if (data) setTransactions(prev => [data[0], ...prev]);
  };

  const deleteTx = async (id) => {
    await supabase.from('transactions').delete().eq('id', id);
    setTransactions(prev => prev.filter(x => x.id !== id));
  };

  const tabs = [
    { key: "summary", label: t.tabSummary },
    { key: "cashflow", label: t.tabCashflow },
    { key: "expenses", label: t.tabExpense },
    { key: "transactions", label: t.tabTransaction },
  ];

  if (authLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "sans-serif", color: "#9b9488", fontSize: 14 }}>
      {t.loadingApp}
    </div>
  );

  if (!user) return <Auth />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800&family=Instrument+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: 'Instrument Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        input, select { font-family: 'Instrument Sans', sans-serif; }
      `}</style>

      <div style={{ minHeight: "100vh", background: C.bg }}>
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "0 16px" : "0 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14 }}>◈</div>
                <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 17, color: C.text }}>FinanceOS</span>
                <span style={{ fontSize: 10, background: C.accentLight, color: C.accent, borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>{t.appTagline}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {!isMobile && <span style={{ fontSize: 12, color: C.sub, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>}
                <button onClick={toggleLang} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 10px", color: C.text, fontFamily: "inherit", fontWeight: 600, fontSize: 11, cursor: "pointer" }}>
                  {lang === 'id' ? '🇬🇧' : '🇮🇩'}
                </button>
                <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 10px", color: C.sub, fontFamily: "inherit", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>{t.btnLogout}</button>
                <button onClick={() => setShowModal(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: isMobile ? "7px 12px" : "7px 16px", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
                  {isMobile ? t.btnAddShort : t.btnAdd}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 2, overflowX: "auto", borderTop: `1px solid ${C.border}` }}>
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                  padding: isMobile ? "8px 12px" : "8px 16px",
                  borderRadius: 0, border: "none",
                  borderBottom: activeTab === tab.key ? `2px solid ${C.accent}` : "2px solid transparent",
                  background: "transparent",
                  color: activeTab === tab.key ? C.accent : C.sub,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                  fontSize: isMobile ? 12 : 13,
                  cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s"
                }}>{tab.label}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "16px" : "28px 32px" }}>
          {loading && <div style={{ textAlign: "center", padding: 60, color: C.sub, fontSize: 14 }}>{t.loadingData}</div>}

          {!loading && activeTab === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>{t.pageTitle}</h1>
                <p style={{ color: C.sub, fontSize: 13 }}>{t.pageSubtitle}</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14 }}>
                <KPICard label={t.kpiRevenue} value={fmt(stats.income)} sub={t.kpiSub} trend={12.4} color={C.accent} />
                <KPICard label={t.kpiExpense} value={fmt(stats.expense)} sub={t.kpiSub} trend={-5.2} color={C.danger} />
                <KPICard label={t.kpiProfit} value={fmt(stats.profit)} sub={t.kpiSub} trend={stats.profit >= 0 ? 18.7 : -18.7} color={C.gold} />
                <KPICard label={t.kpiMargin} value={`${stats.margin}%`} sub={t.kpiSub} trend={6.1} color={C.accentMid} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 14 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t.chartTitle}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{t.chartSub}</div>
                  </div>
                  <ResponsiveContainer width="100%" height={isMobile ? 160 : 200}>
                    <AreaChart data={cashflowData}>
                      <defs>
                        <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.accent} stopOpacity={0.15} />
                          <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={C.danger} stopOpacity={0.1} />
                          <stop offset="95%" stopColor={C.danger} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" name={t.income} stroke={C.accent} strokeWidth={2} fill="url(#incGrad)" />
                      <Area type="monotone" dataKey="expense" name={t.expense} stroke={C.danger} strokeWidth={2} fill="url(#expGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t.pieTitle}</div>
                    <div style={{ fontSize: 12, color: C.sub }}>{t.pieSub}</div>
                  </div>
                  {expenseCategories.length === 0
                    ? <div style={{ textAlign: "center", color: C.sub, fontSize: 13, padding: "20px 0" }}>{t.noExpense}</div>
                    : <>
                      <ResponsiveContainer width="100%" height={120}>
                        <PieChart>
                          <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                            {expenseCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => fmtShort(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                        {expenseCategories.map(e => (
                          <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, color: C.sub, flex: 1 }}>{e.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{fmtShort(e.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  }
                </div>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "14px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{t.recentTitle}</div>
                  <button onClick={() => setActiveTab("transactions")} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>{t.viewAll}</button>
                </div>
                {transactions.length === 0
                  ? <div style={{ padding: 40, textAlign: "center", color: C.sub, fontSize: 13 }}>{t.noTransaction}</div>
                  : transactions.slice(0, 5).map(tx => <TransactionRow key={tx.id} tx={tx} onDelete={deleteTx} t={t} />)
                }
              </div>
            </div>
          )}

          {!loading && activeTab === "cashflow" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>{t.cashflowTitle}</h1>
                <p style={{ color: C.sub, fontSize: 13 }}>{t.cashflowSub}</p>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                {cashflowData.length === 0
                  ? <div style={{ textAlign: "center", color: C.sub, fontSize: 13, padding: 40 }}>{t.noData}</div>
                  : <ResponsiveContainer width="100%" height={isMobile ? 220 : 320}>
                    <BarChart data={cashflowData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: C.sub }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="income" name={t.income} fill={C.accent} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" name={t.expense} fill={C.danger} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                }
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
                {cashflowData.slice(-3).map(m => {
                  const net = m.income - m.expense;
                  return (
                    <div key={m.month} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px" }}>
                      <div style={{ fontWeight: 700, color: C.sub, fontSize: 12, marginBottom: 10 }}>{m.month}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: C.sub }}>{t.income}</span><span style={{ fontWeight: 700, color: C.accent, fontSize: 13 }}>{fmtShort(m.income)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: C.sub }}>{t.expense}</span><span style={{ fontWeight: 700, color: C.danger, fontSize: 13 }}>{fmtShort(m.expense)}</span></div>
                        <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.profit}</span><span style={{ fontWeight: 800, color: net >= 0 ? C.accent : C.danger, fontSize: 14 }}>{fmtShort(net)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {!loading && activeTab === "expenses" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>{t.expenseTitle}</h1>
                <p style={{ color: C.sub, fontSize: 13 }}>{t.expenseSub}</p>
              </div>
              {expenseCategories.length === 0
                ? <div style={{ textAlign: "center", color: C.sub, fontSize: 13, padding: 60 }}>{t.noExpenseData}</div>
                : <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>{t.byCategory}</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={expenseCategories} cx="50%" cy="50%" outerRadius={80} paddingAngle={3} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {expenseCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 14 }}>{t.breakdown}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {expenseCategories.map(e => {
                        const total = expenseCategories.reduce((s, x) => s + x.value, 0);
                        const pct = ((e.value / total) * 100).toFixed(1);
                        return (
                          <div key={e.name}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.name}</span>
                              <div style={{ display: "flex", gap: 10 }}>
                                <span style={{ fontSize: 13, color: C.sub }}>{pct}%</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{fmt(e.value)}</span>
                              </div>
                            </div>
                            <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: e.color, borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              }
            </div>
          )}

          {!loading && activeTab === "transactions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: isMobile ? 22 : 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>{t.transactionTitle}</h1>
                  <p style={{ color: C.sub, fontSize: 13 }}>{filtered.length} {t.dataCount}</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{t.btnAddShort}</button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 120, padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                {[t.filterAll, t.filterIncome, t.filterExpense].map(f => (
                  <button key={f} onClick={() => setFilterType(f)} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${filterType === f ? C.accent : C.border}`, background: filterType === f ? C.accentLight : C.surface, color: filterType === f ? C.accent : C.sub, fontWeight: 600, fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
                ))}
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                {filtered.length === 0
                  ? <div style={{ padding: 40, textAlign: "center", color: C.sub }}>{t.noResult}</div>
                  : filtered.map(tx => <TransactionRow key={tx.id} tx={tx} onDelete={deleteTx} t={t} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      {showModal && <AddModal onAdd={addTx} onClose={() => setShowModal(false)} t={t} />}
    </>
  );
}