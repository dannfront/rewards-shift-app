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

1. Fetch new SHiFT codes from a source (Reddit by default)
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
| Default code source | Reddit API (`r/Borderlandsshiftcodes`)           |
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

# Code source (Reddit by default — see "Custom Code Source" below)
BASE_URL_REDDIT=https://www.reddit.com/r/Borderlandsshiftcodes/new.json?limit=5

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

By default the app fetches codes from Reddit's `r/Borderlandsshiftcodes`. However, you can plug in **any other source** by implementing the code provider interface.

Some alternatives you might prefer:

| Source                                                 | Notes                                        |
| ------------------------------------------------------ | -------------------------------------------- |
| [orcicorn.com](https://orcicorn.com/shift-codes)       | Curated list, clean API                      |
| [lootlemon.com](https://www.lootlemon.com/shift-codes) | Game-specific code lists                     |
| Your own database                                      | Store codes manually or from another scraper |
| Any RSS / JSON feed                                    | Wrap it in the provider interface below      |

### How to add a custom provider

Create a service that implements the `ICodeProvider` interface and register it in the module:

```typescript
// src/modules/shift/interfaces/code-provider.interface.ts
export interface ICodeProvider {
  fetchCodes(): Promise<string[]>;
}
```

```typescript
// Example: fetch codes from a custom API
@Injectable()
export class MyCustomCodeProvider implements ICodeProvider {
  async fetchCodes(): Promise<string[]> {
    const res = await fetch('https://my-api.com/shift-codes');
    const data = await res.json();
    return data.codes; // string[]
  }
}
```

Then swap the provider in your module:

```typescript
// shift.module.ts
{
  provide: 'CODE_PROVIDER',
  useClass: MyCustomCodeProvider, // swap Reddit for your provider
}
```

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
└── modules/
    ├── cron-job/              # Runs the full flow 2× daily
    ├── discord/               # Discord webhook client
    ├── notification/          # Notification abstraction
    ├── reddit/                # Default code source (Reddit)
    ├── shift/
    │   ├── constants/         # Regex patterns, HTTP headers
    │   ├── interfaces/        # ShiftSession, RedemptionResult, ICodeProvider
    │   ├── services/
    │   │   ├── shift-auth.service.ts
    │   │   ├── shift-rewards.service.ts
    │   │   ├── shift-redemption.service.ts
    │   │   └── session-manager.service.ts
    │   ├── types/             # PlatformsEnum, ErrorsShift, SuccessShift
    │   └── utils/             # getPlatforms, parseCookies
    └── shared/
        └── http/              # AxiosClientUtil factory
```

---

## ☁️ AWS Lambda Deployment

The app runs as an AWS Lambda function without using the AWS SDK directly.

On Lambda, Reddit requests may be blocked due to IP restrictions. In that case, route them through [api.webscraping.ai](https://api.webscraping.ai/) as a transparent HTTP proxy — it handles residential IPs automatically.

```dotenv
# Add this when deploying to Lambda
WEBSCRAPING_API_KEY=your_key
```

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
