export interface Game {
	id: string;
	home: string;
	away: string;
	score?: string;
	location?: string;
	date: string;
	timestamp: number;
	result: 'win' | 'loss' | 'upcoming';
	status: string;
}

export interface FormattedGameData {
	// Add properties based on your createFormattedGameDataFromEvent function
	competitor1: any; // Replace 'any' with the actual type
	competitor2: any; // Replace 'any' with the actual type
	gameStatus: string;
	gameDate: Date;
	seasonType: string;
	neutralSite: boolean;
	venueCity: string;
	venueState: string;
	venueStadium: string;
	gamePeriod: number;
	gameClockDisplay: string;
	gameHeadline: string;
}

export interface ScheduledEvent {
	competitions: {
		competitors?: {
			team?: {
				displayName: string;
			};
		};
	}[];
}
