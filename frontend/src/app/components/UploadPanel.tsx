"use client";

import { useState, useRef } from "react";

interface UploadPanelProps {
  onUpload: (file: File, productType: string) => void;
  isLoading?: boolean;
}

export default function UploadPanel({ onUpload, isLoading = false }: UploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [productType, setProductType] = useState<"shirt" | "pants" | "jacket">("shirt");
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSetFile = (file: File) => {
    setError("");
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Invalid file format. Please upload a JPG or PNG image.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 8MB.");
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
    else { setSelectedFile(null); setPreviewUrl(null); }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) onUpload(selectedFile, productType);
  };

  const borderColor = isDragging
    ? "2px dashed rgba(6,182,212,0.85)"
    : selectedFile
    ? "2px dashed rgba(139,92,246,0.65)"
    : "2px dashed rgba(255,255,255,0.2)";

  const dropBg = isDragging ? "rgba(6,182,212,0.08)" : "rgba(255,255,255,0.03)";

  return (
    <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>

      {/* Product type pill tabs */}
      <div style={{ marginBottom: "20px" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.4)", marginBottom: "10px" }}>
          Product Type
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["shirt", "pants", "jacket"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setProductType(type)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: "10px",
                border: productType === type ? "1px solid rgba(139,92,246,0.8)" : "1px solid rgba(255,255,255,0.12)",
                background: productType === type ? "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(6,182,212,0.18))" : "rgba(255,255,255,0.04)",
                color: productType === type ? "#fff" : "rgba(255,255,255,0.45)",
                fontWeight: productType === type ? 700 : 400,
                fontSize: "0.875rem",
                textTransform: "capitalize" as const,
                cursor: isLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: productType === type ? "0 0 16px rgba(139,92,246,0.28)" : "none",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        style={{
          minHeight: "240px",
          display: "flex",
          flexDirection: "column" as const,
          alignItems: "center",
          justifyContent: "center",
          gap: "14px",
          cursor: isLoading ? "not-allowed" : "pointer",
          border: borderColor,
          background: dropBg,
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          transition: "all 0.25s ease",
          padding: "32px",
          position: "relative" as const,
          overflow: "hidden",
        }}
      >
        {/* Idle scanline sweep */}
        {!selectedFile && !isDragging && (
          <div style={{ position: "absolute", top: 0, left: 0, width: "35%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.05), transparent)", animation: "scan 3.5s linear infinite", pointerEvents: "none" }} />
        )}

        {selectedFile && previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              style={{ width: "120px", height: "120px", objectFit: "cover" as const, borderRadius: "12px", border: "2px solid rgba(139,92,246,0.55)", boxShadow: "0 0 22px rgba(139,92,246,0.22)" }}
            />
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600, fontSize: "0.875rem" }}>{selectedFile.name}</p>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", marginTop: "4px" }}>
                {(selectedFile.size / 1024).toFixed(1)} KB · Click or drag to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="25" stroke={isDragging ? "#06b6d4" : "rgba(139,92,246,0.55)"} strokeWidth="1.5" fill={isDragging ? "rgba(6,182,212,0.1)" : "rgba(139,92,246,0.08)"} />
              <path d="M26 34 L26 18" stroke={isDragging ? "#06b6d4" : "#8b5cf6"} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M19 25 L26 18 L33 25" stroke={isDragging ? "#06b6d4" : "#8b5cf6"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M18 36 L34 36" stroke={isDragging ? "rgba(6,182,212,0.6)" : "rgba(139,92,246,0.4)"} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600, fontSize: "1rem" }}>
                {isDragging ? "Drop it here" : "Drag & drop your image"}
              </p>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.78rem", marginTop: "5px" }}>
                or <span style={{ color: "#8b5cf6", fontWeight: 600 }}>click to browse</span>
              </p>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "0.68rem", marginTop: "8px" }}>
                JPG or PNG · Max 8MB
              </p>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          disabled={isLoading}
          style={{ display: "none" }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop: "12px", padding: "12px 16px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.38)", borderRadius: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p style={{ color: "#ef4444", fontSize: "0.82rem", fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {/* Upload button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        style={{
          marginTop: "14px",
          width: "100%",
          padding: "16px",
          background: !selectedFile || isLoading ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #8b5cf6, #06b6d4)",
          border: !selectedFile || isLoading ? "1px solid rgba(255,255,255,0.08)" : "none",
          borderRadius: "12px",
          color: !selectedFile || isLoading ? "rgba(255,255,255,0.28)" : "#fff",
          fontWeight: 700,
          fontSize: "1rem",
          cursor: !selectedFile || isLoading ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          transition: "all 0.2s ease",
          boxShadow: selectedFile && !isLoading ? "0 0 26px rgba(139,92,246,0.32)" : "none",
        }}
        onMouseEnter={e => { if (selectedFile && !isLoading) e.currentTarget.style.transform = "scale(1.02)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {isLoading ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin-slow 1s linear infinite" }}>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17,8 12,3 7,8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Upload & Inspect
          </>
        )}
      </button>
    </div>
  );
}
