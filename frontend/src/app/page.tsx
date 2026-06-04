"use client";

import { useState } from "react";
import UploadPanel from "./components/UploadPanel";
import { DefectCard, type DefectCardData } from "./components/DefectCard";
import { StandardCitation } from "./components/StandardCitation";
import { StatusBanner } from "./components/StatusBanner";
import { Report } from "./components/Report";

type AppState = "idle" | "loading" | "success" | "empty" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<DefectCardData | null>(null);
  const [error, setError] = useState<string>("");

  const handleUpload = async (file: File, productType: string) => {
    setState("loading");
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("product_type", productType);

      const response = await fetch("http://localhost:8000/api/inspect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Upload failed");
      }

      const data: DefectCardData = await response.json();

      if (data.defect === "no_defect") {
        setState("empty");
      } else {
        setState("success");
        setResult(data);
      }
    } catch (err: unknown) {
      setState("error");
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  const handleNewInspection = () => {
    setState("idle");
    setResult(null);
    setError("");
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "", "width=900,height=1200");
    if (printWindow) {
      const reportElement = document.getElementById("report");
      if (reportElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Inspection Report</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 28px; margin-bottom: 10px; }
                h2 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; }
                p { line-height: 1.6; }
                hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
                .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
                .standard { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; }
                .status-pass { color: #16a34a; font-weight: bold; }
                .status-fail { color: #dc2626; font-weight: bold; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>${reportElement.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden p-4 py-12">

      {/* Ambient orbs */}
      <div className="animate-float" style={{ position: "absolute", top: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, animationDelay: "0s" }} />
      <div style={{ position: "absolute", top: "10%", right: "-60px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, animation: "float 8s ease-in-out infinite", animationDelay: "2s" }} />
      <div style={{ position: "absolute", bottom: "5%", right: "10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(109,40,217,0.2) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, animation: "float 7s ease-in-out infinite", animationDelay: "1s" }} />
      <div style={{ position: "absolute", bottom: "15%", left: "5%", width: "250px", height: "250px", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0, animation: "float 9s ease-in-out infinite", animationDelay: "3s" }} />

      {/* Content */}
      <div className="max-w-3xl mx-auto" style={{ position: "relative", zIndex: 10 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", marginBottom: "16px" }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" stroke="url(#logoGrad)" strokeWidth="1.5" fill="none" />
              <circle cx="24" cy="24" r="8" fill="url(#logoGrad)" opacity="0.8" />
              <line x1="24" y1="2" x2="24" y2="10" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
              <line x1="24" y1="38" x2="24" y2="46" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
              <line x1="2" y1="24" x2="10" y2="24" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
              <line x1="38" y1="24" x2="46" y2="24" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, background: "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "-0.02em", lineHeight: 1 }}>
              InspectAI
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1rem", marginBottom: "20px" }}>
            Garment Quality Inspection · AI-Powered · Audit-Ready
          </p>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {["AI-Powered", "RAG-Grounded", "Offline-Ready", "Audit Reports"].map((label) => (
              <span key={label} style={{ padding: "4px 12px", borderRadius: "999px", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" as const, background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "rgba(255,255,255,0.75)" }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Main content — key re-triggers slide-in-up on every state change */}
        <div key={state} className="animate-slide-in-up" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {state === "idle" && (
            <UploadPanel onUpload={handleUpload} isLoading={false} />
          )}

          {state !== "idle" && (
            <StatusBanner state={state} message={error} />
          )}

          {state === "success" && result && (
            <>
              <DefectCard card={result} />
              <StandardCitation standard={result.cited_standard} />

              <div style={{ display: "none" }}>
                <Report card={result} />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  onClick={handlePrintReport}
                  style={{ flex: 1, padding: "14px 24px", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "12px", color: "#22c55e", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,197,94,0.22)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(34,197,94,0.25)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,197,94,0.12)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6,9 6,2 18,2 18,9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                  Print Report
                </button>
                <button
                  onClick={handleNewInspection}
                  style={{ flex: 1, padding: "14px 24px", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s ease", boxShadow: "0 0 20px rgba(139,92,246,0.3)" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                  New Inspection
                </button>
              </div>
            </>
          )}

          {state === "empty" && (
            <div className="glass" style={{ padding: "52px 32px", textAlign: "center" }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ margin: "0 auto 24px", display: "block" }}>
                <path d="M40 8 L68 20 L68 44 C68 58 55 70 40 74 C25 70 12 58 12 44 L12 20 Z" stroke="#22c55e" strokeWidth="2" fill="rgba(34,197,94,0.12)" />
                <path d="M26 40 L36 51 L56 30" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#22c55e", marginBottom: "12px", textShadow: "0 0 24px rgba(34,197,94,0.5)" }}>
                Quality Check Passed
              </h2>
              <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                No defects detected above confidence threshold.<br />This garment meets quality standards.
              </p>
              <button
                onClick={handleNewInspection}
                style={{ marginTop: "32px", padding: "13px 36px", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none", borderRadius: "12px", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", transition: "transform 0.15s ease, box-shadow 0.15s ease", boxShadow: "0 0 22px rgba(139,92,246,0.4)" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                New Inspection
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ marginTop: "52px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "0.75rem" }}>
          <p>InspectAI · DIU National AI Hackathon 2026 · Vision + RAG + LLM</p>
        </div>
      </div>
    </div>
  );
}
