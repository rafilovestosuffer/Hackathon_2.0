"use client";

import { useState } from "react";

interface UploadPanelProps {
  onUpload: (file: File, productType: string) => void;
  isLoading?: boolean;
}

export default function UploadPanel({ onUpload, isLoading = false }: UploadPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [productType, setProductType] = useState("shirt");
  const [error, setError] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Invalid file format. Please upload a JPG or PNG image.");
      setSelectedFile(null);
      return;
    }

    // Validate file size (8MB)
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large. Maximum size is 8MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, productType);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Upload Garment Image</h2>

      {/* Product Type Dropdown */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Type
        </label>
        <select
          value={productType}
          onChange={(e) => setProductType(e.target.value)}
          disabled={isLoading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="shirt">Shirt</option>
          <option value="pants">Pants</option>
          <option value="jacket">Jacket</option>
        </select>
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Image
        </label>
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Selected File Display */}
      {selectedFile && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Selected:</strong> {selectedFile.name}
          </p>
          <p className="text-xs text-gray-600">
            Size: {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || isLoading}
        className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Processing..." : "Upload & Inspect"}
      </button>
    </div>
  );
}
