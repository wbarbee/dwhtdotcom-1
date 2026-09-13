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

export type HookEmFactorBreakdown = {
	label: string;
	points: number;
};

export type HookEmIndex = {
	score: number;
	grade: string;
	/** True when fewer than 4 games have been played — grade is early-season. */
	provisional: boolean;
	/** False until an OU/A&M rivalry game is completed — factor is excluded from scoring. */
	rivalryActive: boolean;
	factors: {
		winPercentage: number;
		strengthOfVictory: number;
		rivalryBonus: number;
		marginFactor: number;
		rankingBonus: number;
	};
	breakdowns: {
		winPercentage: HookEmFactorBreakdown[];
		strengthOfVictory: HookEmFactorBreakdown[];
		rivalryBonus: HookEmFactorBreakdown[];
		marginFactor: HookEmFactorBreakdown[];
		rankingBonus: HookEmFactorBreakdown[];
	};
};

export type GameSummaryTeamStats = {
	teamId: string;
	abbreviation: string;
	displayName: string;
	isTexas: boolean;
	stats: { label: string; value: string }[];
};

export type GameSummaryLeader = {
	category: string;
	athlete: string;
	displayValue: string;
};

export type GameSummaryScoringPlay = {
	id: string;
	period: number;
	clock: string;
	teamAbbrev: string;
	text: string;
	awayScore: number;
	homeScore: number;
};

export type GameSummaryStats = {
	eventId: string;
	teams: GameSummaryTeamStats[];
	texasLeaders: GameSummaryLeader[];
	scoringPlays: GameSummaryScoringPlay[];
};

export interface IconSvgProps extends React.SVGProps<SVGSVGElement> {
	size?: number;
	width?: number;
	height?: number;
}
