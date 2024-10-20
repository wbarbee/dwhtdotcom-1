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
		| 'STATUS_IN_PROGRESS'
		| 'STATUS_FINAL'
		| 'STATUS_HALFTIME'
		| 'STATUS_CURRENT'
		| 'STATUS_END_PERIOD'
		| 'STATUS_PRE_END_PERIOD';
	isTexasHome: boolean;
};
