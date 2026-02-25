import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

const VALID_KEYS = [
  "tasks",
  "projects",
  "people",
  "project_people",
  "decisions",
  "stats",
] as const;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== "Bearer projectman-sync-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  await Promise.all(
    VALID_KEYS.map((key) => {
      const data = body[key] ?? (key === "stats" ? {} : []);
      return put(`${key}.json`, JSON.stringify(data), {
        access: "public",
        addRandomSuffix: false,
      });
    })
  );

  return NextResponse.json({ ok: true });
}
