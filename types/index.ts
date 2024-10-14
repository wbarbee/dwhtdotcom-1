import { SVGProps } from 'react';

export type IconSvgProps = SVGProps<SVGSVGElement> & {
	size?: number;
};

export interface Game {
	id: string;
	home: string;
	away: string;
	longhornsRecord: string | null;
	currentPeriod: number | null;
	homeTeamRank: number | string;
	awayTeamRank: number | string;
	homeTeamAbbrev: string;
	awayTeamAbbrev: string;
	homeTeamScore: number | string | null;
	awayTeamScore: number | string | null;
	score: string;
	neutralSite: boolean;
	location: string;
	date: string;
	timestamp: number;
	status: string;
	result: 'win' | 'loss' | 'upcoming';
	isTexasHome: boolean;
}
