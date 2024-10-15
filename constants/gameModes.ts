const gameModes = {
	win: {
		backgroundImage: '/images/party.jpg',
		backgroundImageNight: '/images/party.jpg',
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
		backgroundImage: '/images/agrey.jpg',
		backgroundImageNight: '/images/agrey.jpg',
		title: 'WILL WE 🤘?',
		hookEmClasses: 'text-7xl',
	},
	current: {
		backgroundImage: '/images/mem_stadium-day.webp',
		backgroundImageNight: '/images/mem_stadium.webp',
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
