# UI map — admin chat (Ăn Bill)

No Figma: the design concept is "Bàn đã bật đèn", a real table from above (wood rail, six pockets, felt under a lamp, scoreboard numerals in Big Shoulders, body text in Be Vietnam Pro). The tokens are in `src/styles/globals.css` (`@theme`). Viewports: 375 px phone and desktop ≥ 1024 px (ADR 0002 Q2v).

## Navigation

One navigation at every width, no sidebar: `FloatingDock` holds Today, History, the 8-ball, Board, and Wheel (viewer) or the assistant (admin). The 8-ball opens `RackMenu`: ten pages racked 1-2-3-4 as balls on the felt, with Change log and Admin as plain links under the rack.

## Motion

| Moment        | Where                                                  | How                                                                                                                                               | Reduced motion                |
| ------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 3D pool table | `features/leaderboard` (`table-canvas`, `lib/table-*`) | `three` over the flat table. The HTML buttons stay the controls and the scene pins them to each ball and pocket. It draws only while a ball moves | not loaded, flat table        |
| Pool game     | `features/home` (`pool-game`, `lib/pool-*`)            | 2D canvas on a fixed 1000×500 table, free play. Nine balls break once per browser session, then the cue ball's grip aims and shoots               | no auto break, still playable |
| Holo card     | `components/ui/holo-frame.tsx`                         | CSS variables set on pointer move, foil in `.holo-foil`. Player card, records, posters, Wrapped cards                                             | no tilt, no sweep             |
| LED digits    | `components/ui/rolling-number.tsx`                     | CSS only, so it starts before hydration and the server HTML holds the real value. Reserved for headline numbers: each digit adds 20 spans         | final digits at once          |
| Rows, charts  | `.stagger-in`, `animate-plinth`, recharts default      | CSS keyframes; recharts' `auto` animation checks reduced motion itself                                                                            | no animation                  |

| Elo stage | `features/leaderboard` (`elo-canvas`, `lib/elo-scene`) | `three` curtains in depth with a ball per player, scrubbed by pointer; `elo-line-chart` is the flat fallback |
| Chalk cubes | `h2h-heatmap.tsx`, `.h2h-*` | CSS perspective; cube height and colour come from `--rate` and `--heat` |
| Match plates | `.match-tiles` on home and history lists | CSS thick edge, stand up on entry (scroll-driven in history), tip on hover |
| Score wire | `components/ui/filter-links.tsx`, `.score-*` | The bead is one DOM node kept across navigation, so it slides to the new stop |
| Page signatures | `src/styles/scenes.css` | Money chip towers (`chip-towers.tsx`), rivalry ball clash (`ball-clash.tsx`), fame medals, audit ball on a named view timeline, TV flip board, login rail. All switch off under reduced motion |
| Chat motion | `.chat-card`, `.chat-theme [data-testid=…]`, `magic-eight.tsx` | Keyed on CopilotKit's `data-testid`s, so a CopilotKit bump must re-check them. The 8-ball only fills the composer, it never sends |
| Table frame | `components/ui/table-frame.tsx`, `.pool-*` | CSS pocket table: rails, cushions, sights, six pockets. Home's playable table and the rack menu, turned upright on a phone |
| Dock | `features/shell/components/floating-dock.tsx`, `.dock*` | Wooden rail tilted by a pseudo-element behind upright keys; the current page is a key held down |
| Pixel pet | `features/shell` (`pixel-pet`, `lib/pet-brain`, `lib/pet-sprites`) | Canvas sprite, wide screens only. Walks corner to corner along the screen's foot and over the dock's outline. Pressing a dock key makes it hop onto that key, cheer (dizzy after four quick presses), then leap to the left or right corner at random; clicks elsewhere are ignored. It tumbles on scroll, cheers on a new page, sleeps after 25 s idle. Absent under reduced motion, never takes a click |
| Backdrop | `features/shell` (`lamp-smoke`, `match-art`, `lib/smoke-shader`, `lib/match-strokes`) | Raw WebGL smoke at 0.4 scale and 30 fps, no `three`. The last 16 matches paint as ball paths in the winner's colour, seeded by match id, then the canvas stops. Reduced motion gets one still frame |
| Drawn scenes | `components/ui/billiard-art.tsx`, `.art-*` | Own SVGs moved by CSS: `CueShot` on history, `RackBreak` on leaderboard, `SwingLamp` on wheel, `ChalkCube` in empty states |
| Scroll | `.scroll-cue`, `main section`, `.pool-table`, `.match-stack` | CSS scroll timelines: cue progress under the header, sections rise in, the hero table tips back; history plates stack per day. Without `animation-timeline` these simply stay put |
| Hover | `.ball-roll`, `.poster-swing`, `.match-tiles`, `.dock-key` | CSS only, inside `@media (hover: hover)`: balls roll, the wanted poster swings, a plate gets a sheen while its siblings dim |

