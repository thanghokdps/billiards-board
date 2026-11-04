# UI map — admin chat (Ăn Bill)

No Figma: the design concept is "Bàn đã bật đèn", a real table from above (wood rail, six pockets, felt under a lamp, scoreboard numerals in Big Shoulders, body text in Be Vietnam Pro). The tokens are in `src/styles/globals.css` (`@theme`). Viewports: 375 px phone and desktop ≥ 1024 px (ADR 0002 Q2v).

## Navigation

One navigation at every width, no sidebar: `FloatingDock` holds Today, History, the 8-ball, Board, and Wheel (viewer) or the assistant (admin). The 8-ball opens `RackMenu`: ten pages racked 1-2-3-4 as balls on the felt, with Change log and Admin as plain links under the rack.

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

| Element               | Class             | Source                                   |
| --------------------- | ----------------- | ---------------------------------------- |
| Send / stop, composer | library primitive | CopilotChat input (stock), themed        |
| Buttons on cards      | design primitive  | `components/ui/button.tsx`               |
| Chips                 | design primitive  | `components/ui/chip.tsx`                 |
| Card shell            | design primitive  | `components/ui/card.tsx`                 |
| Scoreboard row        | design primitive  | `components/ui/match-row.tsx`            |
| Avatar with streak    | design primitive  | `components/ui/player-avatar.tsx`        |
| Sheet                 | design primitive  | `components/ui/sheet.tsx` (radix Dialog) |
| Wheel                 | feature component | `features/wheel` (shared with `/wheel`)  |
| Icons                 | library           | lucide-react, size-4/5                   |

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
