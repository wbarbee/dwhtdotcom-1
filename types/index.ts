import { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

export interface Game {
	id: string;
	home: string;
	away: string;
	score: string;
	location: string;
	date: string;
	timestamp: number;
	result: 'win' | 'loss' | 'upcoming';
	status: string;
}

export interface FormattedGameData {
	team1Name: string;
	team1Score: string | number | null;
	team2Name: string;
	team2Score: string | number | null;
	team1Record?: string | null;
	team2Record?: string | null;
	team1Rank: number | null;
	team2Rank: number | null;
	gameStatus: string;
	gameDate: string;
	formattedGameDate: string;
	seasonType: string;
	neutralSite: boolean;
	venueCity: string;
	venueState: string;
	venueStadium: string;
	gamePeriod: number | null;
	gameClockDisplay: string;
	gameHeadline: string;
	weHookedThem?: boolean;
	shortName?: string;
}

export interface ScheduledEvent {
	competitions: ScheduleCompetition[];
	gameStatus: string;
	seasonType: {
		name: string;
	};
	date?: string;
	season?: string | null;
	headline?: string;
	shortName?: string;
}

export interface TeamInfo {
	standingSummary: string;
	rank: number;
	wins: number;
	losses: number;
}

export interface GameStatsProps {
	gameData: FormattedGameData;
	teamData: TeamInfo | null;
	backupNextGameInfo: FormattedGameData | null;
}

export interface ScheduleCompetitor {
	score?: {
		value: number | null;
	};
	team?: {
		displayName?: string;
		abbreviation?: string;
	};
	date: string;
	homeAway?: string;
}

interface ScheduleCompetition {
	status: {
		clock: number;
		displayClock: string;
		period: number;
		type: {
			name: string;
		};
	};
	date?: string;
	neutralSite: boolean;
	notes?: NotesProps[];
	venue: {
		address: {
			city: string;
			state: string;
			zipCode: string;
		};
		fullName: string;
	};
	type?: {
		text: string;
	};
}

type NotesProps = {
	type: string;
	headline: string;
};
