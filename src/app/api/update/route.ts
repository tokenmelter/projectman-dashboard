import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

const KEYS = ['tasks', 'projects', 'people', 'project_people', 'decisions', 'stats'] as const;

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (auth !== 'Bearer projectman-sync-2026') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  await Promise.all(
    KEYS.map((key) =>
      put(`projectman/${key}.json`, JSON.stringify(body[key] ?? []), {
        access: 'public',
        addRandomSuffix: false,
      })
    )
  );

  return NextResponse.json({ ok: true });
}
