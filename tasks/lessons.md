# Lessons Learned

## Project-Specific
- table.tsx contained a duplicate ScoreCard component — cleaned up during Phase 3
- modal.tsx had its own StatsTable that independently fetched data — replaced with card-based ScheduleList
- ESPN team ID for Texas is '251'
- Game status strings use ESPN format: STATUS_IN_PROGRESS, STATUS_HALFTIME, etc.
- ThemeSwitch is positioned fixed top-5 right-5 in layout, not in a navbar
- The `burntOrange` color was a flat string, now expanded to a full shade scale (50-900) with DEFAULT
- Pre-existing build issue: about page sometimes fails with PageNotFoundError (stale .next cache)
- When extending a type with new required fields, also update: mockData.ts, formatCurrentEventData.ts, fetchLiveGame
- ESPN API competitors array has team.id, team.logos[0].href, team.displayName for opponent data
- SEC conference detection uses a Set of ESPN team IDs for O(1) lookup
- Next.js file-based OG images (opengraph-image.tsx) automatically replace static openGraph.images in metadata
- Linter may auto-modify modal button styling — watch for external changes to committed files
