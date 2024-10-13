// import { Link } from '@nextui-org/link';
// import { Snippet } from '@nextui-org/snippet';
// import { button as buttonStyles } from '@nextui-org/theme';
import StatsTable from '@/components/table';
import CurrentGameCard from '@/components/currentGameCard';

export default function Home() {
	return (
		<section className='flex flex-col items-center justify-center gap-4 py-8 md:py-10'>
			<div className='w-full max-w-4xl justify-center flex my-8'>
				<CurrentGameCard />
			</div>
			<div className='w-full max-w-4xl'>
				<StatsTable />
			</div>
		</section>
	);
}
