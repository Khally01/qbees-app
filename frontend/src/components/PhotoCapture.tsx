import { useRef, useState } from "react";
import { Camera, Upload, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";

interface Props {
  taskId: string;
  category?: string;
  onUploaded?: () => void;
}

export function PhotoCapture({ taskId, category, onUploaded }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File) => {
    setError("");
    setSuccess(false);
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Compress if needed (max 2MB)
    let uploadFile = file;
    if (file.size > 2 * 1024 * 1024) {
      uploadFile = await compressImage(file);
    }

    setUploading(true);
    try {
      await api.uploadPhoto(taskId, uploadFile, category);
      setSuccess(true);
      onUploaded?.();
      setTimeout(() => { setPreview(null); setSuccess(false); }, 1500);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && (
        <div className="text-red-600 text-sm mb-2 p-2 bg-red-50 rounded-lg">{error}</div>
      )}

      {preview ? (
        <div className="relative mb-3 rounded-lg overflow-hidden">
          <img src={preview} alt="Preview" className="w-full max-h-48 object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold">
            {uploading && <><Upload size={24} className="animate-pulse mr-2" /> Uploading...</>}
            {success && <><CheckCircle size={24} className="text-green-400 mr-2" /> Done!</>}
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-2 px-5 py-3 bg-qbees-gold text-qbees-dark border-0 rounded-lg text-sm font-semibold cursor-pointer w-full justify-center hover:bg-qbees-gold/80 transition-colors"
        >
          <Camera size={18} />
          {t("tasks.add_photo")}
        </button>
      )}
    </div>
  );
}

async function compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name, { type: "image/jpeg" })),
        "image/jpeg",
        quality,
      );
    };
    img.src = URL.createObjectURL(file);
  });
}
