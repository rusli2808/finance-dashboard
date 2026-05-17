import { useState, useMemo } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const C = {
  bg: "#f7f6f3", surface: "#ffffff", border: "#e8e4dc", text: "#1c1a17",
  sub: "#9b9488", accent: "#2a6049", accentLight: "#e8f2ee", accentMid: "#4a9070",
  danger: "#c0392b", dangerLight: "#fdf0ee", warning: "#c47d2a",
  warningLight: "#fdf5e8", success: "#2a6049", successLight: "#e8f2ee", gold: "#b8952a",
};

const initialTransactions = [];

const cashflowData = [
  { month: "Jan", income: 18200, expense: 13400 },
  { month: "Feb", income: 21500, expense: 14800 },
  { month: "Mar", income: 19800, expense: 15200 },
  { month: "Apr", income: 24300, expense: 16100 },
  { month: "May", income: 28000, expense: 17950 },
  { month: "Jun", income: 26500, expense: 16800 },
];

const expenseCategories = [
  { name: "Payroll", value: 12200, color: "#2a6049" },
  { name: "Operations", value: 2620, color: "#4a9070" },
  { name: "Marketing", value: 950, color: "#7ab89a" },
  { name: "Tech", value: 380, color: "#b8d8c8" },
  { name: "Assets", value: 1800, color: "#c47d2a" },
];

const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => n >= 1000000 ? `Rp${(n / 1000000).toFixed(1)}jt` : n >= 1000 ? `Rp${(n / 1000).toFixed(0)}rb` : `Rp${n}`;

function KPICard({ label, value, sub, trend, color = C.accent }) {
  const up = trend >= 0;
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1.2 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 800, color: C.text, fontFamily: "'Fraunces', serif", letterSpacing: -0.5 }}>{value}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: up ? C.success : C.danger, fontWeight: 600 }}>{up ? "▲" : "▼"} {Math.abs(trend)}%</span>
        <span style={{ fontSize: 12, color: C.sub }}>{sub}</span>
      </div>
      <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 4 }}>
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

function TransactionRow({ tx, onDelete }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: `1px solid ${C.border}`, transition: "background 0.12s" }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: tx.type === "income" ? C.accentLight : C.dangerLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
        {tx.type === "income" ? "↓" : "↑"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tx.desc}</div>
        <div style={{ fontSize: 11, color: C.sub }}>{tx.date} · {tx.category}</div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 14, color: tx.type === "income" ? C.success : C.danger, flexShrink: 0 }}>
        {tx.type === "income" ? "+" : "-"}{fmt(tx.amount)}
      </div>
      <button onClick={() => onDelete(tx.id)} style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 16, padding: "0 4px", opacity: 0.5 }}>×</button>
    </div>
  );
}

