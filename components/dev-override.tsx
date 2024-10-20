import React from 'react';
import { Button } from '@nextui-org/react';

interface DevOverrideProps {
	overrideVisible: boolean;
	refreshData: () => Promise<void>;
}

const DevOverride: React.FC<DevOverrideProps> = ({
	overrideVisible,
	refreshData,
}) => {
	if (!overrideVisible) return null;

	const handleRefresh = async () => {
		await refreshData();
	};

	return (
		<div className='fixed top-0 left-0 z-50 p-4 bg-gray-800 text-white'>
			<h3 className='text-lg font-bold mb-2'>Dev Override</h3>
			<div className='flex flex-wrap gap-2'>
				<Button size='sm' onClick={handleRefresh}>
					Refresh Data
				</Button>
			</div>
		</div>
	);
};

export default DevOverride;
