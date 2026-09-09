'use client';
import { useState, useEffect } from 'react';
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Spinner,
	useDisclosure,
} from '@nextui-org/react';
import { useMediaQuery } from '@react-hook/media-query';
import { fetchUpcomingSchedule } from '../hooks/fetchGameData';
import { Game } from '../types';

interface FullScoreModalProps {
	result?: 'win' | 'loss' | 'upcoming';
	variant?: 'icon' | 'wide';
}

export function ScheduleList({
	onLoadingChange,
	onSeasonChange,
}: {
	onLoadingChange?: (loading: boolean) => void;
	onSeasonChange?: (season: string) => void;
}) {
	const [games, setGames] = useState<Game[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;
		onLoadingChange?.(true);
		(async () => {
			try {
				const data = await fetchUpcomingSchedule();
				if (!mounted) return;
				const gameList = Array.isArray(data) ? data : [];
				setGames(gameList);
				if (gameList.length > 0 && onSeasonChange) {
					// Derive season year from first game's date (Aug-Dec = that year, Jan-Jul = previous year)
					const firstDate = new Date(gameList[0].date);
					const seasonYear = firstDate.getMonth() >= 7 ? firstDate.getFullYear() : firstDate.getFullYear() - 1;
					onSeasonChange(`${seasonYear}`);
				}
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
				<p className='text-accent-red'>{error}</p>
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
				<p className='text-foreground/60'>No games scheduled.</p>
			</div>
		);
	}

	return (
		<div className='flex flex-col gap-2'>
			{games.map((g) => {
				const opponent = g.isTexasHome ? g.away : g.home;
				const opponentRank = g.isTexasHome ? g.awayTeamRank : g.homeTeamRank;
				const ha = g.neutralSite
					? 'N'
					: g.isTexasHome
						? 'vs'
						: '@';

				return (
					<div
						key={g.id}
						className='flex items-center justify-between px-4 py-3 rounded-lg bg-white/5 dark:bg-white/[0.03] border border-white/5 hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors'
					>
						<div className='flex items-center gap-3 min-w-0'>
							<span className='text-xs text-foreground/40 font-mono w-[75px] shrink-0'>
								{g.date}
							</span>
							<span className='text-xs text-foreground/30 w-5 text-center shrink-0'>
								{ha}
							</span>
							<span className='text-sm text-foreground/90 truncate'>
								{Number(opponentRank) < 50 && (
									<span className='text-burntOrange text-xs font-bold mr-1'>
										#{opponentRank}
									</span>
								)}
								{opponent}
							</span>
							{g.neutralSite && (
								<span className='text-[10px] text-accent-gold'>*</span>
							)}
						</div>
						<div className='flex items-center gap-3 shrink-0'>
							{g.score && (
								<span className='text-sm font-score text-foreground/70'>
									{g.score}
								</span>
							)}
							{g.result === 'win' ? (
								<span className='text-lg min-w-[28px] text-center' role='img' aria-label='Win'>🤘</span>
							) : g.result === 'loss' ? (
								<span className='text-lg min-w-[28px] text-center rotate-180 inline-block' role='img' aria-label='Loss'>🤘</span>
							) : (
								<span className='text-xs text-foreground/30 min-w-[28px] text-center'>
									--
								</span>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}

const CalendarIcon = ({ size = 14 }: { size?: number }) => (
	<svg xmlns='http://www.w3.org/2000/svg' width={size} height={size} viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'><rect width='18' height='18' x='3' y='4' rx='2' ry='2'/><line x1='16' x2='16' y1='2' y2='6'/><line x1='8' x2='8' y1='2' y2='6'/><line x1='3' x2='21' y1='10' y2='10'/></svg>
);

function getDefaultSeasonLabel(): string {
	const now = new Date();
	// During off-season (Jan-Aug), the upcoming season is the current year
	// During active season (Sep-Dec), it's also the current year
	return `${now.getFullYear()}`;
}

export default function FullScoreModal({ variant = 'icon' }: FullScoreModalProps) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const isMobile = useMediaQuery('(max-width: 640px)');
	const [isTableLoading, setIsTableLoading] = useState(true);
	const [seasonLabel, setSeasonLabel] = useState(getDefaultSeasonLabel);

	return (
		<>
			{variant === 'wide' ? (
				<Button
					onPress={onOpen}
					className='w-full h-11 rounded-xl bg-burntOrange/10 hover:bg-burntOrange/20 text-burntOrange border border-burntOrange/20 hover:border-burntOrange/30 backdrop-blur-sm font-medium text-sm transition-all gap-2'
					aria-label={`View ${seasonLabel} schedule`}
				>
					<CalendarIcon size={16} />
					{seasonLabel} Schedule
				</Button>
			) : (
				<Button
					isIconOnly
					onPress={onOpen}
					className='bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground rounded-full backdrop-blur-sm border border-white/10'
					size='sm'
					aria-label='View full schedule'
				>
					<CalendarIcon />
				</Button>
			)}
			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				scrollBehavior='inside'
				size={isMobile ? 'full' : '2xl'}
				classNames={{
					base: isMobile
						? 'max-h-[100vh] m-0 rounded-none animate-fade-in bg-surface-50 dark:bg-surface-950'
						: 'max-h-[85vh] m-2 rounded-xl animate-fade-in glass-card',
					closeButton: 'top-3 right-3 hover:bg-white/5 active:bg-white/10',
					body: 'px-4 py-2',
				}}
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className='flex flex-col gap-1 pb-2'>
								<span className='text-lg font-display italic text-gradient-orange'>
									{seasonLabel} Schedule
								</span>
							</ModalHeader>
							<ModalBody>
								<ScheduleList onLoadingChange={setIsTableLoading} onSeasonChange={setSeasonLabel} />
							</ModalBody>
							<ModalFooter className='pt-2'>
								{!isTableLoading && (
									<>
										<span className='text-[10px] text-foreground/30 mr-auto'>
											<span className='text-accent-gold'>*</span> neutral site
										</span>
										<Button
											onPress={onClose}
											size='sm'
											className='bg-burntOrange hover:bg-burntOrange-600 text-white font-medium rounded-lg transition-colors'
										>
											Close
										</Button>
									</>
								)}
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