function AddModal({ onAdd, onClose }) {
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], desc: "", category: "Revenue", amount: "", type: "income" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inputStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${C.border}`, background: C.bg, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0006", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: 28, width: 380, boxShadow: "0 24px 60px #0002" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: C.text }}>Add Transaction</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, color: C.sub, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["income", "expense"].map(t => (
              <button key={t} onClick={() => set("type", t)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `2px solid ${form.type === t ? (t === "income" ? C.accent : C.danger) : C.border}`, background: form.type === t ? (t === "income" ? C.accentLight : C.dangerLight) : "transparent", color: form.type === t ? (t === "income" ? C.accent : C.danger) : C.sub, fontWeight: 700, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>
          <input style={inputStyle} placeholder="Description" value={form.desc} onChange={e => set("desc", e.target.value)} />
          <input style={inputStyle} type="number" placeholder="Amount (USD)" value={form.amount} onChange={e => set("amount", e.target.value)} />
          <input style={inputStyle} type="date" value={form.date} onChange={e => set("date", e.target.value)} />
          <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            {["Revenue", "Payroll", "Operations", "Marketing", "Tech", "Assets", "Other"].map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => { if (form.desc && form.amount) { onAdd({ ...form, id: Date.now(), amount: parseFloat(form.amount) }); onClose(); } }}
            style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontWeight: 700, fontSize: 14, cursor: "pointer", marginTop: 4 }}>
            Add Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const stats = useMemo(() => {
    const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const profit = income - expense;
    const margin = income > 0 ? ((profit / income) * 100).toFixed(1) : 0;
    return { income, expense, profit, margin };
  }, [transactions]);

  const filtered = useMemo(() => transactions
    .filter(t => filterType === "all" || t.type === filterType)
    .filter(t => t.desc.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, search, filterType]
  );

  const addTx = (tx) => setTransactions(t => [tx, ...t]);
  const deleteTx = (id) => setTransactions(t => t.filter(x => x.id !== id));
  const tabs = ["overview", "cashflow", "expenses", "transactions"];

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
        <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 32px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 15 }}>◈</div>
              <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 18, color: C.text }}>FinanceOS</span>
              <span style={{ fontSize: 11, background: C.accentLight, color: C.accent, borderRadius: 6, padding: "2px 8px", fontWeight: 700, marginLeft: 4 }}>SME</span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: activeTab === tab ? C.accentLight : "transparent", color: activeTab === tab ? C.accent : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize", transition: "all 0.15s" }}>{tab}</button>
              ))}
            </div>
            <button onClick={() => setShowModal(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add Transaction</button>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }}>
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>Business Overview</h1>
                <p style={{ color: C.sub, fontSize: 14 }}>Mei 2024 · Semua angka dalam Rupiah</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
                <KPICard label="Total Revenue" value={fmt(stats.income)} sub="vs last month" trend={12.4} color={C.accent} />
                <KPICard label="Total Expenses" value={fmt(stats.expense)} sub="vs last month" trend={-5.2} color={C.danger} />
                <KPICard label="Net Profit" value={fmt(stats.profit)} sub="vs last month" trend={18.7} color={C.gold} />
                <KPICard label="Profit Margin" value={`${stats.margin}%`} sub="vs last month" trend={6.1} color={C.accentMid} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Revenue vs Expenses</div>
                    <div style={{ fontSize: 12, color: C.sub }}>6-month trend</div>
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
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
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: C.sub }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" name="Revenue" stroke={C.accent} strokeWidth={2} fill="url(#incGrad)" />
                      <Area type="monotone" dataKey="expense" name="Expenses" stroke={C.danger} strokeWidth={2} fill="url(#expGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px" }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Expense Breakdown</div>
                    <div style={{ fontSize: 12, color: C.sub }}>By category</div>
                  </div>
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
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
                </div>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Recent Transactions</div>
                  <button onClick={() => setActiveTab("transactions")} style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>View all →</button>
                </div>
                {transactions.slice(0, 5).map(tx => <TransactionRow key={tx.id} tx={tx} onDelete={deleteTx} />)}
              </div>
            </div>
          )}

          {activeTab === "cashflow" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>Cash Flow</h1>
                <p style={{ color: C.sub, fontSize: 14 }}>Monthly income vs expenses · 6-month view</p>
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px" }}>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={cashflowData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: C.sub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: C.sub }} axisLine={false} tickLine={false} tickFormatter={fmtShort} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="income" name="Revenue" fill={C.accent} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill={C.border} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {cashflowData.slice(-3).map(m => {
                  const net = m.income - m.expense;
                  return (
                    <div key={m.month} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
                      <div style={{ fontWeight: 700, color: C.sub, fontSize: 12, marginBottom: 10 }}>{m.month} 2024</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: C.sub }}>Revenue</span><span style={{ fontWeight: 700, color: C.accent, fontSize: 13 }}>{fmtShort(m.income)}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, color: C.sub }}>Expenses</span><span style={{ fontWeight: 700, color: C.danger, fontSize: 13 }}>{fmtShort(m.expense)}</span></div>
                        <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Net</span><span style={{ fontWeight: 800, color: net >= 0 ? C.accent : C.danger, fontSize: 14 }}>{fmtShort(net)}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "expenses" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div>
                <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>Expense Analysis</h1>
                <p style={{ color: C.sub, fontSize: 14 }}>Where your money is going</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>By Category</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={expenseCategories} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {expenseCategories.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px" }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 16 }}>Breakdown</div>
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
            </div>
          )}

          {activeTab === "transactions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 800, color: C.text, marginBottom: 4 }}>Transactions</h1>
                  <p style={{ color: C.sub, fontSize: 14 }}>{filtered.length} records</p>
                </div>
                <button onClick={() => setShowModal(true)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>+ Add</button>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <input placeholder="Search transactions..." value={search} onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, padding: "9px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                {["all", "income", "expense"].map(f => (
                  <button key={f} onClick={() => setFilterType(f)} style={{ padding: "9px 16px", borderRadius: 10, border: `1px solid ${filterType === f ? C.accent : C.border}`, background: filterType === f ? C.accentLight : C.surface, color: filterType === f ? C.accent : C.sub, fontWeight: 600, fontSize: 13, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
                ))}
              </div>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                {filtered.length === 0
                  ? <div style={{ padding: 40, textAlign: "center", color: C.sub }}>No transactions found</div>
                  : filtered.map(tx => <TransactionRow key={tx.id} tx={tx} onDelete={deleteTx} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      {showModal && <AddModal onAdd={addTx} onClose={() => setShowModal(false)} />}
    </>
  );
}