import { head } from "@vercel/blob";
import { NextResponse } from "next/server";

const KEYS = [
  "tasks",
  "projects",
  "people",
  "project_people",
  "decisions",
  "stats",
] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const result: Record<string, unknown> = {};

  await Promise.all(
    KEYS.map(async (key) => {
      try {
        const meta = await head(`${key}.json`);
        const res = await fetch(meta.url);
        result[key] = await res.json();
      } catch {
        result[key] = key === "stats" ? {} : [];
      }
    })
  );

  return NextResponse.json(result);
}
