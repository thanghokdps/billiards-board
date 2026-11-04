# E2E checklist — Ăn Bill

Run on the live app, in /vi and /en, at 375 px and desktop. The console must stay clean (no errors, no hydration warnings). The user decided against unit tests and evals, so this checklist is the release gate.

## Viewer (logged out)

- [ ] `/` redirects to `/vi`; the VI/EN switch keeps the page.
- [ ] Home: session card, scoreboard (or the "last session" label), 🔥/🧊 avatars, WANTED strip when someone has 5 straight losses, and the recap card after 13:00.
- [ ] History: game and period filters change the list; the match sheet shows highlights and the poster button. No admin buttons are visible.
- [ ] Leaderboard: podium, table, Elo chart (hide toggle remembered), 5×5 heatmap readable at 375 px.
- [ ] Player profile: FIFA card, form, nemesis/prey, badges.
- [ ] Money, Hall of Fame (posters load), Rivalry (poster), Predictions, Wrapped story (tap, keys, auto-advance), TV mode (rotates, full-bleed).
- [ ] Wheel: opens in 2v2, participant chips, 1v1/2v2, long-press victim, x5/x10 repeat every name N times with chances unchanged (with a victim: 4 players with x5 leaves the victim at ≈ 6%), +/−, % on slices when names are not repeated, spin 2–3 s, skip, then sound and vibrate. No "Tạo trận" button for viewers.
- [ ] Wheel spinner: pick "Ai quay?" → that player leaves the wheel and sits on side A. 4 players: one spin fills both teams. 5 players: first spin is the partner, then spin for the other team. 1v1: the winner is the opponent. No spinner: everyone on the wheel, as before.
- [ ] `POST /api/admin/matches` without the cookie → 401; `/api/copilotkit` without the cookie → 401.
- [ ] The 8-ball tab opens the wheel, not the chat.

## Admin

- [ ] `/admin`: a wrong password → error; 6 wrong tries → 429 with a wait message; the right password → dashboard.
- [ ] Players: add one with an avatar upload (≤1.5 MB) and a colour; edit; delete (archived when they have matches).
- [ ] Chat (8-ball / ⌘K) opens as a bottom sheet on the phone and a side panel on desktop.
- [ ] "3c real Thén thắng Dũ 15-11, bill 45k" → confirm card → Save → clack + haptic, row on Home, Undo 30 s works.
- [ ] Batch of 2 matches in one sentence → one card, Save all.
- [ ] Missing game type → one question with chips; tapping a chip continues.
- [ ] Unknown or ambiguous name → chips of candidates.
- [ ] "trận vừa rồi bill 50k" → before/after card → Save; Undo restores.
- [ ] "xóa trận vừa rồi" → delete card → Delete; Undo restores.
- [ ] "tháng này ai đóng nhiều nhất" → bar chart card; "Thén vs Lâm" → H2H card; "quay 1v1, Bổ x5" → wheel card → "Tạo trận từ cặp này" prefills the composer; "làm poster trận vừa rồi" → poster card; "cà khịa Bổ" → text only.
- [ ] Out of scope ("viết code python") → one-line decline with an example.
- [ ] Mic: Vietnamese speech → interim text → the composer is filled.
- [ ] Streak-breaking save → STREAK BROKEN overlay, shake, confetti.
- [ ] Home recap (after 13:00): "Viết bản tin bằng AI" → text → Copy post.
- [ ] Session sheet: attendees, venue, table saved; the wheel defaults to the attendees.
- [ ] Predictions: create for a pairing, enter votes, save the matching match → settled; the prophet board updates.
- [ ] Highlight upload on a match → visible to viewers.
- [ ] Audit log shows every write above with via chat/ui.
- [ ] LangSmith project `billiards-board`: the turns appear with no prompt text (masked) and metadata agent=billiards-board.
