import { useState, useEffect } from 'react';
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Spinner,
	Table,
	TableHeader,
	TableColumn,
	TableBody,
	TableRow,
	TableCell,
	Chip,
	useDisclosure,
} from '@nextui-org/react';
import { useMediaQuery } from '@react-hook/media-query';
import { fetchGameData } from '../hooks/fetchGameData';
import { Game } from '../types';

interface FullScoreModalProps {
	result: 'win' | 'loss' | 'upcoming';
}

function StatsTable({
	onLoadingChange,
}: {
	onLoadingChange?: (loading: boolean) => void;
}) {
	const [games, setGames] = useState<Game[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		onLoadingChange?.(true);
		(async () => {
			try {
				const data = await fetchGameData();
				if (!mounted) return;
				setGames(Array.isArray(data) ? data : []);
			} catch (e) {
				if (!mounted) return;
				setError('Failed to load game data');
			} finally {
				if (!mounted) return;
				setIsLoading(false);
				onLoadingChange?.(false);
			}
		})();
		return () => {
			mounted = false;
		};
	}, [onLoadingChange]);

	if (error) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<p className='text-danger'>{error}</p>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<Spinner size='lg' color='default' labelColor='foreground' />
			</div>
		);
	}

	if (!games || games.length === 0) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<p className='text-foreground/80'>No games scheduled.</p>
			</div>
		);
	}

	return (
		<Table aria-label='Full game data table' removeWrapper fullWidth>
			<TableHeader>
				<TableColumn>Date</TableColumn>
				<TableColumn>Opponent</TableColumn>
				<TableColumn>Home/Away</TableColumn>
				<TableColumn>Location</TableColumn>
				<TableColumn>Status</TableColumn>
				<TableColumn>Score</TableColumn>
				<TableColumn>Result</TableColumn>
			</TableHeader>
			<TableBody>
				{games.map((g) => {
					const opponent = g.isTexasHome ? g.away : g.home;
					const ha = g.isTexasHome
						? 'Home'
						: g.neutralSite
							? 'Neutral'
							: 'Away';
					return (
						<TableRow key={g.id}>
							<TableCell>{g.date}</TableCell>
							<TableCell>{opponent}</TableCell>
							<TableCell>{ha}</TableCell>
							<TableCell>
								{g.location}
								{g.neutralSite && (
									<span className='ml-1 align-middle text-xs'>*</span>
								)}
							</TableCell>
							<TableCell>
								{g.status?.replace('STATUS_', '').toLowerCase()}
							</TableCell>
							<TableCell>{g.score || ''}</TableCell>
							<TableCell>
								{g.result === 'win' || g.result === 'loss' ? (
									<Chip
										size='sm'
										color={g.result === 'win' ? 'success' : 'danger'}
										variant='flat'
									>
										{g.result}
									</Chip>
								) : (
									<span className='text-foreground/70'>upcoming</span>
								)}
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
}

export default function FullScoreModal({ result }: FullScoreModalProps) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const isMobile = useMediaQuery('(max-width: 640px)');
	const [isTableLoading, setIsTableLoading] = useState(true);

	return (
		<>
			<Button
				onPress={onOpen}
				className={`rounded-[50px] w-10 h-10 p-0 min-w-10  ${result === 'win' ? 'bg-white text-burntOrange md:bg-burntOrange' : 'bg-burntOrange text-white md:bg-burntOrange'} md:text-white`}
			>
				+
			</Button>
			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				scrollBehavior='inside'
				size={isMobile ? 'full' : '5xl'}
				classNames={{
					base: isMobile
						? 'max-h-[100vh] m-0 rounded-none animate-fade-in'
						: 'max-h-[85vh] m-2 rounded-lg animate-fade-in',
					closeButton: 'hover:bg-white/5 active:bg-white/10',
				}}
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className='flex flex-col gap-1'></ModalHeader>
							<ModalBody className='overflow-x-auto'>
								<StatsTable onLoadingChange={setIsTableLoading} />
							</ModalBody>
							<ModalFooter>
								<div className='text-xs absolute left-12 md:left-[4rem] bottom-8'>
									<span className='font-bold text-red-400'>*</span> = neutral
									site game
								</div>
								{!isTableLoading && (
									<Button
										onPress={onClose}
										size='sm'
										className='bg-burntOrange hover:bg-orange-700 text-white font-normal py-2 px-4 rounded-[3px] transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg'
									>
										Close
									</Button>
								)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
