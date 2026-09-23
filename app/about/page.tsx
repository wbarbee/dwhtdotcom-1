import Image from 'next/image';
import hookSrc from '../../public/images/horns-1.png';
import { Link } from '@nextui-org/link';
import { Button } from '@nextui-org/button';
import { ThemeSwitch, scoreboardToolbarClass } from '@/components/theme-switch';

export default function About() {
	return (
		<div className='about-page h-full flex items-center justify-center relative'>
			<div className={`fixed top-5 right-5 z-[14] ${scoreboardToolbarClass}`}>
				<ThemeSwitch />
			</div>
			<div className='bg-background/60 dark:bg-default-50/30 h-auto max-w-[810px] w-[95%] flex flex-col px-6 pb-6 animate-fade-in'>
				<div className='max-w-[5rem] w-full h-auto mx-auto my-8'>
					<Image alt='longhorn logo' src={hookSrc} width={100} height={100} />
				</div>
				<p className='mb-6 font-menlo text-justify max-w-[95%] mx-auto'>
					didwehookthem.com seeks to become the premier authority on whether or
					not we hooked them. any commentary, critique, usage inquiries should
					be directed to{' '}
					<Link
						href='mailto:will.clayton.barbee@gmail.com'
						color='foreground'
						underline='always'>
						the author
					</Link>
					.
				</p>

				<p className='text-center font-menlo mb-6'>
					<Button
						href='/'
						as={Link}
						color='default'
						showAnchorIcon
						variant='solid'>
						hook them
					</Button>
				</p>

				<p className='text-center font-menlo text-sm'>
					&copy; {new Date().getFullYear()} didwehookthem.com. All rights
					reserved.
				</p>
			</div>
		</div>
	);
}
