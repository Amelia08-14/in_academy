"use client";

import { useState } from "react";
import FileUpload from "./FileUpload";
import { api } from "@/lib/api";

// Dépose un document (reçu de paiement ou dossier administratif) — tâches 4 & 5.
export default function DocumentUploader({
  type,
  label,
  hint,
  enrollmentId,
  onDone,
}: {
  type: "RECU" | "DOSSIER_ADMIN";
  label: string;
  hint?: string;
  enrollmentId?: string;
  onDone?: () => void;
}) {
  const [error, setError] = useState("");

  const handleUploaded = async (fileUrl: string, originalName: string) => {
    setError("");
    try {
      await api.post("/documents", { type, fileUrl, originalName, enrollmentId });
      onDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    }
  };

  return (
    <div>
      <FileUpload
        label={label}
        accept="image/*,.pdf"
        hint={hint}
        onUploaded={handleUploaded}
        tokenStorageKey="token"
      />
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  );
}
