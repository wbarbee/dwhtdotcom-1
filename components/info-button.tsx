import { Button } from '@nextui-org/button';
import { Link } from '@nextui-org/link';
import { Tooltip } from '@nextui-org/tooltip';

const InfoButton = () => {
	return (
		<div className='fixed bottom-3 right-3 z-40'>
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
					className='rounded-full min-w-0 text-xs p-2 w-[25px] h-[25px] opacity-60 hover:opacity-100 transition-opacity duration-300'>
					?
				</Button>
			</Tooltip>
		</div>
	);
};

export default InfoButton;
