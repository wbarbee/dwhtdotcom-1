'use client';
import ScoreCard from '@/components/card';
import Loading from '@/components/loading';
import { useCurrentGameData } from '@/hooks/useCurrentGameData';
import useGameData from '@/hooks/useGameData';
import { Button } from '@nextui-org/button';
import { Link } from '@nextui-org/link';
import { Tooltip } from '@nextui-org/tooltip';

export default function Home() {
	const { fullGameDataIsLoading } = useGameData();
	const { currentGameData, setCurrentGameData, error } = useCurrentGameData();

	if (fullGameDataIsLoading) return <Loading />;

	return (
		<section className='h-full flex flex-col items-center justify-center p-8 animate-fade-in'>
			<div className='w-full max-w-4xl justify-center flex'>
				<ScoreCard
					currentGameData={currentGameData}
					setCurrentGameData={setCurrentGameData}
					error={error}
				/>
			</div>
			<Tooltip
				content={
					<div className='font-menlo text-xs text-center py-2' color='default'>
						&copy; {new Date().getFullYear()} didwehookthem.com. All rights
						reserved.
						<br />
						<Link
							href='/about'
							className='font-menlo text-xs mt-1'
							underline='always'>
							Click for more info
						</Link>
					</div>
				}>
				<Button
					href='/about'
					as={Link}
					isIconOnly
					aria-label='About question mark'
					color='default'
					variant='solid'
					className='rounded-full min-w-0 text-xs p-2 fixed bottom-4 right-4 w-[25px] h-[25px] opacity-60 hover:opacity-100 transition-all ease-in-out duration-400'>
					?
				</Button>
			</Tooltip>
		</section>
	);
}
