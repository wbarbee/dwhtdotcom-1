import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl;
	const result = searchParams.get('result') || 'upcoming';
	const score = searchParams.get('score') || '';
	const opponent = searchParams.get('opponent') || '';
	const record = searchParams.get('record') || '';

	const title =
		result === 'win'
			? 'WE HOOKED THEM.'
			: result === 'loss'
				? 'WE DID NOT HOOK THEM.'
				: 'DID WE HOOK THEM?';

	const titleColor =
		result === 'win'
			? '#c05700'
			: result === 'loss'
				? '#dc2626'
				: '#ffffff';

	const [texasScore, oppScore] = score.includes('-')
		? score.split('-').map((s) => s.trim())
		: [null, null];

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
					background:
						'linear-gradient(135deg, #060504 0%, #0c0a09 40%, #1c1917 100%)',
					fontFamily: 'Arial, sans-serif',
				}}
			>
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

				{texasScore && oppScore && (
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
						<span>TEX {texasScore}</span>
						<span
							style={{
								color: 'rgba(255,255,255,0.3)',
								fontSize: 40,
							}}
						>
							-
						</span>
						<span style={{ color: 'rgba(255,255,255,0.7)' }}>
							{oppScore} {opponent}
						</span>
					</div>
				)}

				{record && (
					<div
						style={{
							fontSize: 24,
							color: 'rgba(255,255,255,0.4)',
							display: 'flex',
							letterSpacing: '3px',
						}}
					>
						{record}
					</div>
				)}

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
			width: 1200,
			height: 630,
		}
	);
}
