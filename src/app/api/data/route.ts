import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

const KEYS = ['tasks', 'projects', 'people', 'project_people', 'decisions', 'stats'] as const;

export async function GET() {
  const { blobs } = await list({ prefix: 'projectman/' });

  const blobMap = new Map(blobs.map((b) => [b.pathname, b.url]));

  const result: Record<string, unknown> = {};

  await Promise.all(
    KEYS.map(async (key) => {
      const url = blobMap.get(`projectman/${key}.json`);
      if (url) {
        const res = await fetch(url);
        result[key] = await res.json();
      } else {
        result[key] = key === 'stats' ? {} : [];
      }
    })
  );

  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-cache' },
  });
}
