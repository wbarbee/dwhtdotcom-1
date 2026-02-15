import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Did We Hook Them?';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_FULL_SCHEDULE =
	'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/texas/schedule?startDate=2025-08-01&endDate=2027-03-31';

async function getCurrentGameInfo() {
	try {
		const res = await fetch(`${API_FULL_SCHEDULE}&_=${Date.now()}`, {
			cache: 'no-store',
		});
		if (!res.ok) return null;
		const data = await res.json();
		if (!data.events || data.events.length === 0) return null;

		const now = Date.now();
		const events = data.events;

		// Find most relevant game: in-progress > recent final (48h) > next upcoming
		for (const event of events) {
			const status = event.competitions?.[0]?.status?.type?.name;
			if (
				status === 'STATUS_IN_PROGRESS' ||
				status === 'STATUS_HALFTIME' ||
				status === 'STATUS_OVERTIME'
			) {
				return parseEvent(event, data.team?.recordSummary);
			}
		}

		// Check for recent completed game within 48h
		const completedGames = events
			.filter(
				(e: any) =>
					e.competitions?.[0]?.status?.type?.name === 'STATUS_FINAL'
			)
			.sort(
				(a: any, b: any) =>
					new Date(b.date).getTime() - new Date(a.date).getTime()
			);

		for (const event of completedGames) {
			const gameTime = new Date(event.date).getTime();
			if (now - gameTime <= 48 * 60 * 60 * 1000) {
				return parseEvent(event, data.team?.recordSummary);
			}
		}

		// Return most recent completed or null
		if (completedGames.length > 0) {
			return parseEvent(completedGames[0], data.team?.recordSummary);
		}

		return null;
	} catch {
		return null;
	}
}

function parseEvent(event: any, record?: string) {
	const comp = event.competitions[0];
	const texasTeam = comp.competitors.find((t: any) => t.id === '251');
	const opponentTeam = comp.competitors.find((t: any) => t.id !== '251');
	const status = comp.status?.type?.name;

	const isTexasHome = texasTeam?.homeAway === 'home';
	const texasScore =
		texasTeam?.score?.value ?? texasTeam?.score ?? null;
	const oppScore =
		opponentTeam?.score?.value ?? opponentTeam?.score ?? null;

	let result: 'win' | 'loss' | 'upcoming' = 'upcoming';
	if (status === 'STATUS_FINAL') {
		result = texasTeam?.winner ? 'win' : 'loss';
	}

	return {
		opponent: opponentTeam?.team?.displayName || 'Opponent',
		texasScore: texasScore !== null ? Number(texasScore) : null,
		oppScore: oppScore !== null ? Number(oppScore) : null,
		result,
		status,
		record: record || '',
	};
}

export default async function Image() {
	const game = await getCurrentGameInfo();

	const title = game
		? game.result === 'win'
			? 'WE HOOKED THEM.'
			: game.result === 'loss'
				? 'WE DID NOT HOOK THEM.'
				: 'DID WE HOOK THEM?'
		: 'DID WE HOOK THEM?';

	const titleColor =
		game?.result === 'win'
			? '#c05700'
			: game?.result === 'loss'
				? '#dc2626'
				: '#ffffff';

	return new ImageResponse(
		(
			<div
				style={{
					width: '100%',
					height: '100%',
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #060504 0%, #0c0a09 40%, #1c1917 100%)',
					fontFamily: 'Arial, sans-serif',
				}}
			>
				{/* Subtle orange accent */}
				<div
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						background:
							'radial-gradient(ellipse at 30% 50%, rgba(192,87,0,0.12) 0%, transparent 60%)',
						display: 'flex',
					}}
				/>

				{/* Title */}
				<div
					style={{
						fontSize: 64,
						fontWeight: 900,
						fontStyle: 'italic',
						color: titleColor,
						letterSpacing: '2px',
						display: 'flex',
						marginBottom: 20,
					}}
				>
					{title}
				</div>

				{/* Score */}
				{game &&
					game.texasScore !== null &&
					game.oppScore !== null && (
						<div
							style={{
								fontSize: 80,
								fontWeight: 700,
								color: '#ffffff',
								display: 'flex',
								gap: '20px',
								alignItems: 'center',
								marginBottom: 16,
							}}
						>
							<span>TEX {game.texasScore}</span>
							<span
								style={{
									color: 'rgba(255,255,255,0.3)',
									fontSize: 40,
								}}
							>
								-
							</span>
							<span style={{ color: 'rgba(255,255,255,0.7)' }}>
								{game.oppScore} {game.opponent.split(' ').pop()}
							</span>
						</div>
					)}

				{/* Record */}
				{game?.record && (
					<div
						style={{
							fontSize: 24,
							color: 'rgba(255,255,255,0.4)',
							display: 'flex',
							letterSpacing: '3px',
						}}
					>
						{game.record}
					</div>
				)}

				{/* Site URL */}
				<div
					style={{
						position: 'absolute',
						bottom: 30,
						fontSize: 18,
						color: 'rgba(255,255,255,0.2)',
						display: 'flex',
						letterSpacing: '2px',
					}}
				>
					DIDWEHOOKTHEM.COM
				</div>
			</div>
		),
		{
			...size,
		}
	);
}
