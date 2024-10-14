import { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

export interface Game {
	id: string;
	homeTeam: string;
	awayTeam: string;
	home: string;
	away: string;
	longhornsRecord: number | null;
	homeTeamRank?: number | string;
	awayTeamRank?: number | string;
	homeTeamAbbrev: string;
	awayTeamAbbrev: string;
	homeTeamScore: number | string | null;
	awayTeamScore: number | string | null;
	score: string;
	location: string;
	date: string;
	currentPeriod: number | null;
	neutralSite: boolean;
	timestamp: number;
	status: string;
	result: 'win' | 'loss' | 'upcoming';
	isTexasHome: boolean;
}
