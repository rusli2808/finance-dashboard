import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { detectLang } from "./lang";

const C = {
  bg: "#f7f6f3", surface: "#ffffff", border: "#e8e4dc", text: "#1c1a17",
  sub: "#9b9488", accent: "#2a6049", accentLight: "#e8f2ee",
  danger: "#c0392b", dangerLight: "#fdf0ee",
};

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const lang = detectLang();

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.bg,
    color: C.text, fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  const handleReset = async () => {
    setError(""); setMessage("");
    if (password !== confirmPassword) {
      setError(lang === 'id' ? "Password tidak sama!" : "Passwords do not match!");
      return;
    }
    if (password.length < 6) {
      setError(lang === 'id' ? "Password minimal 6 karakter!" : "Password must be at least 6 characters!");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) setError(error.message);
    else setMessage(lang === 'id'
      ? "Password berhasil diubah! Silakan login kembali."
      : "Password updated successfully! Please login again.");
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700;800&family=Instrument+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bg}; font-family: 'Instrument Sans', sans-serif; }
      `}</style>
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, margin: "0 auto 12px" }}>◈</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: C.text }}>FinanceOS</h1>
          </div>
          <div style={{ background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>
              {lang === 'id' ? "Buat Password Baru" : "Create New Password"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input style={inputStyle} type="password"
                placeholder={lang === 'id' ? "Password baru" : "New password"}
                value={password} onChange={e => setPassword(e.target.value)} />
              <input style={inputStyle} type="password"
                placeholder={lang === 'id' ? "Konfirmasi password baru" : "Confirm new password"}
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              {error && <div style={{ background: C.dangerLight, color: C.danger, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
              {message && (
                <div style={{ background: C.accentLight, color: C.accent, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
                  {message}
                  <br />
                  <a href="/" style={{ color: C.accent, fontWeight: 700, fontSize: 13 }}>
                    {lang === 'id' ? "Klik di sini untuk login →" : "Click here to login →"}
                  </a>
                </div>
              )}
              {!message && (
                <button onClick={handleReset} disabled={loading} style={{
                  background: C.accent, color: "#fff", border: "none",
                  borderRadius: 10, padding: "12px", fontWeight: 700,
                  fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                  opacity: loading ? 0.7 : 1, marginTop: 4
                }}>
                  {loading
                    ? (lang === 'id' ? "Menyimpan..." : "Saving...")
                    : (lang === 'id' ? "Simpan Password Baru" : "Save New Password")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}