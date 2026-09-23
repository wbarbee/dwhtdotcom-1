'use client';
import { useCallback, useEffect, useState } from 'react';
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
import { Calendar } from 'lucide-react';
import { fetchUpcomingSchedule } from '../hooks/fetchGameData';
import { Game, GameSummaryStats } from '../types';
import { getOpponentRank } from '../utils/rankUtils';
import GameSummary from './game-summary';
import { scoreboardControlClass } from './theme-switch';

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
	const [detailGame, setDetailGame] = useState<Game | null>(null);
	const [statsCache, setStatsCache] = useState<
		Record<string, GameSummaryStats>
	>({});
	const isMobile = useMediaQuery('(max-width: 640px)');

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
					const seasonYear =
						firstDate.getMonth() >= 7
							? firstDate.getFullYear()
							: firstDate.getFullYear() - 1;
					onSeasonChange(`${seasonYear}`);
				}
			} catch {
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
	}, [onLoadingChange, onSeasonChange]);

	const cacheStats = useCallback((stats: GameSummaryStats) => {
		setStatsCache((prev) =>
			prev[stats.eventId] ? prev : { ...prev, [stats.eventId]: stats },
		);
	}, []);

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

	const detailOpponent = detailGame
		? detailGame.isTexasHome
			? detailGame.away
			: detailGame.home
		: null;

	return (
		<>
			<div className='flex flex-col gap-2'>
				{games.map((g) => {
					const opponent = g.isTexasHome ? g.away : g.home;
					const opponentRank = getOpponentRank(g);
					const ha = g.neutralSite ? 'N' : g.isTexasHome ? 'vs' : '@';
					const isCompleted = g.status === 'STATUS_FINAL';

					const openDetail = () => {
						if (!isCompleted) return;
						setDetailGame(g);
					};

					const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
						if (!isCompleted) return;
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							openDetail();
						}
					};

					return (
						<div
							key={g.id}
							role={isCompleted ? 'button' : undefined}
							tabIndex={isCompleted ? 0 : undefined}
							aria-label={
								isCompleted
									? `${opponent}, ${g.score}. View game stats`
									: undefined
							}
							onClick={isCompleted ? openDetail : undefined}
							onKeyDown={isCompleted ? handleKeyDown : undefined}
							className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
								isCompleted
									? 'cursor-pointer bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/5 hover:bg-black/[0.05] dark:hover:bg-white/[0.07] hover:border-black/10 dark:hover:border-white/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-burntOrange/40'
									: 'cursor-default bg-transparent border border-transparent'
							}`}
						>
							<div className='flex items-center gap-3 min-w-0'>
								<span className='text-xs text-foreground/40 font-mono w-[75px] shrink-0'>
									{g.date}
								</span>
								<span className='text-xs text-foreground/30 w-5 text-center shrink-0'>
									{ha}
								</span>
								<span className='text-sm text-foreground/90 truncate'>
									{opponentRank !== null && (
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
									<span
										className='text-lg min-w-[28px] text-center'
										role='img'
										aria-label='Win'
									>
										🤘
									</span>
								) : g.result === 'loss' ? (
									<span
										className='text-lg min-w-[28px] text-center rotate-180 inline-block'
										role='img'
										aria-label='Loss'
									>
										🤘
									</span>
								) : (
									<span className='text-xs text-foreground/30 min-w-[28px] text-center'>
										--
									</span>
								)}
								{isCompleted && (
									<svg
										width='10'
										height='10'
										viewBox='0 0 10 10'
										fill='none'
										stroke='currentColor'
										strokeWidth='1.5'
										strokeLinecap='round'
										strokeLinejoin='round'
										aria-hidden='true'
										className='text-foreground/30 shrink-0'
									>
										<path d='M3 2l4 3-4 3' />
									</svg>
								)}
							</div>
						</div>
					);
				})}
			</div>

			<Modal
				isOpen={detailGame !== null}
				onOpenChange={(open) => {
					if (!open) setDetailGame(null);
				}}
				scrollBehavior='inside'
				size={isMobile ? 'full' : '2xl'}
				shouldBlockScroll={!isMobile}
				disableAnimation={isMobile}
				classNames={{
					wrapper: isMobile ? '!h-[100dvh] items-stretch' : 'items-center',
					base: isMobile
						? 'max-h-[100dvh] m-0 rounded-none bg-surface-50 dark:bg-surface-950'
						: 'max-h-[85dvh] m-2 rounded-xl glass-card flex flex-col',
					backdrop: isMobile ? 'bg-surface-50 dark:bg-surface-950' : undefined,
					closeButton: 'top-3 right-3 hover:bg-white/5 active:bg-white/10',
					header: 'flex-shrink-0',
					body: 'px-4 py-2 overflow-y-auto overscroll-contain flex-1 min-h-0',
					footer: 'flex-shrink-0',
				}}
			>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className='flex flex-col gap-0.5 pb-1'>
								<span className='text-lg font-display italic text-gradient-orange'>
									{detailGame?.neutralSite || detailGame?.isTexasHome
										? 'vs.'
										: '@'}{' '}
									{detailOpponent}
								</span>
								{detailGame && (
									<span className='text-xs text-foreground/40 font-normal'>
										{detailGame.date}
										{detailGame.score ? ` · ${detailGame.score}` : ''}
									</span>
								)}
							</ModalHeader>
							<ModalBody>
								{detailGame && (
									<GameSummary
										eventId={detailGame.id}
										cached={statsCache[detailGame.id] ?? null}
										onLoaded={cacheStats}
									/>
								)}
							</ModalBody>
							<ModalFooter className='pt-2'>
								<Button
									onPress={onClose}
									size='sm'
									className='bg-burntOrange hover:bg-burntOrange-600 text-white font-medium rounded-lg transition-colors'
								>
									Close
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}

const CalendarIcon = ({ size = 15 }: { size?: number }) => (
	<Calendar size={size} strokeWidth={1.75} />
);

function getDefaultSeasonLabel(): string {
	const now = new Date();
	// During off-season (Jan-Aug), the upcoming season is the current year
	// During active season (Sep-Dec), it's also the current year
	return `${now.getFullYear()}`;
}

/** NextUI/React Aria can leave body scroll-lock / pointer-events after a full-screen mobile close. */
function unlockPageInteraction() {
	const unlock = () => {
		document.body.style.removeProperty('overflow');
		document.body.style.removeProperty('padding-right');
		document.body.style.removeProperty('pointer-events');
		document.documentElement.style.removeProperty('overflow');
		document.documentElement.style.removeProperty('padding-right');
		document.body.removeAttribute('data-scroll-locked');
	};
	unlock();
	// Run again after exit animation / React Aria cleanup settles
	requestAnimationFrame(unlock);
	window.setTimeout(unlock, 50);
	window.setTimeout(unlock, 320);
}

export default function FullScoreModal({ variant = 'icon' }: FullScoreModalProps) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const isMobile = useMediaQuery('(max-width: 640px)');
	const [isTableLoading, setIsTableLoading] = useState(true);
	const [seasonLabel, setSeasonLabel] = useState(getDefaultSeasonLabel);

	useEffect(() => {
		if (isOpen) return;
		unlockPageInteraction();
	}, [isOpen]);

	const handleOpenChange = (open: boolean) => {
		if (open) {
			onOpen();
		} else {
			onClose();
			unlockPageInteraction();
		}
	};

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
				<button
					type='button'
					onClick={onOpen}
					className={scoreboardControlClass}
					aria-label='View full schedule'
				>
					<CalendarIcon />
				</button>
			)}
			<Modal
				isOpen={isOpen}
				onOpenChange={handleOpenChange}
				scrollBehavior='inside'
				size={isMobile ? 'full' : '2xl'}
				// Full-screen mobile already covers the page; blocking scroll is what
				// leaves iOS/Android unable to tap after close.
				shouldBlockScroll={!isMobile}
				disableAnimation={isMobile}
				classNames={{
					wrapper: isMobile ? '!h-[100dvh] items-stretch' : 'items-center',
					base: isMobile
						? 'max-h-[100dvh] m-0 rounded-none bg-surface-50 dark:bg-surface-950'
						: 'max-h-[85dvh] m-2 rounded-xl glass-card flex flex-col',
					backdrop: isMobile ? 'bg-surface-50 dark:bg-surface-950' : undefined,
					closeButton: 'top-3 right-3 hover:bg-white/5 active:bg-white/10',
					header: 'flex-shrink-0',
					body: 'px-4 py-2 overflow-y-auto overscroll-contain flex-1 min-h-0',
					footer: 'flex-shrink-0',
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
								<ScheduleList
									onLoadingChange={setIsTableLoading}
									onSeasonChange={setSeasonLabel}
								/>
							</ModalBody>
							<ModalFooter className='pt-2'>
								{!isTableLoading && (
									<>
										<span className='text-[10px] text-foreground/30 mr-auto'>
											<span className='text-accent-gold'>*</span> neutral site
										</span>
										<Button
											onPress={() => {
												onClose();
												unlockPageInteraction();
											}}
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
