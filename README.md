# The Modern Groom — E2E Test Suite

Playwright end-to-end tests for The Modern Groom Shopify store, covering the
**Suit Builder** and the **My Events** party-management flow.

## Quick start

```bash
npm install
npx playwright install

cp .env.example .env    # then fill in the values

npm run auth:storefront # unlock the store, save the session (run once)
npm run auth:event      # sign a customer in via OTP, save the session (run once)

npm test                # run everything
```

## Project structure

```
src/
  config/env.js          All environment variables and derived URLs. Start here.
  fixtures/test.js       Custom `test` — unlocks the store, injects page objects.
  helpers/
    mailosaur.js         Disposable inboxes and the email OTP login.
    storefront.js        Shopify storefront password unlock.
    session.js           Checks whether a saved session file is usable.
    random.js            Random pick helpers used for option selection.
  pages/
    SuitBuilderPage.js   Suit Builder: swatches, pricing, fit quiz.
    EventsPage.js        My Events: events, attendees, sizing, payment.

tests/
  auth/                  Setup specs that produce the saved sessions.
  suitbuilder/           Suit Builder tests.
  event/                 The full My Events journey.

auth/                    Saved sessions (git-ignored).
playwright.config.js     Projects, timeouts, and browser settings.
```

The layout is a standard **Page Object Model**: tests describe *what* is being
checked, page objects hold *how* to interact with the site, and helpers cover
everything that is not page-specific.

## How a test run works

Tests never log in themselves. Two setup projects capture browser sessions once,
and the real test projects reuse them:

```
setup-storefront ──> auth/session.storefront.json ──> suitbuilder
       │
       └──> setup-event ──> auth/session.event.json ──> event
```

- **setup-storefront** enters the store password and saves the cookie.
- **setup-event** signs in a fresh customer with an email OTP read from Mailosaur.

Both setup specs **skip if a session file already exists**. To force a refresh:

```powershell
$env:FORCE_AUTH="1"; npm run auth:event
```

Sessions expire. The `page` fixture in `src/fixtures/test.js` notices when the
store has locked again, re-unlocks it, and re-saves the session mid-run.

## Commands

| Command | What it does |
| --- | --- |
| `npm test` | Runs every project |
| `npm run test:suitbuilder` | Suit Builder tests only |
| `npm run test:event` | The My Events journey only |
| `npm run auth:storefront` | Saves the storefront-password session |
| `npm run auth:event` | Saves the signed-in customer session |
| `npm run report` | Opens the last HTML report |

## Configuration

Everything is read from `.env` through `src/config/env.js` — no URLs or
credentials are hard-coded in tests.

| Variable | Purpose |
| --- | --- |
| `STORE_BASE_URL` | Store to test against |
| `STORE_PASSWORD` | Storefront password-page value |
| `PREVIEW_THEME_ID` | Shopify preview theme to pin |
| `EVENT_PATH` / `MY_LOOKS_PATH` | Page paths for events and saved looks |
| `MAILOSAUR_API_KEY` / `MAILOSAUR_SERVER_ID` | Reading OTP emails |
| `CUSTOMER_EMAIL` | Optional fixed inbox; blank generates one per run |

## Writing a new test

Import the shared fixture rather than `@playwright/test` directly — it delivers
an unlocked page plus the page objects:

```js
import { test, expect } from '../../src/fixtures/test.js';

test('Select a suit', async ({ suitBuilderPage }) => {
  await suitBuilderPage.goto();
  await suitBuilderPage.pickRandomSuitSwatch();
});
```

Put new selectors on the page object, not in the test.

## Notes for maintainers

- **`workers: 1`** — tests share one customer account, so they cannot run in
  parallel against the same store.
- **Headed by default** (`headless: false` in the config) along with stealth
  browser flags, because the store fronts bot protection.
- Suit Builder accordions are addressed **by position**: `2` = tie, `3` = belt,
  `4` = shoe. If the site reorders them, those indexes need updating.
- A few tests are `test.skip`-ed with a comment naming the site behavior they
  are waiting on.
