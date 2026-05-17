import { useState } from "react";
import { supabase } from "./supabase";
import { translations, detectLang, saveLang } from "./lang";

const C = {
  bg: "#f7f6f3", surface: "#ffffff", border: "#e8e4dc", text: "#1c1a17",
  sub: "#9b9488", accent: "#2a6049", accentLight: "#e8f2ee",
  danger: "#c0392b", dangerLight: "#fdf0ee",
};

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lang, setLang] = useState(detectLang());
  const t = translations[lang];

  const toggleLang = () => {
    const next = lang === 'id' ? 'en' : 'id';
    setLang(next);
    saveLang(next);
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: `1px solid ${C.border}`, background: C.bg,
    color: C.text, fontSize: 14, fontFamily: "inherit",
    outline: "none", boxSizing: "border-box",
  };

  const handleEmail = async () => {
    setLoading(true); setError(""); setMessage("");

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError(lang === 'id' ? "Password tidak sama!" : "Passwords do not match!");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError(lang === 'id' ? "Password minimal 6 karakter!" : "Password must be at least 6 characters!");
        setLoading(false);
        return;
      }
    }

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(lang === 'id' ? "Email atau password salah!" : "Invalid email or password!");
    } else if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage(t.checkEmail);
    } else if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) setError(error.message);
      else setMessage(lang === 'id'
        ? "Link reset password sudah dikirim ke email kamu!"
        : "Password reset link has been sent to your email!");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) setError(error.message);
  };

  const resetForm = () => {
    setEmail(""); setPassword(""); setConfirmPassword("");
    setError(""); setMessage("");
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

          {/* Lang toggle */}
          <div style={{ textAlign: "right", marginBottom: 12 }}>
            <button onClick={toggleLang} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 13, cursor: "pointer", color: C.text, fontFamily: "inherit" }}>
              {lang === 'id' ? '🇬🇧 English' : '🇮🇩 Indonesia'}
            </button>
          </div>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 24, margin: "0 auto 12px" }}>◈</div>
            <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 800, color: C.text }}>FinanceOS</h1>
            <p style={{ color: C.sub, fontSize: 14, marginTop: 4 }}>{t.authTagline}</p>
          </div>

          {/* Card */}
          <div style={{ background: C.surface, borderRadius: 20, padding: 28, border: `1px solid ${C.border}` }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 20 }}>
              {mode === "login" ? t.authTitle : mode === "register" ? t.authTitleRegister : (lang === 'id' ? "Lupa Password" : "Forgot Password")}
            </h2>

            {/* Google button — only on login and register */}
            {mode !== "forgot" && <>
              <button onClick={handleGoogle} style={{
                width: "100%", padding: "11px", borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontFamily: "inherit", fontWeight: 600,
                fontSize: 14, cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 10,
                marginBottom: 16,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {t.btnGoogle}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: C.border }} />
                <span style={{ fontSize: 12, color: C.sub }}>{t.orEmail}</span>
                <div style={{ flex: 1, height: 1, background: C.border }} />
              </div>
            </>}

            {/* Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input style={inputStyle} type="email" placeholder={t.emailPlaceholder} value={email} onChange={e => setEmail(e.target.value)} />

              {mode !== "forgot" && (
                <input style={inputStyle} type="password" placeholder={t.passwordPlaceholder} value={password} onChange={e => setPassword(e.target.value)} />
              )}

              {mode === "register" && (
                <input style={inputStyle} type="password"
                  placeholder={lang === 'id' ? "Konfirmasi Password" : "Confirm Password"}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              )}

              {error && <div style={{ background: C.dangerLight, color: C.danger, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{error}</div>}
              {message && <div style={{ background: C.accentLight, color: C.accent, padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>{message}</div>}

              <button onClick={handleEmail} disabled={loading} style={{
                background: C.accent, color: "#fff", border: "none",
                borderRadius: 10, padding: "12px", fontWeight: 700,
                fontSize: 14, cursor: "pointer", fontFamily: "inherit",
                opacity: loading ? 0.7 : 1, marginTop: 4
              }}>
                {loading ? t.loading :
                  mode === "login" ? t.btnLogin :
                  mode === "register" ? t.btnRegister :
                  (lang === 'id' ? "Kirim Link Reset" : "Send Reset Link")}
              </button>
            </div>

            {/* Footer links */}
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              {mode === "login" && <>
                <p style={{ fontSize: 13, color: C.sub }}>
                  {t.noAccount}
                  <button onClick={() => { setMode("register"); resetForm(); }}
                    style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                    {t.registerLink}
                  </button>
                </p>
                <button onClick={() => { setMode("forgot"); resetForm(); }}
                  style={{ background: "none", border: "none", color: C.sub, cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>
                  {lang === 'id' ? "Lupa password?" : "Forgot password?"}
                </button>
              </>}

              {mode === "register" && (
                <p style={{ fontSize: 13, color: C.sub }}>
                  {t.haveAccount}
                  <button onClick={() => { setMode("login"); resetForm(); }}
                    style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                    {t.loginLink}
                  </button>
                </p>
              )}

              {mode === "forgot" && (
                <button onClick={() => { setMode("login"); resetForm(); }}
                  style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>
                  {lang === 'id' ? "← Kembali ke login" : "← Back to login"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}