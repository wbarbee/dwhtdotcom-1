import React, { useState } from 'react';
import {
	Button,
	Dropdown,
	DropdownTrigger,
	DropdownMenu,
	DropdownItem,
} from '@nextui-org/react';
import { mockGames, getGameByMode } from '../utils/mockData';
import { Game } from '../types';

interface DevOverrideProps {
	overrideVisible: boolean;
	refreshData: (mockData?: Game) => Promise<void>;
}

const DevOverride: React.FC<DevOverrideProps> = ({
	overrideVisible,
	refreshData,
}) => {
	const [selectedMode, setSelectedMode] = useState<string>('scheduled');

	if (!overrideVisible) return null;

	const handleModeChange = async (mode: string) => {
		setSelectedMode(mode);
		const mockData = getGameByMode(mode);
		await refreshData(mockData);
	};

	return (
		<div className='fixed top-0 left-0 z-50 p-4 bg-gray-800 text-white'>
			<h3 className='text-lg font-bold mb-2'>Dev Override</h3>
			<div className='flex flex-col gap-2 mb-2'>
				<Dropdown>
					<DropdownTrigger>
						<Button variant='bordered'>
							{selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)}
						</Button>
					</DropdownTrigger>
					<DropdownMenu
						aria-label='Mock data scenarios'
						onAction={(key) => handleModeChange(key as string)}>
						{Object.keys(mockGames).map((mode) => (
							<DropdownItem key={mode}>
								{mode.charAt(0).toUpperCase() + mode.slice(1)}
							</DropdownItem>
						))}
					</DropdownMenu>
				</Dropdown>
				<Button size='sm' onClick={() => refreshData()}>
					Refresh Live Data
				</Button>
			</div>
		</div>
	);
};

export default DevOverride;