Tailwind keeps `@theme` keyframes only when an `animation:` shorthand names them; `animation-name` alone drops them.

WebGL failure or a lost context falls back to the flat table or chart. A new `.digit-reel`-style delayed animation must also go in the reduced-motion block of `globals.css`, or its delay holds back the first frame.

## Chat states

| State                    | Decision / implementation                                                                                                                                               |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Welcome / empty          | `welcomeScreen.welcomeMessage`: title and body from `chat.json`, plus 6 starter suggestions (`useConfigureSuggestions`, before the first message)                       |
| User message             | stock bubble, themed via `[data-copilotkit]` variables                                                                                                                  |
| Assistant message        | stock markdown, themed                                                                                                                                                  |
| Streaming                | stock cursor and stop button                                                                                                                                            |
| Thinking                 | stock (no reasoning model); the tool "working" pill covers the gap before a card                                                                                        |
| Tool running             | `Working` pill: spinner and `chat.working` (`renderers/tool-result.tsx`)                                                                                                |
| Tool done                | per contract (`lib/agent-results.ts`): ProposalCard, AskChips, StatsCard (bar chart), HeadToHeadCard, WheelCard, PosterCard. list_matches and trash_talk are text only  |
| Tool failed / unparsable | `Failure` pill (`chat.toolFailed`)                                                                                                                                      |
| Confirm card             | idle → saving → done (30 s undo countdown) / undone / cancelled / failed (retry with the same idempotency key) — `renderers/proposal-card.tsx` + `lib/card-store.ts`    |
| Suggestions              | before the first message only; afterwards the chips come from `needs_input` / name problems                                                                             |
| Error / unauthorised     | CopilotChat `onError` → sonner toast: `chat.unauthorized` on 401, else `chat.error`                                                                                     |
| Long conversation        | stock scroll view, auto-scroll; one thread per day keeps it short                                                                                                       |
| Narrow width             | `Sheet side="responsive"`: bottom sheet at 92dvh below `md`, right panel (max-w-lg) from `md`. The composer is pinned by CopilotChatView, and the mic bar sits under it |
| Dark                     | the product is dark only                                                                                                                                                |

## Primitives used in the chat

| Element               | Class             | Source                                                                                                                                                                                                                                    |
| --------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Send / stop, composer | library primitive | CopilotChat input (stock), themed                                                                                                                                                                                                         |
| Buttons on cards      | design primitive  | `components/ui/button.tsx`                                                                                                                                                                                                                |
| Chips                 | design primitive  | `components/ui/chip.tsx`                                                                                                                                                                                                                  |
| Card shell            | design primitive  | `components/ui/card.tsx`                                                                                                                                                                                                                  |
| Scoreboard row        | design primitive  | `components/ui/match-row.tsx` (a 1v1v1 is three columns of the same seat, each score under its player; the loser reads "Trả bill" when the match has a bill; a guest match shows "Du đấu" in the bill's place and the loser reads "Thua") |
| Avatar with streak    | design primitive  | `components/ui/player-avatar.tsx`                                                                                                                                                                                                         |
| Sheet                 | design primitive  | `components/ui/sheet.tsx` (radix Dialog)                                                                                                                                                                                                  |
| Wheel                 | feature component | `features/wheel` (shared with `/wheel`; the chat card stays flat, 3D is `/wheel` only)                                                                                                                                                    |
| Icons                 | library           | lucide-react, size-4/5                                                                                                                                                                                                                    |

## Ladder

| Element          | Rung | Implementation                                   | Why                                                                                                    |
| ---------------- | ---- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Colours, radius  | L0   | `[data-copilotkit]` variables → tokens           | —                                                                                                      |
| Welcome          | L1   | `welcomeScreen` props object                     | —                                                                                                      |
| Composer prefill | L2   | `chatView={ChatView}` wrapping `CopilotChatView` | CopilotChat keeps the input text internally; only the view's `onInputChange` can set it (wheel → chat) |
| Tool cards       | —    | `useRenderTool({ name: "*" })` dispatcher        | the HITL / renderer contract                                                                           |
| Mic bar          | app  | under CopilotChat, Web Speech API                | no slot for a big push-to-talk button; the result prefills the composer                                |
| Sheet header     | app  | `Sheet` title                                    | CopilotChat has no header slot                                                                         |

Step 4 (recorded AG-UI streams with aimock) and Step 5 (screenshot diff against frames) are skipped: there are no frames and no tests, per the user. The check is the live E2E checklist (`docs/e2e-checklist.md`).
