'use client';

import { useEffect } from 'react';
import { Button } from '@nextui-org/react';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<div className='flex flex-col rounded-md items-center justify-center min-h-screen bg-gradient-to-br from-burntOrange/70 via-gray-600 to-burntOrange/80 text-white p-4 font-menlo'>
			<h1 className='text-4xl font-semibold mb-4'>
				Oops! Something went wrong
			</h1>
			<div className='bg-white/10 rounded-lg mt-4 p-6 max-w-md w-full'>
				<h2 className='text-2xl font-semibold mb-2'>Error Details:</h2>
				<p className='mb-4'>
					{error.message || 'An unexpected error occurred.'}
				</p>
				{error.digest && (
					<p className='text-sm mb-4'>Error ID: {error.digest}</p>
				)}
				<div className='flex flex-col space-y-2'>
					<Button
						color='primary'
						onClick={reset}
						className='bg-burntOrange hover:bg-orange-700 transition-colors'>
						Try Again
					</Button>
					<Button
						color='secondary'
						onClick={() => (window.location.href = '/')}
						className='bg-gray-600 hover:bg-gray-700 transition-colors'>
						Go to Homepage
					</Button>
				</div>
			</div>
			<p className='mt-8 text-sm text-center'>
				If this error persists, please contact support or check our status page.
			</p>
		</div>
	);
}
