# dear, letter

A quiet, postal-inspired letter exchange built with the Next.js App Router. Letters travel for two to three days before they arrive. The waiting is part of the letter.

## Stack

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4
- Clerk authentication
- MongoDB Atlas with Mongoose
- Cloudinary authenticated assets for private photographs
- Web Push API with VAPID and a service worker
- GitHub Actions delivery trigger every 15 minutes, plus an overdue-delivery fallback when a recipient visits the mailbox

## Run locally

1. Install Node.js 20.19+ and npm.
2. Copy `.env.example` to `.env.local` if you do not already have one. Add Clerk, MongoDB, Cloudinary, and VAPID values.
3. Install and start the app:

   ```bash
   npm install
   npm run dev
   ```

4. Visit `http://localhost:3000`. For end-to-end letter testing, create two accounts, connect them by username, accept the request, and post a letter.

Push notifications require HTTPS. The localhost secure-context exception works for local browser checks, but production push testing should use the deployed HTTPS site.

## Checks

Run `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, and `npm run test:e2e`. Authenticated two-account delivery requires Clerk and MongoDB credentials.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Clerk authentication. Keep the secret server-only. |
| `MONGODB_URI` | MongoDB Atlas connection. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Signed authenticated uploads and private downloads. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public VAPID key used by browsers to create push subscriptions. |
| `VAPID_PRIVATE_KEY` | Server-only private VAPID key. Never commit or expose it. |
| `VAPID_SUBJECT` | Valid `mailto:` contact or HTTPS URL used in the VAPID identity. |
| `CRON_SECRET` | Bearer token required by the scheduled delivery endpoint. |

Generate a VAPID key pair once with `npx web-push generate-vapid-keys`. Use the public key for `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, the private key for `VAPID_PRIVATE_KEY`, and a real contact such as `mailto:you@letter.asf.run` for `VAPID_SUBJECT`. Keep the same key pair after deployment; changing it invalidates existing browser subscriptions.

In Vercel, add all three VAPID values to the **Production** environment and redeploy. The GitHub Actions workflow in `.github/workflows/cron.yml` calls `/api/cron/deliver` every 15 minutes; make sure scheduled workflows are enabled and runs return HTTP 200. The workflow already targets `letter.asf.run`.

## Data model and migration

- **User** keeps the Clerk ID, unique username, display name, profile, email address for account identity, and timezone.
- **Connection** stores both participants, requester/recipient, status, and acceptance time. Letters require an accepted connection.
- **Letter** stores content, photos, sent/due/delivered/opened dates, and optional push-pending/claim/delivery timestamps. Only letters delivered after this push feature is deployed are queued for push; old delivered letters are not replayed.
- **PushSubscription** is a new collection with one authenticated browser/device endpoint and its encryption keys. Expired push endpoints are deleted when the push service reports them.
- **Notification** stores in-app connection and letter-arrival notices.

The schema changes are additive. MongoDB will create the new `pushsubscriptions` collection when the first device enables notifications. Existing letters remain readable; the new push timestamps are optional. Existing email preference fields, if present in user records, are left untouched and no longer used. No destructive migration is needed.

## Delivery and notifications

`sendLetter` records the written date in `sentAt` and chooses a delivery date using the global admin policy, now defaulting to a random two or three days. Existing scheduled letters keep their stored arrival dates. To apply the new two-to-three-day range to an already-configured global policy, set the admin panel’s minimum to `2` and maximum to `3` once after deployment.

The scheduled job changes each due letter from scheduled to delivered once. At that point, the server sends a calm push only to the recipient’s registered devices. It does not notify the sender, and it sends nothing when a letter is written or opened. A stored claim and notification timestamp prevent concurrent cron runs from sending the same letter event twice. The service worker displays the notification as soon as it receives it and opens `/mailbox` when tapped. If the job is delayed, visiting the mailbox also processes due letters.

There are no email notification paths. The old Resend environment variables are no longer read and can be removed from the host.

## Browser support and manual push checks

- **Android Chrome:** sign in, open Mailbox, tap **Enable**, allow notifications, then post a letter from another account. Confirm the push arrives at delivery time and opens the mailbox when tapped.
- **Desktop Chrome/Edge/Firefox:** allow notifications from the Mailbox card, then test a delivered letter while the tab is closed.
- **iPhone/iPad:** in Safari, use Share → **Add to Home Screen**. Open the installed app from its icon, then enable notifications from Mailbox or Settings. iOS/iPadOS web push is for Home Screen web apps.
- Turn notifications off from Mailbox or Settings to remove that device’s subscription. A denied permission must be re-enabled in the browser’s site settings.
- For the complete letter flow, connect two accounts, accept the connection, post a letter, confirm it appears in the sender’s outbox as in the post, wait until its due time or use the admin delivery controls, then check the recipient mailbox and push notification.

## Project structure

```text
src/app/                  Pages, route handlers, manifest, global styles
src/actions/mail.ts       Profile, connections, letter, and keepsake actions
src/components/           Navigation, composer, mailbox, push controls, reader, settings
src/lib/                  Auth, MongoDB, delivery, push, dates, validation
src/models/index.ts       Mongoose schemas and indexes
src/proxy.ts              Clerk middleware entry point (Next.js 16)
public/sw.js              Background push display and notification click handling
e2e/                      Playwright browser checks
```
