'use client';
import ScoreCard from '@/components/card';
import Loading from '@/components/loading';
import { useCurrentGameData } from '@/hooks/useCurrentGameData';
import useGameData from '@/hooks/useGameData';

export default function Home() {
	const { fullGameDataIsLoading } = useGameData();
	const { currentGameData, setCurrentGameData, error } = useCurrentGameData();

	if (fullGameDataIsLoading) return <Loading />;

	return (
		<section className='h-full flex flex-col items-center justify-center gap-4 py-0 md:py-10 px-6 animate-fade-in'>
			<div className='-mt-10 w-full max-w-4xl justify-center flex my-8'>
				<ScoreCard
					currentGameData={currentGameData}
					setCurrentGameData={setCurrentGameData}
					error={error}
				/>
			</div>
		</section>
	);
}
