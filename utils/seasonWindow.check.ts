import {
	awaitingChampionship,
	completedSeasonYear,
	isSeasonOfficiallyOver,
	liveFootballSeasonYear,
	type SeasonSnap,
} from './seasonWindow.ts';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.parse('2026-01-10T18:00:00Z');

function game(overrides: Partial<SeasonSnap> & Pick<SeasonSnap, 'timestamp'>): SeasonSnap {
	return {
		status: 'STATUS_FINAL',
		result: 'win',
		seasonPhase: 'regular',
		...overrides,
	};
}

const regularFinale = game({ timestamp: now - 40 * DAY });
const bowlWin = game({
	timestamp: now - 10 * DAY,
	seasonPhase: 'postseason',
	eventName: 'Cheez-It Citrus Bowl',
	result: 'win',
});
const bowlLoss = game({
	timestamp: now - 10 * DAY,
	seasonPhase: 'postseason',
	eventName: 'Cheez-It Citrus Bowl',
	result: 'loss',
});
const freshLoss = game({
	timestamp: now - 1 * DAY,
	seasonPhase: 'postseason',
	eventName: 'Cheez-It Citrus Bowl',
	result: 'loss',
});
const playoffWin = game({
	timestamp: now - 10 * DAY,
	seasonPhase: 'postseason',
	eventName: 'College Football Playoff Quarterfinal at the Rose Bowl',
	result: 'win',
});
const titleWin = game({
	timestamp: now - 10 * DAY,
	seasonPhase: 'postseason',
	eventName: 'College Football Playoff National Championship Presented by AT&T',
	result: 'win',
});
const upcomingBowl = game({
	timestamp: now + 5 * DAY,
	status: 'STATUS_SCHEDULED',
	result: 'upcoming',
	seasonPhase: 'postseason',
	eventName: 'Cheez-It Citrus Bowl',
});

const titleKickoff = now - 4 * DAY;
const recentTitleKickoff = now - 1 * DAY;

const cases: [string, boolean][] = [
	['in progress stays open', isSeasonOfficiallyOver([regularFinale, upcomingBowl], now, null) === false],
	['no bowl yet stays open', isSeasonOfficiallyOver([regularFinale], now, null) === false],
	['bowl win waits for the championship', isSeasonOfficiallyOver([regularFinale, bowlWin], now, null) === false],
	['bowl win closes after the championship', isSeasonOfficiallyOver([regularFinale, bowlWin], now, titleKickoff) === true],
	['bowl win stays open the day after the championship', isSeasonOfficiallyOver([regularFinale, bowlWin], now, recentTitleKickoff) === false],
	['elimination closes after the linger', isSeasonOfficiallyOver([regularFinale, bowlLoss], now, null) === true],
	['elimination waits out the linger', isSeasonOfficiallyOver([regularFinale, freshLoss], now, null) === false],
	['playoff win stays open', isSeasonOfficiallyOver([regularFinale, playoffWin], now, null) === false],
	['title win closes after the linger', isSeasonOfficiallyOver([regularFinale, titleWin], now, titleWin.timestamp) === true],
	['empty stays open', isSeasonOfficiallyOver([], now, titleKickoff) === false],
	['awaits championship after a bowl win', awaitingChampionship([regularFinale, bowlWin], now) === true],
	['does not await after elimination', awaitingChampionship([regularFinale, bowlLoss], now) === false],
	['september is this season', liveFootballSeasonYear(new Date('2026-09-28T12:00:00Z')) === 2026],
	['january is last fall', liveFootballSeasonYear(new Date('2027-01-10T12:00:00Z')) === 2026],
	['march is the offseason', liveFootballSeasonYear(new Date('2027-03-01T12:00:00Z')) === null],
	['december archive is this year', completedSeasonYear(new Date('2026-12-20T12:00:00Z')) === 2026],
	['january archive is last fall', completedSeasonYear(new Date('2027-01-10T12:00:00Z')) === 2026],
];

const failed = cases.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) {
	console.error(failed.join('\n'));
	process.exit(1);
}
console.log(`${cases.length} season window checks passed`);
