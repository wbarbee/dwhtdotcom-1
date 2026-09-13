import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ESPN_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule';

const NO_STORE = {
	'Cache-Control': 'no-store, no-cache, must-revalidate',
	Pragma: 'no-cache',
};

export async function GET(request: NextRequest) {
	const incoming = request.nextUrl.searchParams;
	const params = new URLSearchParams();
	const season = incoming.get('season');
	const seasontype = incoming.get('seasontype');
	if (season) params.set('season', season);
	if (seasontype) params.set('seasontype', seasontype);
	params.set('_', String(Date.now()));

	try {
		const response = await fetch(`${ESPN_SCHEDULE}?${params.toString()}`, {
			cache: 'no-store',
			headers: { Accept: 'application/json' },
		});
		if (!response.ok) {
			return NextResponse.json(
				{ error: 'Failed to fetch schedule' },
				{ status: response.status, headers: NO_STORE }
			);
		}
		const data = await response.json();
		return NextResponse.json(data, { headers: NO_STORE });
	} catch {
		return NextResponse.json(
			{ error: 'Failed to fetch schedule' },
			{ status: 502, headers: NO_STORE }
		);
	}
}
