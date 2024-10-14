import Image from 'next/image';
import hookSrc from '../../public/images/horns.png';
import { Link } from '@nextui-org/link';
import { Button } from '@nextui-org/button';

export default function About() {
	return (
		<div className='about-page h-full flex items-center justify-center'>
			<div className='bg-background/60 dark:bg-default-100/50 h-auto max-w-[810px] w-[95%] flex flex-col px-6 pb-6 -mt-[4rem] animate-fade-in'>
				<div className='max-w-[12rem] w-full h-auto mx-auto'>
					<Image alt='longhorn logo' src={hookSrc} width={336} height={336} />
				</div>
				<p className='mb-6 font-menlo'>
					didwehookthem.com seeks to become the premier authority on whether or
					not we hooked them. that being said, any commentary, critique, usage
					inquiries should be directed to{' '}
					<Link
						href='mailto:will.clayton.barbee@gmail.com'
						color='foreground'
						underline='always'>
						the creator
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
