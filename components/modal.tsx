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
import { Calendar, X } from 'lucide-react';
import { fetchUpcomingSchedule } from '../hooks/fetchGameData';
import { Game, GameSummaryStats } from '../types';
import { getOpponentRank } from '../utils/rankUtils';
import GameSummary from './game-summary';
import { scoreboardControlClass } from './theme-switch';

interface FullScoreModalProps {
	result?: 'win' | 'loss' | 'upcoming';
	variant?: 'icon' | 'wide';
}

function hasStarted(game: Game) {
	return (
		game.status !== 'STATUS_SCHEDULED' && game.status !== 'STATUS_PRE_GAME'
	);
}

export function ScheduleList({
	onLoadingChange,
	onSeasonChange,
	playedOnly = false,
}: {
	onLoadingChange?: (loading: boolean) => void;
	onSeasonChange?: (season: string) => void;
	/** Tab view: drop games that have not kicked off. The schedule modal keeps the full list. */
	playedOnly?: boolean;
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

	const closeDetail = useCallback(() => {
		setDetailGame(null);
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

	const visibleGames = playedOnly ? games.filter(hasStarted) : games;

	if (!visibleGames || visibleGames.length === 0) {
		return (
			<div className='w-full flex items-center justify-center py-12'>
				<p className='text-foreground/60'>
					{playedOnly ? 'No completed games yet.' : 'No games scheduled.'}
				</p>
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
				{visibleGames.map((g) => {
					const opponent = g.isTexasHome ? g.away : g.home;
					const opponentRank = getOpponentRank(g);
					const ha = g.neutralSite ? 'N' : g.isTexasHome ? 'vs' : '@';
					const isCompleted = g.status === 'STATUS_FINAL';

					const openDetail = (e?: React.SyntheticEvent) => {
						if (!isCompleted) return;
						e?.stopPropagation();
						setDetailGame(g);
					};

					const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
						if (!isCompleted) return;
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							e.stopPropagation();
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
							className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors ${
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
								<span className='flex flex-col min-w-0'>
									<span className='text-sm text-foreground/90 truncate'>
										{opponentRank !== null && (
											<span className='text-burntOrange text-xs font-bold mr-1'>
												#{opponentRank}
											</span>
										)}
										{opponent}
									</span>
									{g.seasonPhase === 'postseason' && g.eventName && (
										<span className='text-[10px] text-foreground/40 truncate'>
											{g.eventName}
										</span>
									)}
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
					if (!open) closeDetail();
				}}
				scrollBehavior='inside'
				size={isMobile ? 'full' : '2xl'}
				disableAnimation
				hideCloseButton
				isDismissable
				portalContainer={
					typeof document !== 'undefined' ? document.body : undefined
				}
				classNames={sharedModalClassNames(isMobile)}
			>
				<ModalContent>
					{(onClose) => (
						<>
							<CloseButton
								ariaLabel='Close'
								className={modalDismissButtonClass}
								onClose={onClose}
							>
								<X size={18} strokeWidth={1.75} />
							</CloseButton>
							<ModalHeader className='flex flex-col gap-0.5 pb-1 pr-12'>
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
							<ModalFooter>
								<CloseButton
									className={modalCloseButtonClass}
									onClose={onClose}
								>
									Close
								</CloseButton>
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

/** Native activation handles touch, pen, mouse, and keyboard on one path. */
function CloseButton({
	onClose,
	className,
	children,
	ariaLabel,
}: {
	onClose: () => void;
	className?: string;
	children: React.ReactNode;
	ariaLabel?: string;
}) {
	return (
		<button
			type='button'
			className={className}
			aria-label={ariaLabel}
			onClick={onClose}
		>
			{children}
		</button>
	);
}

const modalCloseButtonClass =
	'touch-manipulation bg-burntOrange hover:bg-burntOrange-600 text-white font-medium rounded-lg transition-colors text-sm px-4 min-w-11 min-h-11 inline-flex items-center justify-center relative z-[80]';

const modalDismissButtonClass =
	'touch-manipulation absolute top-3 right-3 z-[80] min-w-11 min-h-11 inline-flex items-center justify-center rounded-full text-foreground/60 hover:bg-black/5 active:bg-black/10 dark:hover:bg-white/10 dark:active:bg-white/15';

const sharedModalClassNames = (isMobile: boolean) => ({
	wrapper: isMobile
		? '!h-[100dvh] items-stretch z-[100] !overflow-hidden'
		: 'items-center z-[100] !overflow-hidden',
	base: isMobile
		? 'max-h-[100dvh] m-0 rounded-none bg-surface-50 dark:bg-surface-950'
		: 'max-h-[85dvh] m-2 rounded-xl bg-surface-50 dark:bg-surface-950 border border-black/10 dark:border-white/10 shadow-xl flex flex-col',
	backdrop: isMobile
		? 'bg-surface-50 dark:bg-surface-950 z-[99]'
		: 'z-[99]',
	closeButton:
		'z-[70] top-3 right-3 min-w-10 min-h-10 flex items-center justify-center hover:bg-white/5 active:bg-white/10',
	header: 'flex-shrink-0 relative z-[1]',
	body: 'px-4 py-2 overflow-y-auto overscroll-contain flex-1 min-h-0',
	footer:
		'touch-manipulation flex-shrink-0 relative z-[70] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]',
});


export default function FullScoreModal({ variant = 'icon' }: FullScoreModalProps) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const isMobile = useMediaQuery('(max-width: 640px)');
	const [isTableLoading, setIsTableLoading] = useState(true);
	const [seasonLabel, setSeasonLabel] = useState(getDefaultSeasonLabel);

	const closeModal = () => {
		onClose();
	};

	const handleOpenChange = (open: boolean) => {
		if (open) {
			onOpen();
		} else {
			closeModal();
		}
	};

	return (
		<>
			{variant === 'wide' ? (
				<Button
					onPress={onOpen}
					className='w-full h-11 rounded-xl bg-burntOrange/10 hover:bg-burntOrange/20 text-burntOrange border border-burntOrange/20 hover:border-burntOrange/30 font-medium text-sm transition-all gap-2'
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
				disableAnimation
				hideCloseButton
				isDismissable
				portalContainer={
					typeof document !== 'undefined' ? document.body : undefined
				}
				classNames={sharedModalClassNames(isMobile)}
			>
				<ModalContent>
					{() => (
						<>
							<CloseButton
								ariaLabel='Close'
								className={modalDismissButtonClass}
								onClose={closeModal}
							>
								<X size={18} strokeWidth={1.75} />
							</CloseButton>
							<ModalHeader className='flex flex-col gap-1 pb-2 pr-12'>
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
							<ModalFooter className='gap-2'>
								{!isTableLoading && (
									<span className='text-[10px] text-foreground/30 mr-auto self-center'>
										<span className='text-accent-gold'>*</span> neutral site
									</span>
								)}
								<CloseButton
									className={`${modalCloseButtonClass}${isTableLoading ? ' ml-auto' : ''}`}
									onClose={closeModal}
								>
									Close
								</CloseButton>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
