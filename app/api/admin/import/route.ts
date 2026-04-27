import { NextRequest, NextResponse } from "next/server";
import { syncFromBuffer, type SyncMode } from "@/lib/sync";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const auth = await requireAuth("ADMIN1");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const mode = ((formData.get("mode") as string) ?? "sync") as SyncMode;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  const result = await syncFromBuffer(buffer, mode);
  return NextResponse.json(result);
}
