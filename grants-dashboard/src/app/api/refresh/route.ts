import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/serverSession";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  revalidateTag("notion");
  return NextResponse.json({ ok: true });
}
