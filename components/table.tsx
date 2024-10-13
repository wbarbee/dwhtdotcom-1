'use client';
import React from 'react';
import {
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	Spinner,
	Button,
} from '@nextui-org/react';
import useGameData from '@/hooks/useGameData';
import { Game } from '@/types';

const columns = [
	{ name: 'HOME', uid: 'home' },
	{ name: 'AWAY', uid: 'away' },
	{ name: 'SCORE', uid: 'score' },
	{ name: 'LOCATION', uid: 'location' },
	{ name: 'DATE', uid: 'date' },
];

export default function StatsTable() {
	const { games, isLoading, error, refetch } = useGameData();

	const renderCell = React.useCallback((game: Game, columnKey: keyof Game) => {
		const cellValue = game[columnKey];

		switch (columnKey) {
			case 'score':
				console.log('Score cell value:', cellValue);
				return (
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
				);
			default:
				return typeof cellValue === 'string'
					? cellValue
					: JSON.stringify(cellValue);
		}
	}, []);

	if (error) {
		return (
			<div>
				<div>Error: {error.message}</div>
				<Button onClick={refetch}>Retry</Button>
			</div>
		);
	}

	return (
		<div>
			<div className='flex justify-between items-center mb-4'>
				<h2 className='text-2xl font-bold'>
					University of Texas Longhorns 2023 Season Record
				</h2>
				<Button onClick={refetch} isLoading={isLoading}>
					{isLoading ? 'Refreshing...' : 'Refresh'}
				</Button>
			</div>
			{isLoading ? (
				<Spinner label='Loading game data...' />
			) : games && games.length > 0 ? (
				<Table aria-label='University of Texas Longhorns 2023 Season Record'>
					<TableHeader columns={columns}>
						{(column) => (
							<TableColumn key={column.uid} align='center'>
								{column.name}
							</TableColumn>
						)}
					</TableHeader>
					<TableBody items={games}>
						{(item) => (
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
			) : (
				<div>No game data available</div>
			)}
		</div>
	);
}
