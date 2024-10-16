const gameModes = {
	win: {
		backgroundImage: '/images/hank.png',
		backgroundImageNight: '/images/hank.png',
		title: 'We hooked them.',
		hookEmClasses: 'text-7xl',
	},
	loss: {
		backgroundImage: '/images/hank-loss.webp',
		backgroundImageNight: '/images/hank-loss.webp',
		title: 'We did not hook them',
		hookEmClasses: 'text-7xl rotate-180',
	},
	upcoming: {
		backgroundImage: '/images/crowd.png',
		backgroundImageNight: '/images/crowd.png',
		title: 'UPCOMING...',
		hookEmClasses: 'text-7xl',
	},
	current: {
		backgroundImage: '/images/dkr-day.webp',
		backgroundImageNight: '/images/dkr-night-1.jpg',
		title: '',
		hookEmClasses: 'text-7xl animate-spin',
	},
	auto: {
		backgroundImage: '',
		backgroundImageNight: '',
		title: '',
		hookEmClasses: 'text-7xl',
	},
};

export default gameModes;
