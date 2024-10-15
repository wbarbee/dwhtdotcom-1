const gameModes = {
	win: {
		backgroundImage: '/images/celebration.jpeg',
		backgroundImageNight: '/images/celebration.jpeg',
		title: 'We hooked them.',
		hookEmClasses: 'text-7xl',
	},
	loss: {
		backgroundImage: '/images/hell.webp',
		backgroundImageNight: '/images/hell.webp',
		title: 'We did not hook them',
		hookEmClasses: 'text-7xl rotate-180',
	},
	upcoming: {
		backgroundImage: '/images/magic-eye-2.webp',
		backgroundImageNight: '/images/magic-eye-2.webp',
		title: 'UP NEXT:',
		hookEmClasses: 'text-7xl animate-spin',
	},
	current: {
		backgroundImage: '/images/mem_stadium-day.webp',
		backgroundImageNight: '/images/mem_stadium.webp',
		title: '',
		hookEmClasses: 'text-7xl animate-pulse-opacity',
	},
	auto: {
		backgroundImage: '',
		backgroundImageNight: '',
		title: '',
		hookEmClasses: 'text-7xl',
	},
};

export default gameModes;
