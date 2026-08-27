# Testing

This project has three layers of automated tests, all wired into GitHub Actions
([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Layers

| Layer | Tool | Location | What it covers |
|-------|------|----------|----------------|
| Unit | Jest | `src/utils/*.test.js` | `firebase_auth` functions & `f_config` data (Firebase SDK mocked) |
| Integration | Jest + React Testing Library | `src/pages/*.test.jsx` | LoginPage, SignUpPage, SubjectDrive, UsersPage rendering + interactions (Firebase/router mocked) |
| E2E | Playwright | `e2e/*.spec.js` | Real browser against a production build: auth flows, navigation, teacher/admin SubjectDrive |

## Running locally

```bash
# Unit + integration (single run, CI-style)
npm run test:ci

# Unit + integration (watch mode, CRA default)
npm test

# E2E (builds the app, serves it on :3000, runs Playwright)
npx playwright install chromium   # first time only
npm run test:e2e
```

## Notes & known issues

- **Admin "view all accounts" button.** The task reported the signed-in admin
  page's button to view all accounts as broken. The admin path is
  `SubjectDrive` gear icon → **Admin** link → `/users`, which only renders when
  the logged-in user's `subject` array contains `"Full Drive"`
  (see [src/pages/SubjectDrive.jsx](src/pages/SubjectDrive.jsx)). Both the
  integration test (`SubjectDrive.test.jsx` → "clicking the gear reveals the
  Admin link") and the E2E test (`subject-drive.spec.js` → "gear reveals the
  Admin link") assert this **intended** behaviour and currently **pass** against
  the source. That suggests the production breakage is data/deployment-related
  (e.g. the admin account's Firestore `subject` is not `["Full Drive"]`, so
  `isFullDriveUser` stays false and the gear never appears) rather than a logic
  bug in this code. These tests will fail loudly if the button regresses.

- **`src/App.test.js`.** The Create React App boilerplate test asserts a
  "learn react" link that no longer exists, so it always fails. Per the
  constraint not to edit existing code, it is left untouched and excluded from
  CI via `--testPathIgnorePatterns=src/App.test.js` in the `test:ci` script.
  Recommend replacing it with a real smoke test when editing existing code is
  allowed.

- **No real Firebase in tests.** Unit/integration tests mock the Firebase SDK;
  E2E seeds `localStorage.subject` to simulate a logged-in role without a live
  Firebase session, keeping runs deterministic and offline.
