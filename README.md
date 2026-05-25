# PulseToob CMS

PulseToob is a full-stack content management system built with a Next.js frontend, an Express backend, Sequelize, and PostgreSQL. This guide documents the deployment process used for the live PulseToob setup.

## Live Services

- Frontend: Vercel
- Backend API: Render
- Database: Neon PostgreSQL
- Production domain: `https://www.pulsetoob.com`

## Project Structure

```txt
pulsetoob-cms/
  backend/    Express API, Sequelize models, controllers, routes
  frontend/   Next.js app, admin dashboard, public site
```

## Local Requirements

- Node.js
- npm
- Git
- A Neon PostgreSQL database
- A Render account for the backend
- A Vercel account for the frontend

## Environment Variables

Never commit `.env` files or live database URLs to GitHub.

### Backend `backend/.env`

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=http://localhost:3000
```

The backend supports `DATABASE_URL` first, then falls back to individual Postgres variables like `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.

### Frontend `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

For production on Vercel:

```env
NEXT_PUBLIC_API_URL=https://pulsetoob-cms.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://www.pulsetoob.com
```

The frontend normalizes `NEXT_PUBLIC_API_URL`, so both of these work:

```txt
https://pulsetoob-cms.onrender.com
https://pulsetoob-cms.onrender.com/api
```

## Local Development

### Backend

```bash
cd backend
npm install
npm run check
npm start
```

Check the API health endpoint:

```txt
http://localhost:5000/health
```

Expected backend logs:

```txt
Database connected successfully
Database synced
PulseToob Server running on port 5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Neon Database Setup

1. Create a Neon project.
2. Copy the pooled PostgreSQL connection string.
3. Add it locally to `backend/.env` as `DATABASE_URL`.
4. Add the same value to Render as a private environment variable.
5. Do not commit the Neon URL to GitHub.

If a database URL is accidentally exposed, rotate the database password in Neon and update:

- `backend/.env`
- Render backend environment variables

## Render Backend Deployment

Create a new Render Web Service.

Recommended settings:

```txt
Service type: Web Service
Root directory: backend
Build command: npm install
Start command: npm start
Health check path: /health
Auto deploy: On Commit
```

Required Render environment variables:

```env
NODE_ENV=production
DATABASE_URL=your_neon_postgres_connection_string
JWT_SECRET=your_secure_jwt_secret
FRONTEND_URL=https://www.pulsetoob.com,https://pulsetoob.com,https://pulsetoob-cms-of3z.vercel.app
```

The backend CORS allowlist includes:

```txt
https://pulsetoob.com
https://www.pulsetoob.com
https://pulsetoob-cms-of3z.vercel.app
http://localhost:3000
http://localhost:3001
```

Extra origins can be added through `FRONTEND_URL` as a comma-separated list.

## Vercel Frontend Deployment

Import the GitHub repository into Vercel and select the frontend app.

Recommended settings:

```txt
Framework preset: Next.js
Root directory: frontend
Build command: npm run build
Install command: npm install
Output directory: leave blank for Next.js
```

Required Vercel environment variables:

```env
NEXT_PUBLIC_API_URL=https://pulsetoob-cms.onrender.com/api
NEXT_PUBLIC_SITE_URL=https://www.pulsetoob.com
```

Do not set the output directory to `public`. Next.js builds to `.next`, and Vercel handles that automatically when the framework preset is Next.js.

## Custom Domain Setup

In Vercel:

1. Open the frontend project.
2. Go to Settings, then Domains.
3. Add:

```txt
pulsetoob.com
www.pulsetoob.com
```

4. Follow Vercel's DNS instructions at your domain provider.
5. Wait for SSL to become active.

## Login Setup

Admin users live in the Neon database, not in local-only storage.

Create or update a super admin through the backend script or direct database operation. Keep credentials private and do not document real passwords in the repository.

After creating the user, confirm login at:

```txt
https://www.pulsetoob.com/login
```

## Common Deployment Issues

### CORS Error On Login

Example error:

```txt
Access to XMLHttpRequest has been blocked by CORS policy
```

Fix:

- Confirm `backend/server.js` includes the production domain in the CORS allowlist.
- Confirm Render redeployed after the latest GitHub push.
- Confirm Vercel is calling the API URL with `/api`.

Correct frontend API URL:

```txt
https://pulsetoob-cms.onrender.com/api
```

### Vercel Says No Output Directory Named `public`

This usually means the project was not configured as a Next.js app or the root directory is wrong.

Fix:

```txt
Framework preset: Next.js
Root directory: frontend
Output directory: leave blank
```

### Render Cannot Read `DATABASE_URL`

Check that Render has `DATABASE_URL` set in Environment Variables.

The backend expects:

```txt
postgres://...
```

or:

```txt
postgresql://...
```

Neon requires SSL, and the backend is configured for SSL when `DATABASE_URL` is present.

### Git Push Fails With SSH Permission Error

Example:

```txt
Permission denied (publickey)
```

Fix one of these:

- Reconnect GitHub in VS Code and use Sync Changes.
- Add a valid SSH key to GitHub.
- Switch the remote to HTTPS if preferred.

## Verification Checklist

Before deploying:

```bash
cd backend
npm run check
```

```bash
cd frontend
npm run build
```

After deploying:

- Visit `https://pulsetoob-cms.onrender.com/health`
- Visit `https://www.pulsetoob.com`
- Login at `https://www.pulsetoob.com/login`
- Open the admin dashboard
- Create or edit an article
- Upload a featured image
- Add image alt text and image credit
- Publish and view the public article

## Git Deployment Flow

```bash
git status
git add .
git commit -m "Describe the change"
git push origin main
```

Render and Vercel are configured to redeploy from `main` after a successful push.

## Security Notes

- Never commit `.env` files.
- Never post live database URLs publicly.
- Rotate exposed Neon passwords immediately.
- Use strong `JWT_SECRET` values in production.
- Keep backend CORS restricted to trusted domains.

## Current Production Stack

```txt
Frontend: Next.js on Vercel
Backend: Express on Render
Database: Neon PostgreSQL
ORM: Sequelize
Media: Cloudinary-ready media system
Domain: pulsetoob.com
```
