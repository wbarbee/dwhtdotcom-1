const gameModes = {
	offseason: {
		backgroundImage: '/images/gwen.jpg',
		backgroundImageNight: '/images/gwen.jpg',
		title: 'OFF SEASON',
		hookEmClasses: 'text-6xl background-position-[-400px] top-[50px]',
	},
	win: {
		backgroundImage: '/images/hank.png',
		backgroundImageNight: '/images/hank.png',
		title: 'We hooked them.',
		hookEmClasses: 'text-6xl',
	},
	loss: {
		backgroundImage: '/images/hank-loss.webp',
		backgroundImageNight: '/images/hank-loss.webp',
		title: 'We did not hook them',
		hookEmClasses: 'text-6xl rotate-180',
	},
	upcoming: {
		backgroundImage: '/images/crowd.png',
		backgroundImageNight: '/images/crowd.png',
		title: 'UPCOMING...',
		hookEmClasses: 'text-6xl',
	},
	current: {
		backgroundImage: '/images/dkr-day.webp',
		backgroundImageNight: '/images/dkr-night.webp',
		title: '',
		hookEmClasses: 'text-6xl animate-spin',
	},
	auto: {
		backgroundImage: '',
		backgroundImageNight: '',
		title: '',
		hookEmClasses: 'text-6xl',
	},
};

export default gameModes;
