import { NextRequest, NextResponse } from "next/server";
import { fetchSheetBuffer, syncFromBuffer } from "@/lib/sync";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = process.env.DRIVE_SHEET_URL ?? process.env.DRIVE_SHEET_ID;
  if (!url) {
    return NextResponse.json(
      { error: "Falta configurar DRIVE_SHEET_URL en .env.local" },
      { status: 500 }
    );
  }

  return NextResponse.json({ configured: true, sourceHint: maskUrl(url) });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Permitimos override por body (útil si el admin quiere probar otro link sin tocar .env)
  let urlOverride: string | undefined;
  try {
    const body = await request.json();
    if (typeof body?.url === "string" && body.url.trim()) urlOverride = body.url.trim();
  } catch {
    // no body, está bien
  }

  const url = urlOverride ?? process.env.DRIVE_SHEET_URL ?? process.env.DRIVE_SHEET_ID;
  if (!url) {
    return NextResponse.json(
      { error: "Falta configurar DRIVE_SHEET_URL en .env.local" },
      { status: 500 }
    );
  }

  try {
    const buffer = await fetchSheetBuffer(url);
    const result = await syncFromBuffer(buffer, "sync");
    return NextResponse.json({ ok: true, source: maskUrl(url), result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function maskUrl(url: string): string {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return `Sheet ID ${m[1].slice(0, 6)}…${m[1].slice(-4)}`;
  return url.slice(0, 40) + "…";
}
