# CLAUDE.md

@AGENTS.md

## Claude Code notes

- The shared engineering rules live in `@AGENTS.md` above (imported in full at session start).
- Stack-specific rules in `.claude/rules/` load automatically when you touch a matching file
  (each file declares its own globs). See the table at the end of `AGENTS.md`.

---

## What this is

**財務管家** — a personal finance tracker for one person on their own devices. Everything is
entered by hand: there is no bank integration, no server, and no account system. "Transfer"
and "pay this card" move numbers inside the app; no real money moves anywhere.

React 19 + Vite 8 + Tailwind v4, installed as a PWA and deployed to GitHub Pages under the
`/my-finance/` base path.

## File map

```
src/
  App.jsx                  routing between tabs, modal orchestration, the commit()/runLedger() funnels
  index.css                semantic colour tokens (light + .dark), .tint-* / .skin-* / .field components
  lib/
    ledger.js              ALL money mutations, as pure (state, input) => state functions
    ledger.test.js         behaviour tests for every ledger rule and every undo path
    storage.js             the only module that touches localStorage; normalises untrusted input
    cards.js               due dates, and payment state derived from the transaction log
    cards.test.js
    currency.js            currency list, symbols, formatMoney, sumByCurrency
    moneyDisplay.js        MoneyFormatContext — the privacy toggle's single choke point
    money.js               num() coercion + round2()
    id.js                  genId()
    faceId.js              WebAuthn helpers for the lock screen
  components/
    ui.jsx                 Modal (Escape / focus trap / scroll lock), ConfirmDialog, form fields, buttons
    ui.test.jsx            focus/Escape/scroll behaviour of the shared Modal
    icons.jsx              every icon, defined once
    transactionView.jsx    turns a stored transaction into label/amount/tint
    TransactionRow.jsx     renders one transaction, optionally with an undo button
    Dashboard.jsx  AccountManager.jsx  CardManager.jsx  InvestmentManager.jsx  SettingsPage.jsx
    TransferModal.jsx  TransactionModal.jsx  ExchangeModal.jsx  CardPaymentModal.jsx  HistoryModal.jsx
    LockScreen.jsx
```

## Run / build / verify

```bash
npm run dev      # http://localhost:5173/my-finance/  (note the base path)
npm test         # vitest, ledger + card-cycle behaviour
npm run lint
npm run build
```

The dev server serves under `/my-finance/`, not `/` — `vite.config.js` sets `base` to match
GitHub Pages. Hitting `http://localhost:5173/` alone gives a blank page.

---

## Hard-won constraints

**Never sum two currencies into one number.** Accounts, holdings and card bills each carry
their own currency. Use `sumByCurrency()` and render the totals stacked. A single `$12,345`
across a TWD and a USD account is meaningless, and it was a real bug.

**Money moves only through `lib/ledger.js`.** Components collect input and show errors;
they never touch `balance`, `shares` or `cost` directly. Each `apply*` throws a `LedgerError`
whose message is written for the user — `runLedger()` in `App.jsx` turns that into a toast.

**Card payment state is derived from the log, never stored on the card.**
`paidThisMonth()` / `outstandingThisMonth()` in `lib/cards.js` add up that card's
`card-payment` entries for the current calendar month. The old `lastPaidDate`
boolean could not tell a 3,000 instalment from a full 8,420 settlement, so a
partial payment marked the card settled and the remaining 5,420 vanished from
the dashboard. Deriving it also means undo needs no bookkeeping — drop the entry
and the figure follows. A payment carries its own date and account, so it can be
backdated and paid from somewhere other than the card's linked account without
re-binding it.

**Every transaction must be undoable, without recomputation.** Each entry stores what an undo
needs: `prevLastPaidDate` on a card payment, `costRemoved` on a sell, `before`/`after` on an
adjustment. Never derive those at undo time — a changed cost basis would make the undo drift.
If you add a transaction type, add its `revertTransaction` branch and a round-trip test.

**Cross-currency movement goes through 換匯, never 轉帳.** `applyTransfer` rejects mismatched
currencies and `applyExchange` rejects matching ones. The UI hides the buttons that cannot
apply, but the ledger is the actual guard.

**Editing a balance by hand records an `adjustment` entry.** Balance is the source of truth and
transactions are the log; without that entry the two silently drift apart. `saveAccount` in
`App.jsx` routes edits through `applyBalanceAdjustment`.

**`localStorage` is untrusted input.** It may have been written by an older build, hand-edited,
or restored from a backup file. Everything goes through `normalizeState()`, which coerces
types (balances have been saved as strings before), trims bank names (the grouping key), and
drops card links to accounts that no longer exist.

**Writes can fail.** Safari private mode and a full quota both throw on `setItem`. `saveState`
returns a message instead of throwing, and `commit()` surfaces it — never write to
localStorage from an effect, or the user finds out one render after the action.

**Amounts render only through `formatMoney`, never `toLocaleString` directly.**
That one function is where the privacy toggle lives: `MoneyFormatContext` swaps it
for a masking version, so a new screen inherits "hide all amounts" for free — and
cannot opt out of it by accident. Components take it from `useMoneyFormat()`;
plain helpers (like `describeTransaction`) receive it as an argument.

**Never name a component class after a Tailwind utility.** A `.block` component
class was added for the card style and silently collided with Tailwind's
`display:block` utility, so every element with `className="block"` — form labels
included — grew a 2px border. The card class is `.brick`; check a candidate name
against Tailwind's utilities before defining it in `@layer components`.

**Theming is tokens, never per-utility overrides.** `index.css` defines semantic colours
(`--color-surface`, `--color-ink`, `--tint-*`, `--block-*`) and `.dark` redefines them. Write
`bg-surface text-ink`, never `bg-white text-gray-900` — an earlier approach shadowed every
Tailwind colour with `!important` and silently broke on any colour not in the list. The current
look is the "blocks" layout: cream canvas inside a dark frame, saturated `.brick` cards with a
hard `--edge` outline, black `.pill-solid` labels and an orange `--color-solid` CTA.

**Safe-area insets are additive.** Putting `padding-top: env(safe-area-inset-top)` on an
element that also has a Tailwind `py-*` class *replaces* that padding (plain CSS beats layered
utilities), which once pinned every page heading to the top of the screen. `safe-area-pt` now
lives on `<main>`, and the content padding on the inner container.

**The lock screen is a privacy screen, not security.** The trust boundary is the device
itself: the ledger sits in `localStorage` in plain text, so anyone with the unlocked device can
read it. WebAuthn only gates the React tree. The "略過驗證" button stays deliberately — there
is no server or password to recover from a broken Face ID, so removing it would mean
permanently losing the ledger.

**Backups are the only recovery path.** Clearing browser data wipes everything. Settings →
匯出備份 / 匯入備份 writes and reads a JSON snapshot; keep it working.

---

## Which `AGENTS.md` rules don't apply here

- **SEC-02 / SEC-06 / SEC-08 / OBS-\*** — no backend, no auth, no endpoints, no logging
  pipeline. The trust boundary is the device (see above). Errors surface as toasts.
- **ARCH-02's `Repository → Database`** — the "repository" is `lib/storage.js` and the
  "database" is one localStorage key. The `UI → Service` half does apply: `lib/ledger.js`.
- **AI-01 … AI-03** — no AI features.
- **SHIP-03** — no staging environment; `main` deploys straight to GitHub Pages.
- **TEST-04's e2e tier** — unit tests cover the ledger and card-cycle logic, and a thin
  component tier (jsdom + Testing Library) covers the shared Modal's focus behaviour and the
  amount masking. There is no e2e runner; layout is still verified by hand in the browser.
