import { NextRequest, NextResponse } from "next/server";

// En production (in-academy.dz) le backend n'est pas sur localhost : on le résout
// depuis l'environnement, en retombant sur l'URL de l'API publique si besoin.
const BACKEND =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ??
  "http://localhost:4000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  // Next décode déjà les segments : on ré-encode pour que les noms de fichiers
  // contenant des espaces ou des accents restent des URLs valides côté backend.
  const filename = path.join("/");
  const url = `${BACKEND}/uploads/${path.map(encodeURIComponent).join("/")}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return new NextResponse("Fichier introuvable", { status: 404 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    // Les images (et PDF) doivent s'afficher, pas se télécharger : `attachment`
    // empêchait le rendu des photos de couverture.
    const isInline = contentType.startsWith("image/") || contentType.includes("pdf");
    const disposition = `${isInline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(filename)}`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Erreur serveur", { status: 500 });
  }
}
