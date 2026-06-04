"use client";

import { useState, useEffect } from "react";

export interface StatusBannerProps {
  state: "loading" | "empty" | "success" | "error";
  message?: string;
}

function AnimatingDots() {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.28em",
        textTransform: "uppercase" as const,
        background: "linear-gradient(135deg, #8b5cf6, #06b6d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
      }}>
        ANALYZING{".".repeat(dotCount)}
      </p>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.72rem", marginTop: "6px" }}>
        Running vision pipeline · RAG lookup · LLM analysis
      </p>
    </div>
  );
}

export function StatusBanner({ state, message }: StatusBannerProps) {
  if (state === "loading") {
    return (
      <div className="glass animate-slide-in-up" style={{ padding: "52px 32px", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: "28px" }}>
        {/* Scanning rings */}
        <div style={{ position: "relative", width: "120px", height: "120px" }}>
          {/* Outermost pulsing ring */}
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(139,92,246,0.3)", animation: "pulse-glow 2s ease-in-out infinite", animationDelay: "0s" }} />
          {/* Middle pulsing ring */}
          <div style={{ position: "absolute", inset: "16px", borderRadius: "50%", border: "2px solid rgba(139,92,246,0.5)", animation: "pulse-glow 2s ease-in-out infinite", animationDelay: "0.4s" }} />
          {/* Inner spinning dashed ring */}
          <div style={{ position: "absolute", inset: "32px", borderRadius: "50%", border: "2px dashed rgba(6,182,212,0.75)", animation: "spin-slow 3s linear infinite" }} />
          {/* Center scan icon */}
          <div style={{ position: "absolute", inset: "38px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="11" cy="11" r="8" stroke="url(#scanGrad)" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="url(#scanGrad)" />
              <line x1="11" y1="8" x2="11" y2="14" stroke="url(#scanGrad)" />
              <line x1="8" y1="11" x2="14" y2="11" stroke="url(#scanGrad)" />
            </svg>
          </div>
        </div>
        <AnimatingDots />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="glass animate-slide-in-up" style={{ padding: "28px 28px", border: "1px solid rgba(239,68,68,0.3)", boxShadow: "0 0 30px rgba(239,68,68,0.15)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div style={{ flexShrink: 0, width: "46px", height: "46px", borderRadius: "50%", background: "rgba(239,68,68,0.18)", border: "2px solid rgba(239,68,68,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <div>
            <h3 style={{ color: "#ef4444", fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>
              Inspection Failed
            </h3>
            <p style={{ color: "rgba(255,255,255,0.58)", fontSize: "0.85rem", lineHeight: 1.65 }}>
              {message || "An unexpected error occurred. Please check that the backend is running."}
            </p>
            <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.72rem", marginTop: "10px" }}>
              Try a different image or refresh the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="glass animate-slide-in-up" style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: "10px", border: "1px solid rgba(34,197,94,0.25)" }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20,6 9,17 4,12" />
        </svg>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.84rem" }}>
          Analysis complete · See results below
        </p>
      </div>
    );
  }

  return null;
}
