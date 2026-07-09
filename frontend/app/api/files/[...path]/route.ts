import { NextRequest, NextResponse } from "next/server";

const BACKEND = "http://localhost:4000";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filename = path.join("/");
  const url = `${BACKEND}/uploads/${filename}`;

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return new NextResponse("Fichier introuvable", { status: 404 });
    }

    const buffer = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";

    const disposition = contentType.includes("pdf")
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`;

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
