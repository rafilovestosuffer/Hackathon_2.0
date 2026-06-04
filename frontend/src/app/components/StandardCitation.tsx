export interface CitedStandard {
  source: string;
  clause_id: string;
  text: string;
}

export function StandardCitation({ standard }: { standard: CitedStandard }) {
  return (
    <div
      className="glass animate-slide-in-up"
      style={{
        padding: "28px 32px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "inset 3px 0 0 #06b6d4, 0 0 30px rgba(6,182,212,0.08)",
      }}
    >
      {/* Decorative background quote mark */}
      <div style={{ position: "absolute", top: "-14px", left: "18px", fontSize: "7.5rem", lineHeight: 1, color: "rgba(139,92,246,0.12)", fontFamily: "Georgia, serif", pointerEvents: "none", userSelect: "none" as const, fontWeight: 700 }}>
        &ldquo;
      </div>

      <div style={{ position: "relative" }}>
        {/* Source + clause badges */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" as const }}>
          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, background: "rgba(6,182,212,0.18)", border: "1px solid rgba(6,182,212,0.38)", color: "#06b6d4" }}>
            {standard.source}
          </span>
          <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "0.62rem", fontWeight: 600, background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.32)", color: "rgba(167,139,250,0.95)" }}>
            Clause {standard.clause_id}
          </span>
        </div>

        {/* Quote */}
        <p style={{ fontSize: "0.94rem", lineHeight: 1.8, color: "rgba(255,255,255,0.72)", fontStyle: "italic", paddingLeft: "6px" }}>
          &ldquo;{standard.text}&rdquo;
        </p>

        {/* Footer label */}
        <p style={{ marginTop: "16px", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.28)" }}>
          Referenced Quality Standard
        </p>
      </div>
    </div>
  );
}
