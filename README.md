# PEAK — Curated Thrift Store Website

A full-stack store website with an interactive wardrobe experience, admin dashboard, and Instagram integration. Built with React + TypeScript + Vite (frontend) and Hono on Vercel Serverless Functions (backend), with Neon PostgreSQL.

---

## Step-by-step deployment guide

### 1. Create a Neon database

1. Go to [neon.tech](https://neon.tech) and sign up / log in.
2. Click **"New Project"**.
   - Name it `peak-store` (or anything you like).
   - Choose the **Frankfurt (eu-central-1)** region to match Vercel's `fra1`.
3. Once created, go to **Dashboard → Connection Details**.
   - Choose **Pooled connection** (Pooler).
   - Copy the connection string — it looks like:
     ```
     postgres://neondb_owner:xxx@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
     ```

### 2. Run the database schema

1. In the Neon dashboard, click **"SQL Editor"**.
2. Open `db/schema.sql` from this repo and paste the entire contents.
3. Click **Run**. You should see four tables created: `rails`, `posts`, `messages`, `login_attempts`.

### 3. Generate secrets

Open a terminal and run:

```bash
# Generate ADMIN_PASSWORD (use something strong):
openssl rand -base64 24

# Generate JWT_SECRET:
openssl rand -base64 48
```

Save both outputs — you'll need them in the next step.

### 4. Push to GitHub

1. Go to [github.com/new](https://github.com/new) and create a new **private** repository (e.g. `peak-store`).
2. Push this project:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/peak-store.git
   git add .
   git commit -m "initial commit"
   git push -u origin main
   ```
   > **Important:** `.env.local` is in `.gitignore` — it will never be committed. Never commit secrets.

### 5. Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. Click **"Import Git Repository"** and select your GitHub repo.
3. Vercel will auto-detect Vite. The settings should be:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Before deploying, click **"Environment Variables"** and add all four:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | The pooled Neon connection string from Step 1 |
   | `ADMIN_USERNAME` | Your chosen admin username (e.g. `admin`) |
   | `ADMIN_PASSWORD` | The password you generated in Step 3 |
   | `JWT_SECRET` | The JWT secret you generated in Step 3 |

5. Click **Deploy**.

> Vercel will build the frontend and deploy the serverless API automatically via `vercel.json`.

### 6. Verify the deployment

After the deploy succeeds:
- Visit your site URL — you should see the PEAK homepage.
- Visit `https://your-site.vercel.app/admin` — you should see the login screen.
- Log in with your `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

---

## Running locally

### Prerequisites
- Node.js 20+
- [Vercel CLI](https://vercel.com/docs/cli): `npm install -g vercel`

### Setup

```bash
# 1. Link to your Vercel project (run once):
vercel link

# 2. Pull the environment variables from Vercel:
vercel env pull .env.local

# 3. Start the dev server (runs frontend + API together):
npm run dev
# This runs `vercel dev` which starts both on http://localhost:3000
```

The local dev server proxies `/api/*` requests to the Hono serverless function automatically.

---

## First steps after deploying

1. **Go to `/admin`** and log in.
2. **Create your first rail** (e.g. "Jackets", "Tops", "Bottoms").
3. **Add your first post:**
   - Click "Posts" → "Add Post".
   - Upload a photo (it will be automatically resized to max 900px WebP).
   - Paste the Instagram post URL.
   - Choose which rail it belongs to.
   - Click Create.
4. **Go back to the homepage** and click "Explore" — your post will be hanging in the closet.

---

## TODO — Things to fill in before going live

The following placeholders need your real information:

- [ ] **About section** (`src/pages/Home.tsx` → "Our Story"): Add your personal founding story.
- [ ] **How it works — Step 4** (`src/pages/Home.tsx` → `HOW_STEPS`): Add your delivery/pickup details.
- [ ] **FAQ — "Do you offer delivery?"** (`src/components/FAQ.tsx`): Add your delivery details.
- [ ] **FAQ — "Can I return or exchange?"**: Add your returns policy.
- [ ] **FAQ — "What sizes do you carry?"**: Add your typical size range.
- [ ] **Open Graph image** (`index.html` → `og:image`): Replace `/light.jpg` with a branded image.
- [ ] **Custom domain**: Add in Vercel dashboard → Domains.
- [ ] **Favicon**: Replace `public/favicon.svg` with your actual logo.

---

## Project structure

```
├── api/
│   └── index.ts          Hono backend (all API routes)
├── db/
│   └── schema.sql        PostgreSQL schema
├── public/
│   ├── light.jpg         Background for light mode
│   ├── dark.jpg          Background for dark mode
│   └── favicon.svg
├── src/
│   ├── components/       Reusable UI components
│   ├── hooks/            useTheme, useCloset
│   ├── lib/              api.ts (typed client), utils.ts
│   ├── pages/
│   │   ├── Home.tsx      Public single-page site
│   │   └── admin/        Admin dashboard (lazy-loaded)
│   ├── types/index.ts    Shared TypeScript types
│   ├── App.tsx
│   └── index.css
├── vercel.json           Routing, regions, security headers
├── .env.example          Template for environment variables
└── README.md
```

## Security notes

- Admin credentials are compared with `crypto.timingSafeEqual` to prevent timing attacks.
- Brute-force: 5 failed logins per IP locks out for 15 minutes (stored in DB, works across serverless instances).
- JWT is `HttpOnly, Secure, SameSite=Strict` — never accessible to JavaScript.
- All mutating admin requests verify the `Origin` header matches the site host.
- Images are validated by magic bytes (not just MIME type), capped at 400 KB.
- Instagram URLs are validated to be `https://instagram.com` or `https://www.instagram.com`.
- No secrets are ever in frontend code or VITE_ variables.
- `/admin` pages are served with `X-Robots-Tag: noindex, nofollow`.
