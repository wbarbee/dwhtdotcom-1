'use client';
import { useCallback, useState, useEffect } from 'react';
// ts.ignore
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	Button,
	Skeleton,
} from '@nextui-org/react';
import useGameData from '@/hooks/useGameData';
import { Game } from '@/types';

const columns = [
	{ name: 'AWAY', uid: 'away' },
	{ name: 'HOME', uid: 'home' },
	{ name: 'SCORE', uid: 'score' },
	{ name: 'LOCATION', uid: 'location' },
	{ name: 'DATE', uid: 'date' },
];

export default function StatsTable() {
	const { games, error, refetch } = useGameData();
	const [isMobile, setIsMobile] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const checkIfMobile = () => {
			setIsMobile(window.innerWidth <= 640);
		};

		checkIfMobile();
		window.addEventListener('resize', checkIfMobile);

		return () => window.removeEventListener('resize', checkIfMobile);
	}, []);

	useEffect(() => {
		if (games && games.length > 0) {
			const timer = setTimeout(() => {
				setIsLoading(false);
			}, 1000);

			return () => clearTimeout(timer);
		}
	}, [games]);

	const renderCell = useCallback(
		(game: Game, columnKey: keyof Game) => {
			const cellValue = game[columnKey];

			const texasWon = game.result === 'win';
			const gameFinished = game.status === 'STATUS_FINAL';

			const isWinner = (isTexasTeam: boolean) => {
				if (!gameFinished) return false;
				return texasWon === isTexasTeam;
			};

			const winnerStyle = 'font-bold text-green-600';

			switch (columnKey) {
				case 'away':
					return (
						<span className={isWinner(!game.isTexasHome) ? winnerStyle : ''}>
							{gameFinished &&
							game.awayTeamRank &&
							Number(game.awayTeamRank) < 50 &&
							!isMobile
								? `[${game.awayTeamRank}]`
								: ''}{' '}
							{isMobile ? game.awayTeamAbbrev : game.away}
						</span>
					);
				case 'home':
					return (
						<span className={isWinner(game.isTexasHome) ? winnerStyle : ''}>
							{gameFinished &&
							game.homeTeamRank &&
							Number(game.homeTeamRank) < 50
								? `[${game.homeTeamRank}]` && !isMobile
								: ''}{' '}
							{isMobile ? game.homeTeamAbbrev : game.home}
						</span>
					);
				case 'score':
					return (
						<div className='flex items-center space-x-2'>
							<span className='text-xl text-burntOrange font-gothic font-bold'>
								{game.result === 'win'
									? '🤘'
									: game.result === 'loss'
										? '❌'
										: '🤘?'}
							</span>
							{gameFinished && (
								<Chip
									className='capitalize'
									color={
										game.result === 'win'
											? 'success'
											: game.result === 'loss'
												? 'danger'
												: 'default'
									}
									size='sm'
									variant='flat'>
									{game.score}
								</Chip>
							)}
						</div>
					);
				case 'location':
					return (
						<>
							{game.location}
							{game.neutralSite ? (
								<span className='ml-1 text-red-400 font-bold'>*</span>
							) : (
								''
							)}
						</>
					);
				default:
					return (
						<div className='truncate'>
							{typeof cellValue === 'string'
								? cellValue
								: JSON.stringify(cellValue)}
						</div>
					);
			}
		},
		[isMobile]
	);

	if (error) {
		return (
			<div>
				<div>Error: {error.message}</div>
				<Button onClick={refetch}>Retry</Button>
			</div>
		);
	}

	const renderSkeleton = () => (
		<>
			{Array(10)
				.fill(null)
				.map((_, index) => (
					<TableRow key={`skeleton-${index}`}>
						{columns.map((column) => (
							<TableCell key={column.uid}>
								<Skeleton className='w-full'>
									<div className='h-3 w-full rounded-lg bg-default-200'></div>
								</Skeleton>
							</TableCell>
						))}
					</TableRow>
				))}
		</>
	);

	return (
		<div className='w-full overflow-x-auto'>
			<Table
				aria-label='University of Texas Longhorns 2023 Season Record'
				className='min-w-full'>
				<TableHeader columns={columns}>
					{(column) => (
						<TableColumn key={column.uid} align='center'>
							{column.name}
						</TableColumn>
					)}
				</TableHeader>
				<TableBody>
					{isLoading || !games
						? renderSkeleton()
						: games.map((game) => (
								<TableRow key={game.id} className='animate-fade-in'>
									{(columnKey) => (
										<TableCell>
											{renderCell(game, columnKey as keyof Game)}
										</TableCell>
									)}
								</TableRow>
							))}
				</TableBody>
			</Table>
		</div>
	);
}
