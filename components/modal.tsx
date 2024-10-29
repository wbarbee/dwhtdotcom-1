import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	useDisclosure,
} from '@nextui-org/react';
import StatsTable from './table';
import { useMediaQuery } from '@react-hook/media-query';

interface FullScoreModalProps {
	result: 'win' | 'loss' | 'upcoming';
}

export default function FullScoreModal({ result }: FullScoreModalProps) {
	const { isOpen, onOpen, onOpenChange } = useDisclosure();
	const isMobile = useMediaQuery('(max-width: 640px)');

	return (
		<>
			<Button
				onPress={onOpen}
				className={`rounded-[50px] w-10 h-10 p-0 min-w-10  ${result === 'win' ? 'bg-white text-burntOrange md:bg-burntOrange' : 'bg-burntOrange text-white md:bg-burntOrange'} md:text-white`}>
				+
			</Button>
			<Modal
				isOpen={isOpen}
				onOpenChange={onOpenChange}
				scrollBehavior='inside'
				size={isMobile ? 'full' : '5xl'}
				classNames={{
					base: isMobile
						? 'max-h-[100vh] m-0 rounded-none animate-fade-in'
						: 'max-h-[85vh] m-2 rounded-lg animate-fade-in',
					closeButton: 'hover:bg-white/5 active:bg-white/10',
				}}>
				<ModalContent>
					{(onClose) => (
						<>
							<ModalHeader className='flex flex-col gap-1'></ModalHeader>
							<ModalBody className='overflow-x-auto'>
								<StatsTable />
							</ModalBody>
							<ModalFooter>
								<div className='text-xs absolute left-12 md:left-[4rem] bottom-8'>
									<span className='font-bold text-red-400'>*</span> = neutral
									site game
								</div>
								<Button
									onPress={onClose}
									size='sm'
									className='bg-burntOrange hover:bg-orange-700 text-white font-normal py-2 px-4 rounded-[3px] transition-colors duration-200 ease-in-out shadow-md hover:shadow-lg'>
									Close
								</Button>
							</ModalFooter>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
