import { NextResponse } from 'next/server';

import { isConfigured } from '@/lib/advisor/server';

/**
 * GET /api/advisor/status — capability probe for the Settings page.
 * Reports whether the environment can run the advisor at all. Never echoes
 * any credential material.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ configured: isConfigured() });
}
