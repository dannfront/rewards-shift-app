# 🎮 rewards-shift-app

> Automated SHiFT code redemption for Borderlands games — no manual effort required.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![AWS Lambda](https://img.shields.io/badge/AWS_Lambda-FF9900?style=flat&logo=amazonaws&logoColor=white)](https://aws.amazon.com/lambda/)

---

## ⚠️ Disclaimer

This project is not affiliated with, endorsed by, or connected to
Gearbox Software in any way. It interacts with the public-facing
shift.gearboxsoftware.com website in the same way a browser would.
Use at your own risk. The author is not responsible for any account
restrictions that may result from using this tool.

---

## 📖 What it does

`rewards-shift-app` automatically fetches, validates, and redeems SHiFT codes for Borderlands games (Gearbox Software) twice a day — so you never miss a Golden Key again.

It reverse-engineers the `shift.gearboxsoftware.com` web flow to simulate browser behavior: Rails session cookies, CSRF tokens, and async job polling. Results are sent to a Discord webhook.

**Full cycle:**

1. Fetch new SHiFT codes from [MentalMars](https://mentalmars.com/game-news/borderlands-4-shift-codes/) (HTML table scraper)
2. Authenticate with your Gearbox SHiFT account
3. Validate each code (skip expired or already redeemed)
4. Redeem valid codes across all your linked platforms (Steam, Xbox, PSN, Epic, etc.)
5. Notify you on Discord with the results

---

## 🔧 Tech Stack

| Layer               | Technology                                       |
| ------------------- | ------------------------------------------------ |
| Framework           | NestJS + TypeScript                              |
| HTTP Client         | Axios + manual cookie jar (tough-cookie)         |
| Scheduler           | `@nestjs/schedule` — cron 2× daily               |
| Notifications       | Discord Webhook                                  |
| Code source         | MentalMars HTML scraper (adapter pattern)        |
| Target              | `shift.gearboxsoftware.com` (reverse engineered) |
| Infrastructure      | AWS Lambda (no AWS SDK)                          |

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env` file at the root:

```dotenv
# Gearbox SHiFT
BASE_URL=https://shift.gearboxsoftware.com
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36

EMAIL_SHIFT=your_email@example.com
PASSWORD_SHIFT=your_password

# Discord
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook
```

### Run locally

```bash
# Development (hot reload)
pnpm run start:dev

# Production
pnpm run build
pnpm run start:prod
```

---

## 🔌 Custom Code Source

By default the app fetches codes from [MentalMars](https://mentalmars.com/game-news/borderlands-4-shift-codes/). You can plug in **any other source** by implementing a new adapter that returns `ShiftCode[]`.

### How to add a custom adapter

Create an adapter that implements `IShiftCodeAdapter`:

```typescript
// src/modules/shift-code/interfaces/shift-code-adapter.interface.ts
export interface IShiftCodeAdapter {
  fetchCodes(): Promise<ShiftCode[]>;
}

export const SHIFT_CODE_ADAPTER = 'SHIFT_CODE_ADAPTER';
```

```typescript
// src/modules/shift-code/adapters/my-custom.adapter.ts
@Injectable()
export class MyCustomAdapter implements IShiftCodeAdapter {
  async fetchCodes(): Promise<ShiftCode[]> {
    // Fetch from any source: API, RSS, DB, etc.
    return [{ code: 'AAAAA-BBBBB-CCCCC-DDDDD-EEEEE', expireAt: false }];
  }
}
```

Then swap the adapter in the module:

```typescript
// shift-code.module.ts
{ provide: SHIFT_CODE_ADAPTER, useClass: MyCustomAdapter }
```

> **Note:** The `ShiftCodeService` depends on the `IShiftCodeAdapter` abstraction, not a concrete class. It only calls `adapter.fetchCodes()` and returns the last 5 codes. All parsing and filtering logic lives in the adapter. The old `RedditModule` is dead code — Reddit started blocking `.json` API endpoints from datacenter IPs.

---

## 🔄 How the SHiFT Redemption Works

The site has no public API. The app mimics the browser session:

```
GET  /home                          → authenticity_token + _session_id
POST /sessions                      → login → cookie si + new _session_id
GET  /rewards                       → csrf-token + updated _session_id
GET  /entitlement_offer_codes?code= → validate code, extract archway check hash
POST /code_redemptions              → redeem → 302 Location: /code_redemptions/{uuid}
GET  /code_redemptions/{uuid}       → poll until status !== "pending"
```

> **Key detail:** Rails regenerates `_session_id` on every authenticated request (session fixation protection). Sending a stale `_session_id` causes an immediate 302 to login. The `SessionManagerService` deduplicates cookie keys on every update to always keep the freshest value.

---

## 📁 Project Structure

```
src/
├── main.ts
├── app.module.ts
├── lambda.ts                 # AWS Lambda handler
└── modules/
    ├── cron-job/              # Orchestrator: fetch → redeem → notify
    ├── discord/               # Discord webhook client (EmbedBuilder)
    ├── notification/          # Notification abstraction
    ├── shift-code/            # Code source: MentalMars adapter + service
    │   ├── adapters/          # mental-mars.adapter.ts
    │   └── interfaces/        # ShiftCode { code, expireAt }
    ├── shift/
    │   ├── constants/         # Regex patterns, HTTP headers
    │   ├── interfaces/        # ShiftSession, RedemptionResult
    │   ├── services/
    │   │   ├── shift-auth.service.ts
    │   │   ├── shift-rewards.service.ts
    │   │   ├── shift-redemption.service.ts
    │   │   └── session-manager.service.ts
    │   ├── types/             # PlatformsEnum, ErrorsEnum, SuccessEnum
    │   └── utils/             # getPlatforms
    ├── reddit/                # Dead code — old Reddit scraper, not imported
    └── shared/
        └── http/              # AxiosClientFactory, parseCookies
```

---

## ☁️ AWS Lambda Deployment

The app runs as an AWS Lambda function without using the AWS SDK directly. The MentalMars adapter uses a simple Apache server with no bot protection, so it works without proxies from AWS IPs.

---

## 📣 Discord Notifications

The app notifies your Discord channel for every outcome:

| Event               | Message                               |
| ------------------- | ------------------------------------- |
| ✅ Code redeemed    | Code + platform successfully redeemed |
| ⚠️ Already redeemed | Code was previously claimed           |
| ❌ Code expired     | Code was expired at validation time   |

---

## 🛠️ Scripts

```bash
pnpm run start:dev   # Development with hot reload
pnpm run build       # Compile
pnpm run start:prod  # Run production build
pnpm run test        # Unit tests
pnpm run test:cov    # Tests + coverage report
pnpm run lint        # ESLint with auto-fix
pnpm run format      # Prettier format
```
