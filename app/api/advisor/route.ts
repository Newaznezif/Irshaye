import { NextResponse } from 'next/server';

import { badRequest } from '@/lib/data/api';
import { AdvisorNotConfigured, advise, assembleEvidence } from '@/lib/advisor/server';

/**
 * POST /api/advisor
 *
 * Runs the agricultural advisor over freshly assembled, provenance-tagged
 * evidence. Read-only with respect to external publishers; it writes nothing
 * and stores nothing. Answers are decision support, never guarantees.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest('Body must be JSON');
  }
  const b = body as Record<string, unknown>;

  const lat = Number(b.latitude);
  const lon = Number(b.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return badRequest('latitude and longitude are required numbers within range');
  }
  const placeName = typeof b.placeName === 'string' && b.placeName.trim() ? b.placeName.trim().slice(0, 120) : 'Selected coordinate';
  const cropId = typeof b.cropId === 'string' ? b.cropId.slice(0, 40) : '';
  const question = typeof b.question === 'string' ? b.question.trim().slice(0, 900) : '';
  if (!cropId) return badRequest('cropId is required');
  if (question.length < 8) return badRequest('Ask a concrete question (at least a few words).');

  try {
    const evidence = await assembleEvidence({ latitude: lat, longitude: lon, placeName, cropId });
    const answer = await advise({ question, evidence });
    return NextResponse.json({ ok: true, answer, evidence });
  } catch (err) {
    if (err instanceof AdvisorNotConfigured) {
      return NextResponse.json(
        { ok: false, error: { code: 'advisor_not_configured', message: err.message } },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: 'advisor_failed',
          message: 'The advisor could not produce a verified answer. No recommendation is shown.',
        },
      },
      { status: 502 },
    );
  }
}
