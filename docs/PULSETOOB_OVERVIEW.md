# PulseToob Overview

## Table Of Contents

1. [What PulseToob Is](#what-pulsetoob-is)
2. [Core Features](#core-features)
3. [Current Status](#current-status)
4. [Production Frameworks And Services](#production-frameworks-and-services)
5. [Application Structure](#application-structure)
6. [Editorial Workflow](#editorial-workflow)
7. [Known Rules And Validation](#known-rules-and-validation)
8. [Room For Tweaks](#room-for-tweaks)
9. [Verification Checklist](#verification-checklist)
10. [Maintenance Notes](#maintenance-notes)

## What PulseToob Is

PulseToob is a live content publishing platform and CMS for creating, managing, and publishing stories on `pulsetoob.com`.

It has two main surfaces:

- Public site: readers browse stories, categories, article pages, featured content, and article metadata.
- Admin panel: editors and admins create articles, upload media, manage SEO fields, control publishing status, manage categories, users, ads, RSS, MSN settings, analytics, and backlinks.

The project is built as a full-stack application with a separate frontend and backend.

## Core Features

- Article creation, editing, draft saving, and publishing.
- Rich text editor powered by Tiptap.
- Inline image uploads inside article content.
- Alt text and image credit support for featured images and inline article images.
- Featured image management with preview, alt text, and credit fields.
- Category management and article categorization.
- Public blog listing and article detail pages.
- Author display cleanup so names do not need to include `@pulsetoob`.
- Green PulseToob `P` favicon for browser/search identity.
- SEO fields including meta title, meta description, keywords, Open Graph fields, and schema support.
- RSS feed generation.
- MSN syndication support.
- Media library with Cloudinary-backed uploads.
- Admin user management with roles and permissions.
- Advertisement slot management.
- Analytics and backlink management.

## Current Status

PulseToob is live in production.

- Production domain: `https://www.pulsetoob.com`
- Frontend deployment: Vercel
- Backend deployment: Render
- Database: Neon PostgreSQL
- Git branch used for deployment: `main`

Recent completed updates:

- Added inline image alt text and credit prompts.
- Added inline credit rendering in article previews and public article pages.
- Added PulseToob favicon metadata.
- Cleaned public author names by removing trailing `@pulsetoob` or `@pulsetoob.com`.
- Improved validation alerts so failed publishes show the exact field.
- Removed the hard 320-character publish limit on article excerpts.

## Production Frameworks And Services

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Tiptap rich text editor
- Axios for API requests
- Vercel for hosting and deployment

### Backend

- Node.js
- Express
- Sequelize ORM
- PostgreSQL through Neon
- JWT authentication
- Express Validator
- Sanitize HTML
- Cloudinary media upload integration
- RSS generation
- Render for hosting and deployment

### Database And Storage

- Neon PostgreSQL stores users, articles, categories, media records, ads, analytics, comments, backlinks, and related CMS data.
- Cloudinary stores uploaded images and generated media variants.

## Application Structure

```txt
pulsetoob-cms/
  backend/
    controllers/    API request handlers
    models/         Sequelize database models
    routes/         Express route definitions
    services/       SEO, RSS, email, scheduler, MSN support
    validators/     Request validation rules
    middleware/     Authentication and validation middleware
    config/         Database, Redis, Cloudinary configuration

  frontend/
    src/app/        Next.js pages and routes
    src/components/ Shared UI and editor components
    src/lib/        API client
    src/utils/      Shared frontend helpers
    public/         Static assets such as favicon
```

## Editorial Workflow

1. Login through the admin panel.
2. Create a new article from `/admin/articles/new`.
3. Add title, content, excerpt, SEO fields, categories, and distribution settings.
4. Upload a featured image and fill in alt text and image credit.
5. Add inline images in the article body when needed.
6. Add alt text and optional image credit for inline images.
7. Preview the article.
8. Save as draft or publish.
9. Confirm the article appears on the public site.

## Known Rules And Validation

- Article title must be present and between 3 and 180 characters.
- Article content must be present before publishing from the admin UI.
- Featured image ID must be a valid UUID when a featured image is attached.
- Meta title is capped for SEO.
- Meta description is capped for SEO.
- Meta keywords are cleaned so empty comma-separated values are ignored.
- Excerpts are no longer blocked by a 320-character publish limit.
- Backend content is sanitized before storage to allow safe article HTML.

## Room For Tweaks

Use this section as a living list for future changes.

### Editorial Tweaks

- Add a live character counter for excerpt, meta title, and meta description.
- Let editors choose whether excerpt is short card text or long summary.
- Add an article subtitle field visibly in the admin editor.
- Add scheduling controls directly in the article editor.
- Add stronger autosave with server-side recovery.

### Media Tweaks

- Replace browser prompt dialogs for inline image alt/credit with a polished modal.
- Add a media picker for reusing existing uploaded images inside article content.
- Show inline image credits directly inside the editor, not only in preview/public render.
- Add focal point controls for featured image crops.
- Add image usage tracking per article.

### SEO Tweaks

- Add live SEO scoring in edit mode and edit article pages consistently.
- Add canonical URL controls.
- Add Open Graph preview.
- Add structured data preview.
- Add sitemap status visibility in admin.

### Public Site Tweaks

- Add richer author pages.
- Add related articles below article pages.
- Add topic pages for each category.
- Add search.
- Add newsletter storage or provider integration.
- Improve mobile article typography and spacing.

### Admin Tweaks

- Replace `alert()` messages with toast notifications or inline error banners.
- Add role-based UI hiding for actions users cannot perform.
- Add audit logs for publish, edit, delete, and user changes.
- Add dashboard cards for pending drafts and recently published articles.

### Production Tweaks

- Add automated backend tests for article validation.
- Add frontend tests for article publishing flow.
- Add uptime checks for frontend, backend, and database.
- Add deployment smoke tests after Vercel and Render deploy.
- Add error tracking such as Sentry or another monitoring service.

## Verification Checklist

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

- Visit `https://www.pulsetoob.com`.
- Visit `https://www.pulsetoob.com/blog`.
- Login at `https://www.pulsetoob.com/login`.
- Create a draft article.
- Upload a featured image.
- Add inline image alt text and credit.
- Publish an article.
- Open the public article page.
- Confirm RSS/MSN features still load if relevant.

## Maintenance Notes

- Keep `.env` files out of Git.
- Keep production secrets in Vercel, Render, Neon, and Cloudinary dashboards.
- Use `main` as the deployment branch unless the deployment setup changes.
- Push changes to GitHub to trigger Vercel and Render redeploys.
- Update this document whenever production behavior, services, or editorial workflow changes.
