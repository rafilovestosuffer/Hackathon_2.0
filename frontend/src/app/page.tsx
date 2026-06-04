"use client";

import { useState } from "react";
import UploadPanel from "./components/UploadPanel";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (file: File, productType: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("product_type", productType);

      const response = await fetch("http://localhost:8000/api/inspect", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Inspection result:", data);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 p-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-white text-center mb-12">
          InspectAI
        </h1>
        <UploadPanel onUpload={handleUpload} isLoading={isLoading} />
      </div>
    </div>
  );
}
