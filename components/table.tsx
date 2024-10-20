'use client';
import { useCallback, useState, useEffect } from 'react';
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
	{ name: 'HOOKED THEM?', uid: 'score' },
	{ name: 'LOCATION', uid: 'location' },
	{ name: 'DATE', uid: 'date' },
];

export default function StatsTable() {
	const { games, error, refetch } = useGameData();
	const [isMobile, setIsMobile] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	console.log('Games:', games);

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

			const showRanking =
				Number(game.awayTeamRank) < 50 &&
				!isMobile &&
				game.status === 'STATUS_FINAL';

			switch (columnKey) {
				case 'away':
					return (
						<span
							className={
								game.result === 'win' && !game.isTexasHome
									? 'font-bold text-green-600'
									: ''
							}>
							{game.awayTeamRank && showRanking
								? `[${game.awayTeamRank}] `
								: ''}
							{isMobile ? game.awayTeamAbbrev : game.away}
						</span>
					);
				case 'home':
					return (
						<span
							className={
								game.result === 'win' && game.isTexasHome
									? 'font-bold text-green-600'
									: ''
							}>
							{game.homeTeamRank && showRanking
								? `[${game.homeTeamRank}] `
								: ''}
							{isMobile ? game.homeTeamAbbrev : game.home}
						</span>
					);
				case 'location':
					return (
						<span>
							{isMobile && game.location === 'DKR-Texas Memorial Stadium'
								? 'DKR'
								: game.location}{' '}
							{game.neutralSite && (
								<span className='font-bold text-red-400 ml-[1px]'>*</span>
							)}
						</span>
					);
				case 'score':
					return (
						<div className='flex items-center space-x-2'>
							{game.result === 'win' ? (
								<span className='text-xl text-burntOrange font-gothic font-bold'>
									🤘
								</span>
							) : game.result === 'loss' ? (
								<span
									style={{
										display: 'inline-block',
										transform: 'rotate(180deg)',
									}}>
									🤘
								</span>
							) : (
								<span className='text-xl text-burntOrange font-gothic font-bold'>
									🤘?
								</span>
							)}
							{['win', 'loss'].includes(game.result) && (
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
									{typeof cellValue === 'string'
										? cellValue
										: JSON.stringify(cellValue)}
								</Chip>
							)}
						</div>
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

	const renderSkeleton = () => (
		<>
			{Array(12)
				.fill(null)
				.map((_, index) => (
					<TableRow key={`skeleton-${index}`}>
						{columns.map((column) => (
							<TableCell key={column.uid}>
								<Skeleton className='w-full'>
									<div className='h-3 w-full mb-1 rounded-lg bg-default-200'></div>
								</Skeleton>
							</TableCell>
						))}
					</TableRow>
				))}
		</>
	);

	if (error) {
		return (
			<div>
				<div>Error: {error.message}</div>
				<Button onClick={refetch}>Retry</Button>
			</div>
		);
	}

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
					{isLoading
						? renderSkeleton()
						: games
							? games.map((game) => (
									<TableRow key={game.id}>
										{(columnKey) => (
											<TableCell className='animate-fade-in'>
												{renderCell(game, columnKey as keyof Game)}
											</TableCell>
										)}
									</TableRow>
								))
							: renderSkeleton()}
				</TableBody>
			</Table>
		</div>
	);
}
