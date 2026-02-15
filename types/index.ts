export type Game = {
	id: string;
	home: string;
	away: string;
	longhornsRecord: string;
	homeTeamRank: number;
	awayTeamRank: number;
	currentPeriod: number | null;
	homeTeamAbbrev: string;
	awayTeamAbbrev: string;
	homeTeamScore: number | null;
	awayTeamScore: number | null;
	location: string;
	neutralSite: boolean;
	date: string;
	timestamp: number;
	score: string;
	result: 'win' | 'loss' | 'upcoming';
	status:
		| 'STATUS_SCHEDULED'
		| 'STATUS_PRE_GAME'
		| 'STATUS_IN_PROGRESS'
		| 'STATUS_FINAL'
		| 'STATUS_HALFTIME'
		| 'STATUS_CURRENT'
		| 'STATUS_END_PERIOD'
		| 'STATUS_PRE_END_PERIOD'
		| 'STATUS_OVERTIME';
	isTexasHome: boolean;
	opponentId: string;
	opponentName: string;
	opponentLogo?: string;
	texasScore: number | null;
	opponentScore: number | null;
	pointDifferential: number | null;
	isRivalry: boolean;
	rivalryName?: string;
	isConferenceGame?: boolean;
};

export type SeasonRecord = {
	wins: number;
	losses: number;
	conferenceWins: number;
	conferenceLosses: number;
	streak: number;
	streakType: 'W' | 'L' | 'none';
	texasRank: number | null;
};

export type HookEmIndex = {
	score: number;
	grade: string;
	factors: {
		winPercentage: number;
		strengthOfVictory: number;
		rivalryBonus: number;
		marginFactor: number;
		rankingBonus: number;
	};
};

export interface IconSvgProps extends React.SVGProps<SVGSVGElement> {
	size?: number;
	width?: number;
	height?: number;
}
