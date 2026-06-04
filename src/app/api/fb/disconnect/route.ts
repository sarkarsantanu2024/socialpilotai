import { NextResponse } from "next/server";
import { clearConnection } from "@/lib/fb/session";

export async function POST() {
  clearConnection();
  return NextResponse.json({ ok: true });
}
