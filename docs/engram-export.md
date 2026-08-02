# Engram Export — rewards-shift-app

Key discoveries and decisions from development sessions. Auto-exported from Engram persistent memory.

---

## Reddit bloquea .json pero no RSS ni homepage

**Type:** discovery
**Date:** 2026-08-02

**What:** Reddit devuelve 403 'Blocked' en endpoints `.json` de www.reddit.com (y old.reddit.com / api.reddit.com) desde la IP del dev, pero el mismo IP responde 200 en la homepage y en `.rss`.

**Why:** La app scrapeaba `https://www.reddit.com/r/Borderlandsshiftcodes/new.json?limit=5` y recibía 403 con content-length ~189908 (block page, server snooserv, retry-after 0).

**Where:** `src/modules/shared/http/axios-client.factory.ts` (createRedditClient), `src/modules/reddit/reddit.service.ts`

**Learned:**
- NO es bloqueo de IP total — `www.reddit.com/` da 200 y el feed RSS `.../new/.rss` da 200 con el mismo IP y UA.
- Reddit bloquea específicamente los endpoints `.json` para tráfico automatizado sin cookies de sesión.
- Obtener cookies (csv, edgebucket) de la homepage NO desbloquea el `.json`.
- Fix aplicado: migrar a MentalMars (HTML scraper).

---

## pnpm no instalaba node_modules por pnpm-workspace.yaml en Documents

**Type:** bugfix
**Date:** 2026-08-02

**What:** node_modules no se creaba en rewards-shift-app; pnpm decía "Already up to date" siempre. Se creó `pnpm-workspace.yaml` (packages: [] + allowBuilds false para @nestjs/core y unrs-resolver) en la raíz del proyecto para aislarlo como workspace propio.

**Why:** Existía un `C:\Users\lilda\Documents\pnpm-workspace.yaml` sobrante (solo allowBuilds, sin packages) que hacía que pnpm tratara `Documents` como raíz de workspace y no instalara nada en el proyecto.

**Where:** rewards-shift-app/pnpm-workspace.yaml (nuevo)

**Learned:**
1. Un pnpm-workspace.yaml en un directorio padre actúa como raíz de workspace para todo subdirectorio.
2. pnpm v11 con build scripts ignorados no declarados lanza `ERR_PNPM_IGNORED_BUILDS` con exit 1 que rompe `pnpm run` (auto re-install).
3. El wrapper pnpm.ps1 local funcionaba bien; el problema no era él.
