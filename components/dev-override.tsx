import gameModes from '@/constants/gameModes';
import { Game } from '@/types';
import {
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
	Button,
} from '@nextui-org/react';

const DevOverride = ({
	overrideVisible,
	overrideMode,
	refetchGameData,
	setOverrideMode,
	setCurrentGameData,
}: {
	overrideVisible: boolean;
	overrideMode: keyof typeof gameModes | null;
	refetchGameData: (mode?: string) => Promise<Game[]>;
	setOverrideMode: (mode: keyof typeof gameModes | null) => void;
	setCurrentGameData: (data: Game) => void;
}) => {
	const handleOverrideChange = async (key: string) => {
		const newMode = key === 'auto' ? null : (key as keyof typeof gameModes);
		setOverrideMode(newMode);
		if (
			process.env.NODE_ENV === 'development' &&
			process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'
		) {
			const newData = await refetchGameData(newMode as string | undefined);
			if (newData && newData.length > 0) {
				const relevantGame = newData.find(
					(game) =>
						game.status === 'STATUS_CURRENT' ||
						(game.status === 'STATUS_FINAL' &&
							new Date(game.date).getTime() >
								Date.now() - 48 * 60 * 60 * 1000) ||
						game.status === 'STATUS_SCHEDULED'
				);
				if (relevantGame) setCurrentGameData(relevantGame);
			}
		}
	};

	return (
		overrideVisible && (
			<div className='fixed bottom-3 left-3'>
				<Dropdown>
					<DropdownTrigger>
						<Button
							variant='bordered'
							className='bg-[rgba(255,255,255,0.6)] dark:bg-[rgba(0,0,0,0.6)] border-none rounded-[3px]'>
							{overrideMode || 'auto (no override)'}
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label='Game mode selection'
						onAction={(key) => handleOverrideChange(key.toString())}>
						{Object.keys(gameModes).map((mode) => (
							<DropdownItem key={mode}>{mode}</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
			</div>
		)
	);
};

export default DevOverride;
