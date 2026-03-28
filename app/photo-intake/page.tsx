"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function PhotoIntakePage() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "", date_of_birth: "", phone: "",
    email: "", gender: "", language: "",
    household_size: "", notes: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMimeType(file.type);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const res = await fetch("/api/photo-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image, mimeType }),
      });
      const data = await res.json();
      if (data.success) setFormData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    name: "Name",
    date_of_birth: "Date of Birth",
    phone: "Phone",
    email: "Email",
    gender: "Gender",
    language: "Language",
    household_size: "Household Size",
    notes: "Notes",
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">📸 Photo-to-Intake</h1>

      <div className="border-2 border-dashed rounded-lg p-6 text-center mb-4">
        <input type="file" accept="image/*" onChange={handleImageUpload} className="mb-2" />
        <p className="text-sm text-gray-500">Upload a photo of a paper intake form</p>
      </div>

      <Button onClick={handleExtract} disabled={!image || loading} className="w-full mb-6">
        {loading ? "Analyzing..." : "🤖 Auto-fill with AI"}
      </Button>

      <div className="space-y-3">
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="text-sm font-medium">{fieldLabels[key] || key}</label>
            <input
              className="w-full border rounded px-3 py-2 mt-1"
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}