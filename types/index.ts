import { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

export interface Game {
	id: string;
	home: string;
	away: string;
	homeTeam: string;
	awayTeam: string;
	homeTeamRank?: number | string;
	awayTeamRank?: number | string;
	homeTeamAbbrev: string;
	awayTeamAbbrev: string;
	homeTeamScore: number | string;
	awayTeamScore: number | string;
	score: string;
	location: string;
	date: string;
	currentPeriod: number | null;
	timestamp: number;
	status: string;
	result: 'win' | 'loss' | 'upcoming';
	isTexasHome: boolean;
}
