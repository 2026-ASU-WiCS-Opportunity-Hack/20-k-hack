"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

function AnalyzingDots() {
  return (
    <div className="text-xs text-indigo-500 mt-2 flex items-center justify-center gap-1">
      🤖 Analyzing with AI
      <span className="inline-flex gap-0.5 ml-0.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0ms]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:150ms]" />
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:300ms]" />
      </span>
    </div>
  );
}

export default function PhotoIntakePage() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const isMobile = typeof navigator !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: "", date_of_birth: "", phone: "",
    email: "", gender: "", language: "",
    household_size: "", notes: "",
  });

  const handleExtractWithBase64 = async (base64: string, mime: string) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch("/api/photo-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: mime }),
      });
      const data = await res.json();
      if (data.success) setFormData(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mime = file.type;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImage(base64);
      handleExtractWithBase64(base64, mime);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!formData.name) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("clients").insert([{
        name: formData.name,
        date_of_birth: formData.date_of_birth || null,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        language: formData.language,
        household_size: parseInt(formData.household_size) || null,
        notes: formData.notes,
      }]);
      if (!error) {
        setSaved(true);
        setTimeout(() => router.push("/clients"), 1500);
      }
    } finally {
      setSaving(false);
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">📸 Photo-to-Intake</h1>
        <div className="text-sm text-gray-500 mt-1">
          Upload a photo of a paper intake form — AI will extract all fields automatically.
        </div>
        <div className="text-sm text-amber-600 font-medium mt-0.5">
          ⚠️ AI may make mistakes — please review all fields before saving.
        </div>
      </div>

      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-6 hover:border-indigo-300 transition-colors">
        <input
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          id="gallery-input"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={() => isMobile
              ? document.getElementById("camera-input")?.click()
              : alert("📷 Camera is only supported on mobile devices.")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors"
          >
            📷 Camera
          </button>
          <button
            type="button"
            onClick={() => document.getElementById("gallery-input")?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            🖼️ Select in files
          </button>
        </div>

        <div className="text-xs text-gray-400 mt-3">
          Take a photo of a paper intake form or upload from your gallery
        </div>

        {image && (
          loading ? <AnalyzingDots /> : (
            <div className="text-xs text-green-600 mt-2 text-center">
              ✓ Image loaded — fields extracted below
            </div>
          )
        )}
      </div>

      {/* Form */}
      <div className="space-y-3 bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
        <div className="text-xs font-medium text-gray-500 mb-4">
          {loading
            ? "🤖 AI is analyzing your form..."
            : formData.name
            ? "Review and edit extracted fields:"
            : "Fields will appear after image upload"}
        </div>
        {Object.entries(formData).map(([key, value]) => (
          <div key={key}>
            <label className="text-xs font-medium text-gray-500">
              {fieldLabels[key] || key}
            </label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              placeholder={`Enter ${fieldLabels[key] || key}`}
            />
          </div>
        ))}
      </div>

      {/* Save button */}
      {formData.name && !loading && (
        <div className="mt-4 flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving ? "Saving..." : saved ? "✓ Saved! Redirecting..." : "💾 Save to Clients"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/clients")}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}