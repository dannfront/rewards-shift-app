# AGENTS.md

## Project overview

`rewards-shift-app` is a NestJS app that automatically fetches SHiFT codes for Borderlands games, validates them against the Gearbox SHiFT website, redeems valid codes, and notifies results via Discord. It runs as an AWS Lambda function triggered by EventBridge (cron).

The app reverse-engineers the `shift.gearboxsoftware.com` web flow — Rails sessions, CSRF tokens, async job polling — and uses an **adapter pattern** to swap code sources without touching business logic.

## Setup commands

- Install deps: `pnpm install`
- Build: `pnpm run build`
- Dev server: `pnpm run start:dev`
- Production: `pnpm run build && pnpm run start:prod`
- Run tests: `pnpm run test`
- Coverage: `pnpm run test:cov`
- Lint: `pnpm run lint`
- Format: `pnpm run format`

## Environment variables

Copy `.env` and fill:

```
BASE_URL=https://shift.gearboxsoftware.com
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
EMAIL_SHIFT=your_email@example.com
PASSWORD_SHIFT=your_password
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook
```

No `BASE_URL_REDDIT` is needed — the default code source is MentalMars (hardcoded URL in the adapter). The adapter pattern makes it trivial to swap to another provider.

## Architecture

### Module dependency graph

```
app.module
├── ScheduleModule.forRoot()
├── ConfigModule.forRoot()          (global, reads .env)
├── ShiftCodeModule                 → exports ShiftCodeService
├── ShiftModule                     → exports ShiftService
│   └── imports NotificationModule
├── CronJobModule                   → injects ShiftCodeService + ShiftService
│   └── imports ShiftCodeModule + ShiftModule
├── DiscordModule                   → exports DiscordService
└── NotificationModule              → injects DiscordService
    └── imports DiscordModule
```

### Data flow (cron → redeem → notify)

```
CronJobService.handleCron()
  │
  ├─ 1. ShiftCodeService.fetchLatestCodes()
  │      └─ MentalMarsAdapter.fetchCodes()
  │           ├─ GET https://mentalmars.com/game-news/borderlands-4-shift-codes/
  │           ├─ Parse HTML <table>, extract {code, expireAt} per row
  │           └─ Filter: keep expireAt !== true (active + unknown)
  │           └─ Return last 5 ShiftCode[]
  │
  └─ 2. ShiftService.redeemAllCodes(shiftCodes: ShiftCode[])
       │
       ├─ ShiftAuthService.login()
       │    ├─ GET /home → extract authenticity_token + _session_id
       │    └─ POST /sessions → authenticate, get session cookie
       │
       ├─ ShiftRewardsService.fetchRewardsPage()
       │    └─ GET /rewards → extract CSRF token
       │
       ├─ ShiftRewardsService.validateCodes(allKeys)
       │    └─ GET /entitlement_offer_codes?code=XXXX → check validity
       │
       └─ ShiftRedemptionService.redeemAllCodes()
            ├─ POST /code_redemptions → 302 → /code_redemptions/{uuid}
            ├─ GET /code_redemptions/{uuid} → poll until status ≠ "pending"
            └─ NotificationService → Discord embed (green/red/orange)
```

### Adapter pattern (code sources)

The `shift-code` module uses an adapter interface that returns `ShiftCode[]`:

```ts
// src/modules/shift-code/interfaces/shift-code.interface.ts
export interface ShiftCode {
  code: string;
  expireAt: boolean | null; // true=expired, false=active, null=unknown
}

// src/modules/shift-code/interfaces/shift-code-adapter.interface.ts
export interface IShiftCodeAdapter {
  fetchCodes(): Promise<ShiftCode[]>;
}

export const SHIFT_CODE_ADAPTER = 'SHIFT_CODE_ADAPTER';
```

To swap providers, implement `IShiftCodeAdapter` and change `useClass` in the module:

```ts
// shift-code.module.ts
providers: [
  ShiftCodeService,
  { provide: SHIFT_CODE_ADAPTER, useClass: MyNewAdapter },
]
```

`ShiftCodeService` only calls `adapter.fetchCodes()` and slices to 5 — it has no parsing or filtering logic and depends only on the `IShiftCodeAdapter` abstraction.

The old `reddit` module is dead code and no module imports it.

### SHiFT session management

Rails regenerates `_session_id` on every authenticated request (session fixation protection). Sending a stale `_session_id` causes a 302 to login.

`SessionManagerService` maintains a `Map<string, string>` of cookie keys → values, deduplicating on update to always keep the freshest value.

## Code style

- TypeScript strict mode (`strictNullChecks: true`)
- NestJS decorator-based DI — no manual `new` for injectable services
- Prettier for formatting, ESLint with typescript-eslint v8
- Module-scoped architecture: each `src/modules/<name>/` is self-contained
- Use `@Injectable()` classes, never bare functions as providers
- `private readonly` for all injected dependencies
- Interfaces live in `interfaces/` subfolders; adapters in `adapters/`

## Testing instructions

- Run all tests: `pnpm run test`
- Watch mode: `pnpm run test:watch`
- Coverage: `pnpm run test:cov`
- Tests live next to their source: `*.spec.ts`
- Jest config is in `package.json` (rootDir: `src`)
- All tests must pass before committing (`pnpm run test`)

## Key rules

1. **Adapter pattern for code sources** — Never hardcode a provider in ShiftService or CronJobService. New sources are adapters that return `ShiftCode[]`.
2. **Session cookie dedup** — After every SHiFT response, update `SessionManager`; stale _session_id kills the flow.
3. **AWS Lambda handler** — Entry point is `src/lambda.ts`. No HTTP server is needed; the handler bootstraps NestJS as `createApplicationContext` and calls `CronJobService.handleCron()` directly.
4. **Discord notifications** — `NotificationService` wraps `DiscordService`. Every redeem outcome (success/failure/expired) fires a Discord embed with platform details.
5. **Environment** — All secrets come from `@nestjs/config` + `.env`. No hardcoded credentials.
6. **Build for Lambda** — Use `pnpm run build` then `pnpm run build-dependencies` (production-only, hoisted node_modules for Lambda zip).

## Module index

| Module | Path | Purpose |
|--------|------|---------|
| `shift-code` | `src/modules/shift-code/` | Code source (MentalMars adapter + service) |
| `shift` | `src/modules/shift/` | SHiFT auth, validation, redemption, session |
| `cron-job` | `src/modules/cron-job/` | Orchestrator: fetch codes → redeem → notify |
| `discord` | `src/modules/discord/` | Discord webhook client (discord.js EmbedBuilder) |
| `notification` | `src/modules/notification/` | Notification abstraction (INotificationService) |
| `shared` | `src/modules/shared/` | Axios client factory, cookie parser |
| `reddit` | `src/modules/reddit/` | **Dead code** — old Reddit scraper, not imported |

## Dead code

The `src/modules/reddit/` module is dead. No other module imports `RedditModule` or `RedditService`. It was replaced by `shift-code` after Reddit blocked `.json` API endpoints from datacenter IPs. Keep for reference or delete.

## Deployment

The app deploys as an AWS Lambda zip:

1. `pnpm run build`
2. `pnpm run build-dependencies` → hoisted `node_modules` for Lambda
3. Zip `dist/` + `node_modules/` + `package.json`
4. Upload to Lambda, wire EventBridge cron trigger
5. Set environment variables in Lambda console
