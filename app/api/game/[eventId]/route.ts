import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESPN_SUMMARY =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary';

const NO_STORE = {
	'Cache-Control': 'no-store, no-cache, must-revalidate',
	Pragma: 'no-cache',
};

export async function GET(
	_request: NextRequest,
	{ params }: { params: { eventId: string } }
) {
	const eventId = params.eventId;
	if (!eventId) {
		return NextResponse.json(
			{ error: 'Missing event id' },
			{ status: 400, headers: NO_STORE }
		);
	}

	try {
		const response = await fetch(
			`${ESPN_SUMMARY}?event=${encodeURIComponent(eventId)}&_=${Date.now()}`,
			{
				cache: 'no-store',
				headers: { Accept: 'application/json' },
			}
		);
		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch game' },
				{ status: response.status, headers: NO_STORE }
			);
		}
		const data = await response.json();
		return NextResponse.json(data, { headers: NO_STORE });
	} catch {
		return NextResponse.json(
			{ error: 'Failed to fetch game' },
			{ status: 502, headers: NO_STORE }
		);
	}
}
