import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendCode = async () => {
    setError("");
    setLoading(true);
    try {
      await api.sendOTP(phone);
      setStep("code");
    } catch (err: any) {
      setError(err.message || t("login.no_account"));
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await api.verifyOTP(phone, code);
      api.setToken(res.access_token);
      login({ id: res.user_id, name: res.name, role: res.role }, res.access_token);
      navigate(res.role === "admin" ? "/admin" : "/tasks");
    } catch (err: any) {
      setError(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #2D2A24 0%, #3D3830 100%)",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.svg" alt="Qbees" style={{ height: 80 }} />
          <p style={{ color: "#6b7280", margin: "4px 0 0" }}>{t("login.title")}</p>
        </div>

        {/* Language toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
          {["en", "mn"].map((lng) => (
            <button
              key={lng}
              onClick={() => {
                i18n.changeLanguage(lng);
                localStorage.setItem("language", lng);
              }}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: i18n.language === lng ? "#DAC694" : "#fff",
                color: i18n.language === lng ? "#2D2A24" : "#6b7280",
                fontWeight: i18n.language === lng ? 700 : 400,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {lng === "en" ? "English" : "Монгол"}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#dc2626",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {step === "phone" ? (
          <>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {t("login.phone_label")}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("login.phone_placeholder")}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 16,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={sendCode}
              disabled={loading || !phone}
              style={{
                width: "100%",
                padding: 14,
                background: "#DAC694",
                color: "#2D2A24",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading || !phone ? 0.6 : 1,
              }}
            >
              {loading ? t("login.sending") : t("login.send_code")}
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 16 }}>
              {t("login.code_sent", { phone })}
            </p>
            <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
              {t("login.code_label")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("login.code_placeholder")}
              autoFocus
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 24,
                letterSpacing: 8,
                textAlign: "center",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <button
              onClick={verify}
              disabled={loading || code.length !== 6}
              style={{
                width: "100%",
                padding: 14,
                background: "#DAC694",
                color: "#2D2A24",
                border: "none",
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                opacity: loading || code.length !== 6 ? 0.6 : 1,
              }}
            >
              {loading ? t("login.verifying") : t("login.verify")}
            </button>
            <button
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              style={{
                width: "100%",
                padding: 10,
                background: "none",
                border: "none",
                color: "#6b7280",
                fontSize: 14,
                cursor: "pointer",
                marginTop: 8,
              }}
            >
              {t("common.back")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
