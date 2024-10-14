const gameModes = {
	win: {
		backgroundImage: 'bg-[url("/images/celebration.jpeg")]',
		backgroundImageNight: 'dark:bg-[url("/images/celebration.jpeg")]',
		title: 'We hooked them.',
		hookEmClasses: 'text-7xl',
	},
	loss: {
		backgroundImage: 'bg-[url("/images/hell.webp")]',
		backgroundImageNight: 'dark:bg-[url("/images/hell.webp")]',
		title: 'We did not hook them',
		hookEmClasses: 'text-7xl rotate-180',
	},
	upcoming: {
		backgroundImage: 'bg-[url("/images/magic-eye-2.webp")]',
		backgroundImageNight: 'dark:bg-[url("/images/magic-eye-2.webp")]',
		title: 'UP NEXT:',
		hookEmClasses: 'text-7xl animate-spin',
	},
	current: {
		backgroundImage: 'bg-[url("/images/mem_stadium-day.webp")]',
		backgroundImageNight: 'dark:bg-[url("/images/mem_stadium.webp")]',
		title: '',
		hookEmClasses: 'text-7xl animate-pulse',
	},
	auto: {
		backgroundImage: '',
		backgroundImageNight: '',
		title: '',
		hookEmClasses: 'text-7xl',
	},
};

export default gameModes;
