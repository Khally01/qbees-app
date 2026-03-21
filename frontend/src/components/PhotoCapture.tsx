import { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
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

  const handleFile = async (file: File) => {
    // Show preview
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
      onUploaded?.();
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      setPreview(null);
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

      {preview ? (
        <div style={{ position: "relative", marginBottom: 12 }}>
          <img src={preview} alt="Preview" style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }} />
          {uploading && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 600,
              }}
            >
              <Upload size={24} className="spin" /> Uploading...
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            background: "#fbbf24",
            color: "#000",
            border: "none",
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Camera size={20} />
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
        (blob) => {
          resolve(new File([blob!], file.name, { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality,
      );
    };
    img.src = URL.createObjectURL(file);
  });
}
