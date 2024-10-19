const Loading = () => {
	return (
		<div className='mb-4rem md:mb-0 flex flex-col justify-center align-center w-full h-screen animate-fade-in'>
			<h1 className='my-0 text-[6cqw] md:text-[4cqw] lg:text-[3cqw] text-burntOrange text-center font-espn font-normal italic'>
				Did we hook them?
			</h1>
			<div className='w-[5rem] md:w-[7rem] h-[6rem] md:h-[8rem] mx-auto mt-[1.5rem] animate-spin'>
				<span className='animate-spin text-[4rem] md:text-[6rem]'>🤘</span>
			</div>
		</div>
	);
};

export default Loading;
