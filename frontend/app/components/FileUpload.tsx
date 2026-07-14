"use client";

import { useRef, useState } from "react";
import { fileUrl } from "@/lib/fileUrl";

interface FileUploadProps {
  label: string;
  accept?: string;
  currentUrl?: string | null;
  onUploaded: (url: string, originalName: string) => void;
  hint?: string;
  /** Clé localStorage du token à utiliser pour l'upload (site: "token", admin: "admin_token") */
  tokenStorageKey?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function fileProxyUrl(url: string): string {
  // url = "/uploads/timestamp-filename.pdf"
  // proxy via Next.js API to avoid cross-origin blocking
  return fileUrl(url);
}

function getFileName(url: string): string {
  const parts = url.split("/").pop() ?? url;
  const withoutTimestamp = parts.replace(/^\d+-/, "");
  return decodeURIComponent(withoutTimestamp);
}

export default function FileUpload({ label, accept = ".pdf,.doc,.docx", currentUrl, onUploaded, hint, tokenStorageKey = "token" }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentUrl ?? null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const token = localStorage.getItem(tokenStorageKey);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur upload");
      setUploadedUrl(data.url);
      onUploaded(data.url, data.originalName);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="file-upload">
      <label className="auth-label">{label}</label>

      {/* Current file display */}
      {uploadedUrl && (
        <div className="file-upload__current">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <a
            href={fileProxyUrl(uploadedUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="file-upload__link"
          >
            {getFileName(uploadedUrl)}
          </a>
          <span className="file-upload__badge">Fichier actuel</span>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`file-upload__zone${uploading ? " file-upload__zone--loading" : ""}`}
        onClick={() => !uploading && inputRef.current?.click()}
      >
        {uploading ? (
          <span className="file-upload__spinner">⟳ Envoi en cours…</span>
        ) : (
          <>
            <svg className="file-upload__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span className="file-upload__cta">
              {uploadedUrl ? "Remplacer le fichier" : "Cliquer pour choisir un fichier"}
            </span>
            <span className="file-upload__hint">{hint ?? "PDF, Word — max 15 Mo"}</span>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="file-upload__input"
        onChange={handleChange}
        disabled={uploading}
      />

      {error && <p className="file-upload__error">{error}</p>}
    </div>
  );
}
