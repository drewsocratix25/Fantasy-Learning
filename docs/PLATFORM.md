# Little Wonders platform

How the site sells, syncs and scales, and the runbook to switch it on. The games themselves are
documented in the README; this is everything around them.

## What we are building and why

Little Wonders is a **catalogue** of small, ad-free learning games with one identity, one promise (no ads,
no tracking, plays on anything) and one voluntary subscription ($1 a month or $10 a year). Melody Kingdom
is the first game; Germ Patrol and Castle Quest are being built now so the catalogue is worth
subscribing to and coming back to. This platform layer exists so that:

1. **Adding a game is cheap and safe.** One registry entry, a template folder, and CI that opens every
   game in a browser before it can ship. See `docs/ADDING-A-GAME.md`.
2. **A family's progress follows the child**, so the "when one device dies, open it on the next one"
   promise on the home page is true, and so a paying family has something that feels like an account
   without a child ever logging in.
3. **Money can arrive** with almost nothing to operate: Stripe Payment Links, a webhook, a badge.
4. **It scales for free.** The games are static files on GitHub Pages (a CDN). The only server code is
   two small edge functions and a Postgres table set on Supabase's free tier, which covers thousands
   of families before costing anything.

## Architecture

```
GitHub Pages (static, CDN)                 Supabase (one project)                 Stripe
┌───────────────────────────┐             ┌──────────────────────────────┐        ┌──────────────┐
│ index.html   hub + cards  │  fetch      │ functions/family             │        │ Payment Link │
│ games.json   registry     │────────────▶│   create/join/status/recover │        │ $1/mo $10/yr │
│ games/*/     the games    │             │   pull/push (progress)       │        └──────┬───────┘
│ platform/    LW client    │             │   ping (anonymous plays)     │  webhook      │
│ privacy.html terms.html   │             │ functions/stripe-webhook ◀───┼───────────────┘
└───────────────────────────┘             │ tables: families, progress,  │
        browser localStorage              │   plays, stripe_events (RLS) │
        (progress lives here first)       └──────────────────────────────┘
```

**Local mode is the default.** `platform/config.js` ships with empty Supabase and Stripe fields. In that
state every game works exactly as before (progress in localStorage, nothing sent anywhere), the family
panel and support buttons are hidden, and the smoke test asserts that. Filling in the config switches
the platform on without any code change.

### The family code

A grown-up types an email on the home page and gets a code like `K7PM-4WQD`. The code is stored in the
browser and is the only credential: enter it on another device and progress syncs. Children never see a
login. The email is kept only to send the code back and to match Stripe payments. Codes use a 30-letter
alphabet without look-alikes; the space is ~6.5 × 10¹¹, and the API rate-limits guesses.

### Progress sync

`engine/save.js` gained three things: an `updatedAt` stamp on every save, `snapshot()`, and `merge(remote)`
with rules that never lose an achievement (stars, levels, plays and song bests are maxed; unlocked friends
and items are unioned; preferences follow the newest device). `platform/platform.js` pulls on boot, merges,
and pushes after every save with a 4-second debounce, plus a flush when the tab is hidden or closed. The
server keeps whichever blob is newest, so two devices playing at once converge. `tools/test-save.mjs`
covers the rules; the smoke test covers the round trip against a mock server.

### Supporters

Stripe Payment Links carry the family code as `client_reference_id`. The webhook links the Stripe
customer and subscription to the family and sets `supporter_until` to the end of the paid period plus
three days of grace; `invoice.paid` extends it, a deleted subscription ends it. If someone pays before
creating a family, the webhook creates one from the Stripe email and emails the code. Supporting unlocks
only a badge; the games stay free, as the terms promise.

### Play counts

Each game sends one `{game}` ping per device per day. No identifier is stored and the IP is not kept, so
this stays inside the "no tracking" promise, and the privacy page says exactly that. `plays_by_week` and
`supporter_summary` views in Postgres are the dashboard.

## Go-live runbook

Everything below is one-time and takes about an hour. Nothing here has been provisioned yet; the code is
ready and tested against a mock. Do the steps in order.

### 1. Supabase project

1. In the `socratixai` Supabase org create a project named `little-wonders` (free tier, US region).
2. Install the CLI and link: `npm i -g supabase && supabase login && supabase link --project-ref <ref>`.
   If the CLI asks to initialise, keep the existing `supabase/config.toml` (it only pins the webhook to
   `verify_jwt = false`).
