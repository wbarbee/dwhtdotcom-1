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
	{ name: 'HOME', uid: 'home' },
	{ name: 'AWAY', uid: 'away' },
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

			switch (columnKey) {
				case 'home':
					return isMobile ? game.homeTeamAbbrev : game.home;
				case 'away':
					return isMobile ? game.awayTeamAbbrev : game.away;
				case 'score':
					return (
						<div className='flex items-center space-x-2'>
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
							<span className='text-xl text-burntOrange font-gothic font-bold'>
								{game.result === 'win'
									? '🤘'
									: game.result === 'loss'
										? '❌'
										: '🤘?'}
							</span>
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
			{games && games.length > 0 && (
				<Table
					aria-label='University of Texas Longhorns 2023 Season Record'
					className='min-w-full'>
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
		</div>
	);
}
