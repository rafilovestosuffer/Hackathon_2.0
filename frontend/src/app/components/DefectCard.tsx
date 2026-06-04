export interface DefectCardData {
  defect: string;
  confidence: number;
  cited_standard: { source: string; clause_id: string; text: string };
  root_cause: string;
  recommended_action: string;
  pass_fail: "pass" | "fail";
}

export function DefectCard({ card }: { card: DefectCardData }) {
  const isPass = card.pass_fail === "pass";
  const accentColor = isPass ? "#22c55e" : "#ef4444";
  const glowColor = isPass ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
  const confidenceColor =
    card.confidence > 0.8 ? "#22c55e" :
    card.confidence > 0.5 ? "#eab308" :
    "#ef4444";

  return (
    <div
      className="glass animate-slide-in-up"
      style={{
        padding: "32px",
        boxShadow: `0 0 40px ${glowColor}, 0 8px 32px rgba(0,0,0,0.3)`,
        border: `1px solid ${accentColor}33`,
      }}
    >
      {/* Defect name */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.38)", marginBottom: "8px" }}>
          Defect Detected
        </p>
        <h2 style={{
          fontSize: "clamp(1.8rem, 5vw, 2.6rem)",
          fontWeight: 900,
          textTransform: "uppercase" as const,
          letterSpacing: "-0.01em",
          background: `linear-gradient(135deg, #fff 0%, ${accentColor} 100%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1.1,
        }}>
          {card.defect.replace(/_/g, " ")}
        </h2>
      </div>

      {/* Confidence */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.38)" }}>
            Confidence
          </p>
          <span style={{ fontSize: "2rem", fontWeight: 800, color: confidenceColor, lineHeight: 1 }}>
            {(card.confidence * 100).toFixed(1)}<span style={{ fontSize: "0.95rem", fontWeight: 500, marginLeft: "2px" }}>%</span>
          </span>
        </div>
        <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${(card.confidence * 100).toFixed(1)}%`,
            borderRadius: "3px",
            background: `linear-gradient(90deg, ${confidenceColor}88, ${confidenceColor})`,
            animation: "bar-fill 1.2s ease-out forwards",
            transformOrigin: "left center",
            boxShadow: `0 0 8px ${confidenceColor}`,
          }} />
        </div>
      </div>

      {/* Root Cause */}
      <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(139,92,246,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="2" x2="12" y2="3" />
            <path d="M9 21h6M9 18h6M12 5a7 7 0 0 1 7 7c0 3-1.5 5-4 6.5V18H9v-.5C6.5 16 5 14 5 12a7 7 0 0 1 7-7z" />
          </svg>
          <h3 style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)" }}>
            Root Cause
          </h3>
        </div>
        <p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7, fontSize: "0.9rem" }}>{card.root_cause}</p>
      </div>

      {/* Recommended Action */}
      <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.04)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="rgba(6,182,212,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
          <h3 style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)" }}>
            Recommended Action
          </h3>
        </div>
        <p style={{ color: "rgba(255,255,255,0.78)", lineHeight: 1.7, fontSize: "0.9rem" }}>{card.recommended_action}</p>
      </div>

      {/* Pass/Fail badge */}
      <div style={{ paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "11px 22px",
          borderRadius: "999px",
          background: isPass ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
          border: `2px solid ${accentColor}`,
          boxShadow: `0 0 20px ${glowColor}`,
          color: accentColor,
          fontWeight: 800,
          fontSize: "1.05rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase" as const,
        }}>
          {isPass ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L20 6 L20 12 C20 17 16 21 12 22 C8 21 4 17 4 12 L4 6 Z" />
              <polyline points="9,12 11,14 15,10" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          {isPass ? "PASS" : "FAIL"}
        </div>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.78rem" }}>Inspection Status</p>
      </div>
    </div>
  );
}
