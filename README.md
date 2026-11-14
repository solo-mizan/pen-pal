# dear, letter

A quiet, postal-inspired letter exchange built with the Next.js App Router. Letters move only between accepted connections and stay sealed until their server-selected delivery time, three to seven days after dispatch.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Clerk for email/password, email verification, and Google sign-in. This checkout is linked to the selected `pen-pal` development application, where these methods are enabled.
- MongoDB Atlas with Mongoose
- Cloudinary authenticated assets for private photographs
- Resend for connection, arrival, and opted-in writing-reminder emails
- GitHub Actions delivery/reminder trigger every 15 minutes, plus an overdue-delivery fallback on mailbox and letter access

## Run locally

1. Install Node.js 20.19+ and npm.
2. Copy `.env.example` to `.env.local` only if `.env.local` does not already exist. This checkout already has Clerk development keys from the selected app; preserve them and add MongoDB Atlas and Cloudinary values. Add Resend values to enable email notifications.
3. For another checkout, authenticate the Clerk CLI with `npx -y clerk@latest auth login`, link the selected app with `npx -y clerk@latest link --app app_3M2yyegRS8WKu32sh6Rhwpcey9A`, then pull development keys using `npx -y clerk@latest env pull`. The app uses `/sign-in` and `/sign-up` routes.
4. In Cloudinary, use an account that supports authenticated image uploads and signed private download URLs.
5. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

6. Visit `http://localhost:3000`. Create an account, complete a profile via the generated username in your mailbox, connect with another account by username, accept the request on the other account, and send a letter.

## Checks

Run `npm test` for unit checks covering the 3–7 day delay, Unicode Bangla/English content, attachment limits, timezone formatting, and private letter/photo authorization. Run `npm run test:e2e` for Chromium checks of the landing page, sign-in entry point, and signed-out mailbox. Authenticated two-account letter flows require configured Clerk and MongoDB credentials.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk authentication. Keep the secret server-only. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Clerk hosted component routes. |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Post-auth destination. |
| `MONGODB_URI` | MongoDB Atlas connection. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Signed authenticated uploads and short-lived private downloads. |
| `RESEND_API_KEY`, `EMAIL_FROM` | Optional transactional connection, arrival, and writing-reminder emails. |
| `NEXT_PUBLIC_APP_URL` | Absolute mailbox link in emails. |
| `CRON_SECRET` | Protects the scheduled delivery handler with a bearer token. |

## Data model

- **User** stores the Clerk ID, unique username, display name, verified email, language/timezone, and notification/privacy preferences.
- **Connection** stores both participants, an order-independent unique pair key, requester/recipient, status, and acceptance time. The accepted status is required for letter delivery.
- **Letter** stores sender, recipient, connection, content, stationery, private Cloudinary IDs, status, delay, sent/due/delivered/opened timestamps, and conversation/favorite/reaction fields. Indexes cover mailbox, due deliveries, sender outbox, and conversation ordering.
- **Notification** stores per-user connection and delivery events.

## Project structure

```text
src/app/                  App Router pages, route handlers, manifest, global styles
src/actions/mail.ts       Authorized profile, connection, letter, favorite, and reaction actions
src/components/           Auth provider, composer, mailbox interaction, reader, settings, connection forms
src/lib/                  Auth, MongoDB, delivery, dates, validation, rate limits, domain rules
src/models/index.ts       Mongoose schemas and indexes
src/proxy.ts              Clerk middleware entry point (Next.js 16)
e2e/                      Playwright browser smoke checks
src/lib/domain.test.ts    Vitest business rule checks
```

## Delayed delivery and privacy

`sendLetter` validates the payload and accepted connection on the server, then uses the global delivery policy configured in the admin panel (defaults to a random 3–7 days) to calculate `deliverAt` from server UTC time. Instant mode runs the same due-letter processor immediately. A conditional MongoDB update changes only scheduled letters whose `deliverAt` has passed; it writes `deliveredAt` and an arrival notification only once, so overlapping cron invocations are safe. The GitHub Actions workflow calls `/api/cron/deliver` every 15 minutes; the route processes due letters and opted-in writing reminders. The mailbox and letter-reading path also processes overdue deliveries if cron was delayed. Letter reading queries require the authenticated intended recipient and delivered status. Admin policy changes affect new letters; existing scheduled letters keep their stored arrival time.

Cloudinary uploads use a server-generated public ID, a signed authenticated asset type, server-enforced format and 10 MB limits, and an owner ID context. Dispatch checks each asset against Cloudinary’s authenticated Admin API and the sender ID. The photos endpoint checks letter participation and delivery before generating a five-minute private download URL. Letter bodies and attachment IDs are never sent to recipients before delivery.

## Deploy to Vercel

1. Push this folder to a Git repository and import it into Vercel.
2. Add the variables from `.env.example` in the Vercel project settings; use a long random `CRON_SECRET` and set `NEXT_PUBLIC_APP_URL` to the production domain.
3. Add that domain to Clerk and Cloudinary configuration, and verify the `EMAIL_FROM` sender domain in Resend.
4. Deploy. The GitHub Actions workflow in `.github/workflows/cron.yml` calls the protected delivery endpoint every 15 minutes. Confirm scheduled workflows are enabled for the repository and that the deployed `CRON_SECRET` matches the workflow configuration.
5. Restrict MongoDB Atlas network access to your deployment environment where practical and use production Clerk keys.

## Current implementation notes

Implemented flows include Clerk auth entry points, automatic profile creation and settings, searchable-by-username mutual connections, rate-limited dispatch, letter composition with stationery and live preview, server-delayed delivery, mailbox/outbox, secure photo upload and delivery, reading-size controls, favorites, gentle reactions, opt-in weekly writing reminders, and arrival/connection email notifications. Remaining product work includes editable drafts, invite links/codes, archive filters and conversation views, account deletion, and a full notification center. The service credentials are deployment-specific and are not included; without them the public landing and setup guidance render, while signed-in features remain unavailable. Treat this as a deployable MVP foundation rather than a complete production release until credentials, service configuration, and the remaining account/privacy flows are finished.
# pen-pal