3. Apply the schema: `supabase db push` (runs `supabase/migrations/20260905000000_platform.sql`).
4. Set secrets: copy `supabase/.env.example` to `supabase/.env`, fill it in (Stripe and Resend keys come
   from the next steps; `SITE_URL` is the public home page), then `supabase secrets set --env-file supabase/.env`.
5. Deploy the functions: `supabase functions deploy family` and `supabase functions deploy stripe-webhook --no-verify-jwt`.
6. Put the project URL and anon key into `platform/config.js` (`supabaseUrl`, `supabaseAnonKey`). The anon
   key is public by design; the tables are unreachable with it because RLS has no policies.

### 2. Stripe

1. Create a product "Support Little Wonders" with two recurring prices: $1.00 monthly and $10.00 yearly.
2. Create a **Payment Link** for each price. In each link's settings turn on "Collect customer email"
   (default) and set the confirmation to redirect to `<SITE_URL>?thanks=1`.
3. Create a **Customer Portal** link (Settings → Billing → Customer portal) so supporters can cancel.
4. Add a **webhook endpoint** pointing at `https://<ref>.supabase.co/functions/v1/stripe-webhook` with the
   events `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`,
   `customer.subscription.deleted`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`, the secret API
   key into `STRIPE_SECRET_KEY`, then re-run `supabase secrets set`.
5. Put the two Payment Links and the portal link into `platform/config.js`.
6. Test with a Stripe test-mode card, then watch `supabase functions logs stripe-webhook` and
   `select * from supporter_summary;`.

### 3. Email (Resend)

1. Add and verify a sending domain in Resend, create an API key, set `RESEND_API_KEY` and
   `RESEND_FROM="Little Wonders <hello@yourdomain>"` in the function secrets.
2. Set `supportEmail` in `platform/config.js`; the privacy and terms pages show it.
   Without Resend the code still appears on screen after creation; only the "email me my code" recovery is silent.

### 4. Domain and hosting

- GitHub Pages already deploys `main`. Turn it on once: Settings → Pages → Source: GitHub Actions.
- For a real domain, add a `CNAME` file with the hostname, point DNS at GitHub Pages, and update `siteUrl`
  in `platform/config.js`, `games.json`, `sitemap.xml`, `robots.txt` and `SITE_URL` in the function secrets.
- The repository has to be public for free Pages (it is a public site anyway).

### 5. Turn CI on as a gate

In Settings → Branches, require the **Checks** workflow to pass before merging to `main`. It runs the
registry check, the save-merge unit test and the browser smoke test on every pull request.

## Operating it

| Question | Where |
| --- | --- |
| How many supporters, MRR | `select * from supporter_summary;` in the Supabase SQL editor |
| Is anyone playing | `select * from plays_by_week;` |
| A parent lost their code | They use "Email it to me" on the home page; or look them up by email in `families` |
| Delete a family (privacy request) | `delete from families where email = '…';` (progress cascades) and cancel the Stripe subscription |
| Refund | Stripe dashboard; the webhook ends the badge when the subscription is cancelled |
| A game is broken | `npm run smoke` locally reproduces what CI saw; screenshots in `tools/out/` |
| Function errors | `supabase functions logs family` / `stripe-webhook` |

## Costs

| Item | Free until | Then |
| --- | --- | --- |
| GitHub Pages | 100 GB/month bandwidth, soft limit | Netlify/Cloudflare Pages are drop-in (static folder) |
| Supabase | 500 MB database, 500k function calls/month | $25/month Pro |
| Resend | 3,000 emails/month | $20/month |
| Stripe | pay-per-transaction | 2.9% + 30¢ per charge (on a $1 charge that is 33¢; the yearly plan is the one to nudge toward) |

At $1 a month the Stripe fee eats a third of each payment. Two cheap fixes when it matters: raise the
monthly price to $2, or lead with the yearly plan (the hub already lists both).

## Roadmap this unlocks

- **Grown-up dashboard** on the hub: what was played this week, per family (the `progress` blob already has it).
- **Parent email**: a monthly "here's what she learned" note through Resend, opt-in from the family panel.
- **Classroom codes**: the same family table with a `kind` column and more seats.
- **More games**: the template plus CI means a new game is a registry entry and a folder.
