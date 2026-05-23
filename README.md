# GlobeServe Southern Nigeria Hub — Management App

A web-based management portal for the GlobeServe Southern Nigeria Hub Exco and member entities.

## Features
- Secure login for all hub members and Exco
- Member entity directory (target: 20 entities)
- UPG tracker — Fulani, Kanuri, Bariba peoples
- Meeting scheduler with agenda and minutes
- Document log for minutes and reports
- Finance tracker (income/expense in ₦)
- Hub objectives and GlobeServe five points
- Stage progress checklist (Stages 1–5)
- Quarterly report builder

---

## DEPLOYMENT STEPS

### Step 1 — Set up the Supabase database

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `src/lib/supabase.js` in this folder
5. Copy everything inside the large `/* ... */` comment block (the SQL)
6. Paste it into the Supabase SQL Editor and click **Run**
7. You should see "Success. No rows returned" — your tables are created.

### Step 2 — Push code to GitHub

1. Create a free account at https://github.com
2. Click **New repository** → name it `globeserve-southern-hub` → Public → Create
3. On your computer, install Git if not already: https://git-scm.com
4. Open a terminal / command prompt in this folder and run:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/globeserve-southern-hub.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to https://vercel.com and sign in
2. Click **Add New → Project**
3. Click **Import** next to your `globeserve-southern-hub` GitHub repo
4. Under **Environment Variables**, add these two:
   - `REACT_APP_SUPABASE_URL` = `https://iogmdmuhmpumuhlpewbc.supabase.co`
   - `REACT_APP_SUPABASE_ANON_KEY` = (your anon key from Supabase Settings → API Keys)
5. Click **Deploy**
6. Wait ~60 seconds — your app is live!

### Step 4 — Enable Email Auth in Supabase

1. Go to Supabase → **Authentication → Providers**
2. Make sure **Email** is enabled
3. Under **Authentication → Email Templates**, you can customise the confirmation email

### Step 5 — First login

1. Go to your Vercel URL (e.g. `globeserve-southern-hub.vercel.app`)
2. Click **Create account**
3. Register with your email — you'll receive a confirmation email
4. Confirm your email, then sign in

---

## File structure

```
globeserve-hub/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── Icons.js
│   ├── lib/
│   │   └── supabase.js       ← contains SQL setup + Supabase client
│   ├── pages/
│   │   ├── AuthPage.js       ← Login / Register
│   │   ├── Dashboard.js      ← Main dashboard
│   │   ├── Members.js        ← Member entities
│   │   ├── UPGTracker.js     ← UPG management
│   │   ├── Meetings.js       ← Meeting scheduler
│   │   └── OtherPages.js     ← Docs, Finances, Objectives, Stage, Report
│   ├── App.js                ← Main app shell + navigation
│   ├── index.css             ← All styles
│   └── index.js              ← React entry point
├── .env                      ← Your Supabase credentials (never commit this!)
├── package.json
├── vercel.json
└── README.md
```

---

## Notes

- The `.env` file contains your Supabase URL and anon key. Keep this file safe.
- When adding `.env` to GitHub, add it to `.gitignore` first (Vercel uses environment variables instead).
- The three UPG target groups (Fulani, Kanuri, Bariba) are auto-seeded on first load.
- Stage 1 checklist items are pre-marked as complete.
