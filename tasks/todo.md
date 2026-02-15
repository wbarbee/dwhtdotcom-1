# DWHT Overhaul Plan

## Phase 1: Design System Foundation
- [x] Expand tailwind.config.ts (color palette, font roles)
- [x] Overhaul globals.css (premium dark background, glassmorphism utilities)
- [x] Verify fonts.ts alignment

## Phase 2: Hero Card Redesign
- [x] Redesign card.tsx with glass-card styling
- [x] Adjust page.tsx layout with dot-grid background

## Phase 3: Schedule Modal + Theme Switch Redesign
- [x] Redesign modal.tsx with glass-card styling, card-based game rows
- [x] Clean up table.tsx (removed duplicate ScoreCard)
- [x] Restyle theme-switch.tsx

## Phase 4: Data Layer Enhancements
- [x] Extend Game type in types/index.ts (opponentId, rivalry, scores, etc.)
- [x] Add opponent/rivalry data to fetchGameData.ts (SEC_TEAM_IDS, RIVALRY_MAP)
- [x] Create utils/seasonUtils.ts (parseSeasonRecord, getRivalryGames, calculateHookEmIndex)
- [x] Update mockData.ts with new fields + mockFullSeason
- [x] Update formatCurrentEventData.ts

## Phase 5: Season Record Display
- [x] Create components/season-record.tsx
- [x] Integrate into page.tsx (above hero card)

## Phase 6: Rivalry Tracker
- [x] Create components/rivalry-tracker.tsx
- [x] Add tab navigation to page.tsx (Rivalries tab)

## Phase 7: Hook 'Em Index
- [x] Create components/hook-em-index.tsx (SVG gauge, animated, factor bars)
- [x] Add as tab in page.tsx (Hook 'Em Index tab)

## Phase 8: Dynamic OG Share Cards
- [x] Create app/opengraph-image.tsx (file-based, auto-detected by Next.js)
- [x] Create app/api/og/route.tsx (shareable endpoint with query params)
- [x] Update app/layout.tsx metadata (removed static images array)

## Additional Changes
- [x] Extended API date range to include 2026-2027 season
