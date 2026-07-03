# PulseToob Overview

Last updated: July 1, 2026

## Table Of Contents

1. [Current Snapshot](#current-snapshot)
2. [What PulseToob Is](#what-pulsetoob-is)
3. [Live Production Stack](#live-production-stack)
4. [Public Site](#public-site)
5. [Admin CMS](#admin-cms)
6. [Content And Editorial Workflow](#content-and-editorial-workflow)
7. [Analytics, Ads, And Privacy](#analytics-ads-and-privacy)
8. [Application Structure](#application-structure)
9. [Validation And Data Rules](#validation-and-data-rules)
10. [Operational Checklist](#operational-checklist)
11. [Current Roadmap](#current-roadmap)
12. [Maintenance Notes](#maintenance-notes)

## Current Snapshot

PulseToob is a live publishing platform running at:

```txt
https://www.pulsetoob.com
```

The production site is connected to a deployed backend, live database, media storage, analytics, ad tooling, and a privacy banner.

Current deployment shape:

- Frontend: Vercel
- Backend API: Render
- Database: Neon PostgreSQL
- Media storage: Cloudinary
- Primary branch: `main`
- Public domain: `https://www.pulsetoob.com`
- Backend API base: `https://pulsetoob-cms.onrender.com/api`

The frontend is configured for automatic Vercel deployment from `main`. The backend is configured for Render deployment from `main`.

## What PulseToob Is

PulseToob is a full-stack editorial website and CMS for publishing entertainment, lifestyle, culture, tech, news, and related stories.

It has two main surfaces:

- Public site: the reader-facing publication at `pulsetoob.com`.
- Admin CMS: the authenticated editorial workspace for creating and managing the site.

The site supports real publishing workflows: article drafting, rich text editing, media uploads, SEO fields, public article rendering, RSS/MSN feeds, ad slots, analytics tracking, newsletter signup, contact messages, and user management.

## Live Production Stack

### Frontend

- Next.js 14 app router
- React 18
- TypeScript
- Tailwind CSS
- Tiptap editor components for article editing
- Vercel hosting and domain routing
- Google Analytics tag: `G-WSWVPG42ZF`
- Google AdSense loader
- SecurePrivacy banner script

### Backend

- Node.js
- Express
- Sequelize ORM
- PostgreSQL through Neon
- JWT authentication and refresh-token support
- Express Validator request validation
- Sanitized article HTML storage
- Cloudinary media upload integration
- RSS and MSN feed generation
- Render hosting

### Data And Storage

- Neon PostgreSQL stores users, articles, categories, media records, newsletter subscribers, contact messages, advertisements, analytics, comments, backlinks, and settings.
- Cloudinary stores uploaded images and generated media variants.
- Environment secrets live in Vercel, Render, Neon, Cloudinary, Google, and SecurePrivacy dashboards, not in Git.

## Public Site

The public PulseToob site currently includes:

- Homepage with featured story, trending stories, topic browsing, ad slots, and newsletter signup.
- Homepage lead-story logic: pinned article first, rotating featured article second, newest published article as fallback.
- `/blog` listing page with category filtering.
- `/search` story search.
- `/category/[slug]` dedicated topic pages.
- `/article/[slug]` article detail pages.
- Related posts on article pages.
- Public contact page for story tips, collaborations, advertising, corrections, and general messages.
- Public about page with editorial standards, corrections guidance, sponsorship transparency, and a privacy entry point.
- Public privacy policy page.
- Public author profile pages linked from article bylines and article cards.
- Newsletter signup forms on the homepage and contact page.
- Responsive featured image rendering with alt text.
- Inline article images with caption and credit rendering.
- Author name cleanup for public display.
- SEO metadata, Open Graph metadata, article/category/tag/author schema, sitemap, news sitemap, image sitemap entries, and robots routes.
- Google-friendly large image preview metadata.
- RSS feed and MSN feed support through the backend.

## Admin CMS

The admin workspace currently supports:

- Login and authenticated CMS access.
- Article creation, editing, drafting, autosave, previewing, and publishing.
- Rich text article body editing through Tiptap.
- Featured image upload and selection.
- Featured image reuse from the media library.
- Featured image alt text and credit fields.
- Inline image insertion with alt text and optional credit, including reuse from the media library.
- Homepage lead control through the article distribution settings.
- Dedicated admin homepage control panel for pinned lead and featured rotation management.
- Category management.
- Media library management.
- SEO field management for articles and categories.
- RSS settings and feed controls.
- MSN syndication eligibility controls.
- Advertisement slot management.
- Analytics dashboard for site and article activity.
- Backlink management.
- User management with roles and active status.
- Site settings management.

## Content And Editorial Workflow

Recommended publishing flow:

1. Log in at `https://www.pulsetoob.com/login`.
2. Open the admin article editor.
3. Add title, content, excerpt, category, SEO fields, and distribution settings.
4. Upload or choose a featured image.
5. Fill featured image alt text and image credit when applicable.
6. Add inline images where useful, including alt text and optional credit.
7. Preview the article.
8. Save as draft or publish.
9. Open the public article page and confirm the story, image credits, metadata, ads, and related posts look correct.

## Analytics, Ads, And Privacy

PulseToob now has several data-related systems active or available:

- Internal analytics tracker for page views, article views, traffic sources, device signals, duration, and bounce signals.
- Google Analytics global tag: `G-WSWVPG42ZF`.
- Google AdSense script and ad-slot components.
- Newsletter signup storage.
- Contact message storage.
- SecurePrivacy privacy banner script.
- IndexNow submission support for article publish, update, unpublish, delete, bulk publish/status changes, and scheduled publishing once `INDEXNOW_KEY` is configured in Render and Vercel.

The current newsletter feature is a subscriber collection system, not a full email sending system. Public forms save subscriber email addresses and the admin audience page can review/copy them, but PulseToob does not yet send confirmation emails, newsletters, digests, unsubscribe links, or delivery analytics.

Because analytics, ads, contact forms, and newsletter forms all process visitor or submitted data, PulseToob should keep a privacy-aware operating posture even if the site does not collect sensitive personal data.

Important follow-up:

- Configure SecurePrivacy so the banner matches the site behavior and required jurisdictions.
- Keep privacy policy text aligned with Google Analytics, AdSense, newsletter signup, contact messages, and internal analytics.
- Confirm AdSense and Analytics consent behavior after SecurePrivacy configuration.
- Add the same `INDEXNOW_KEY` value in Render and Vercel, then confirm `https://www.pulsetoob.com/indexnow-key.txt` returns the key.
- If the key file route changes, set `INDEXNOW_KEY_LOCATION` in Render to the public key file URL.

## Application Structure

```txt
pulsetoob-cms/
  backend/
    config/         Database, auth, Cloudinary, Redis configuration
    controllers/    API request handlers
    middleware/     Authentication and validation middleware
    migrations/     Database migrations
    models/         Sequelize database models
    routes/         Express route definitions
    scripts/        Utility, smoke, and setup scripts
    services/       SEO, RSS, scheduler, email, and MSN services
    validators/     Request validation rules

  frontend/
    public/         Static assets and verification files
    src/app/        Next.js app routes and pages
    src/components/ Shared UI, editor, ad, analytics, and form components
    src/lib/        Public content and API helpers
    src/types/      Shared frontend TypeScript types
    src/utils/      Image, analytics, author, API, and editor helpers
```

## Validation And Data Rules

Current important rules:

- Article title must be present and between 3 and 180 characters.
- Article content must be present before publishing.
- Featured image ID must be a valid UUID when attached.
- Meta title and meta description have SEO-focused length caps.
- Meta keywords are cleaned so empty comma-separated values are ignored.
- Article excerpts are allowed to be longer than the old 320-character publish limit.
- Backend content is sanitized before storage so article HTML can be rendered safely.
- Newsletter and contact submissions are validated by backend public validators.
- Admin routes require authentication and role checks where appropriate.

## Operational Checklist

Before pushing production changes:

```bash
cd backend
npm run check
```

```bash
cd frontend
npm run typecheck
npm run build
```

After deployment:

```bash
cd frontend
npm run smoke:deploy
```

After frontend deployment:

- Visit `https://www.pulsetoob.com`.
- Confirm the homepage renders current stories.
- Confirm `/search`, `/about`, `/privacy`, and at least one `/category/[slug]` page render.
- Confirm `https://www.pulsetoob.com/news-sitemap.xml` renders XML.
- Confirm the Google Analytics tag is present when expected.
- Confirm the SecurePrivacy banner script is present and configured.
- Confirm AdSense scripts/ad slots do not break layout.
- Visit `https://www.pulsetoob.com/blog`.
- Open at least one public article page.
- Confirm related posts, image credits, newsletter signup, and article tracking still work.

After backend deployment:

- Visit `https://pulsetoob-cms.onrender.com/health`.
- Visit `https://pulsetoob-cms.onrender.com/ready`.
- Log in at `https://www.pulsetoob.com/login`.
- Create or edit a draft article.
- Upload a featured image.
- Add inline image alt text and credit.
- Publish an article and open the public URL.
- Confirm RSS/MSN features still load if relevant.

## Current Roadmap

### Editorial

- Add live counters for excerpt, meta title, and meta description.
- Add article subtitle support.
- Add scheduling controls directly in the article editor.
- Add stronger autosave recovery and conflict handling.

### Public Site

- Improve mobile article typography and spacing.
- Add a persistent cookie preference entry point if SecurePrivacy does not provide one directly.

### Newsletter And Email

Goal: turn the existing subscriber storage into a real newsletter system with confirmed subscribers, compliant unsubscribe handling, provider-backed sending, and admin-controlled campaigns.

Recommended v1 direction:

- Use Resend as the first email provider unless a different provider is chosen later.
- Add DNS-backed sender authentication for `pulsetoob.com`: SPF, DKIM, and DMARC.
- Create a sender identity such as `newsletter@pulsetoob.com`.
- Expand `NewsletterSubscriber` with confirmation and delivery fields: `pending`, `active`, `unsubscribed`, `bounced`, `confirmedAt`, `confirmationToken`, `unsubscribeToken`, `providerContactId`, and `lastEmailSentAt`.
- Add double opt-in: signup creates a pending subscriber, sends a confirmation email, and activates only after the confirmation link is opened.
- Add unsubscribe routes and pages, including one-click unsubscribe support for bulk email compliance.
- Add a reusable PulseToob email template with logo/name, article cards, footer, privacy link, unsubscribe link, and sender contact details.
- Add admin controls for sending a test email and sending a newsletter to active subscribers.
- Add `NewsletterCampaign` and `NewsletterDelivery` records for subject, preview text, body, status, recipient counts, provider IDs, errors, and sent timestamps.
- Add campaign status states: `draft`, `scheduled`, `sending`, `sent`, `failed`, and `cancelled`.
- Keep the existing admin audience page, but evolve it from copy-only subscriber management into campaign and delivery management.

Recommended v2 direction:

- Add scheduled newsletter sends.
- Add weekly digest generation from recently published articles.
- Add provider webhooks for bounce, complaint, unsubscribe, delivered, opened, and clicked events where available.
- Add engagement reporting in the admin audience dashboard.
- Add segmentation by signup source, category interest, and engagement.
- Add suppression handling so unsubscribed, bounced, and complained addresses are never mailed.
- Add rate limiting and queued sending so larger lists do not overload the backend or provider API.

### Admin And Operations

- Extend toast notifications and inline banners to every admin page.
- Add role-based UI hiding for actions users cannot perform.
- Add audit logs for publish, edit, delete, and user changes.
- Add dashboard cards for pending drafts and recently published articles.
- Add uptime checks for frontend, backend, and database.
- Add deployment smoke tests after Vercel and Render deploys.
- Add error tracking such as Sentry or another monitoring service.

### Distribution

- Keep Facebook Page crossposting deferred until publishing rhythm and audience size justify it.
- See `docs/FACEBOOK_CROSSPOSTING_DEFERRED.md` for the planned approach.
- Add a queue/retry worker before enabling automatic social posting.
- Consider submitting the news sitemap in Google Search Console after the next frontend deployment.

## Maintenance Notes

- Keep `.env` files out of Git.
- Keep production secrets in Vercel, Render, Neon, Cloudinary, Google, and SecurePrivacy dashboards.
- Use `main` as the deployment branch unless the deployment setup changes.
- Push changes to GitHub to trigger Vercel and Render redeploys.
- Use Vercel for frontend redeploys and Render for backend redeploys.
- Update this document whenever production behavior, integrations, services, or editorial workflow changes.

### Traffic Surge Notes

PulseToob has a basic traffic-hardening layer for reader spikes:

- Public pages are served through Vercel with Next.js revalidation, so cached homepage/article traffic should mostly avoid the Render backend.
- Backend analytics events are queued and flushed in batches instead of writing every visitor event synchronously.
- Article view counters and direct ad impression/click counters are aggregated before database increments.
- Backend health responses expose analytics and ad metric queue stats for early overload visibility.
- Analytics, ad, public form, auth, and general API traffic have separate rate limits.
- Direct ad lookups send short cache headers and the frontend no longer forces `no-store` for ad lookup requests.
- Database indexes exist for common analytics and public article lookup patterns.

Important traffic-related environment knobs:

- `ANALYTICS_QUEUE_ENABLED`, `ANALYTICS_QUEUE_MAX`, `ANALYTICS_FLUSH_INTERVAL_MS`, `ANALYTICS_FLUSH_BATCH_SIZE`, `ANALYTICS_SAMPLE_RATE`
- `AD_METRICS_QUEUE_ENABLED`, `AD_METRICS_QUEUE_MAX`, `AD_METRICS_FLUSH_INTERVAL_MS`
- `ANALYTICS_RATE_LIMIT_MAX`, `AD_RATE_LIMIT_MAX`, `PUBLIC_WRITE_RATE_LIMIT_MAX`
- `DB_POOL_MAX`, `JSON_BODY_LIMIT`, `FORM_BODY_LIMIT`, `HTTP_REQUEST_LOGS`

Do not claim 1,000 concurrent-user readiness until a controlled load test has been run against production-like Render, Neon, and Vercel settings. Test in stages such as 100, 250, 500, and 1,000 virtual users, watching response times, Render CPU/memory, Neon connection counts, queue backlogs, error rates, and 429/503 responses.
