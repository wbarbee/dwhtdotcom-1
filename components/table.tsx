'use client';
import { useCallback } from 'react';
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
} from '@nextui-org/react';
import useGameData from '@/hooks/useGameData';
import { Game } from '@/types';
import { useMediaQuery } from '@react-hook/media-query';

const columns = [
    { name: 'AWAY', uid: 'away' },
	{ name: 'HOME', uid: 'home' },
	{ name: 'SCORE', uid: 'score' },
	{ name: 'LOCATION', uid: 'location' },
	{ name: 'DATE', uid: 'date' },
];

export default function StatsTable() {
	const { games, error, refetch } = useGameData();
	const isMobile = useMediaQuery('(max-width: 640px)');

	const renderCell = useCallback(
		(game: Game, columnKey: keyof Game) => {
			const cellValue = game[columnKey];

			const texasWon = game.result === 'win';
			const gameFinished = game.status === 'STATUS_FINAL';

			const isWinner = (isTexasTeam: boolean) => {
				if (!gameFinished) return false;
				return texasWon === isTexasTeam;
			};

			const winnerStyle = 'font-bold text-green-400';

			const getScore = (isHome: boolean) => {
				if (game.neutralSite) {
					return game.isTexasHome === isHome ? game.homeTeamScore : game.awayTeamScore;
				}
				return isHome ? game.homeTeamScore : game.awayTeamScore;
			};

			switch (columnKey) {
				case 'away':
					return (
						<span className={isWinner(!game.isTexasHome) ? winnerStyle : ''}>
							{gameFinished && game.awayTeamRank && Number(game.awayTeamRank) < 50 ? `[${game.awayTeamRank}]` : ''} {isMobile ? game.awayTeamAbbrev : game.away}
						</span>
					);
				case 'home':
					return (
						<span className={isWinner(game.isTexasHome) ? winnerStyle : ''}>
							{gameFinished && game.homeTeamRank && Number(game.homeTeamRank) < 50 ? `[${game.homeTeamRank}]` : ''} {isMobile ? game.homeTeamAbbrev : game.home} 
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
									variant='flat'
								>
                                    {game.score}
								</Chip>
							)}
						</div>
					);
				case 'location':
					return (
						<>
							{game.location}{game.neutralSite ? <span className='ml-1 text-red-400 font-bold'>*</span> : ''}
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

	return (
		<div className='w-full relative pb-10'>
			{games && games.length > 0 && (
				<Table
					aria-label='University of Texas Longhorns 2023 Season Record'
					className='min-w-full overflow-x-auto'>
					<TableHeader columns={columns}>
						{(column: { uid: string; name: string }) => (
							<TableColumn key={column.uid} align='center'>
								{column.name}
							</TableColumn>
						)}
					</TableHeader>
					<TableBody items={games}>
						{(item: Game) => (
							<TableRow key={item.id}>
								{(columnKey) => (
									<TableCell>
										{renderCell(item, columnKey as keyof Game)}
									</TableCell>
								)}
							</TableRow>
						)}
                    </TableBody>
				</Table>
            )}
            <div className='text-xs absolute bottom-0 left-8 md:left-10'>
                <span className='font-bold text-red-400'>*</span> = neutral site game
            </div>
		</div>
	);
}
