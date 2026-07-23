# Setup & Deployment Guide

Everything below uses only free Google tools plus static file hosting.
No servers, no npm, no build step.

## Files in this project

| File | Purpose |
|---|---|
| `index.html` | Voting page |
| `admin.html` | Admin dashboard |
| `style.css` | Theme, animations, glass cards |
| `script.js` | Login, voting, live polling |
| `config.js` | **The only file you must edit** |
| `Code.gs` | Google Apps Script backend |

---

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank sheet.
2. Rename it something like **"Voting Database"**.
3. You don't need to add headers yourself — the script creates a `Votes` sheet
   with headers automatically the first time it runs. If you'd rather do it
   manually, rename `Sheet1` to `Votes` and add this header row:

   ```
   Timestamp | Google User ID | Email | Candidate Name | Candidate ID
   ```

## Step 2 — Add the Apps Script

1. In the Sheet, go to **Extensions > Apps Script**.
2. Delete any starter code and paste the full contents of `Code.gs`.
3. Click **Save** (the disk icon).

## Step 3 — Deploy the Apps Script as a Web App

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me (your account)
   - **Who has access:** Anyone
4. Click **Deploy**, then **Authorize access** and approve the permissions
   (you'll see an "unverified app" warning since it's your own script —
   click **Advanced > Go to (project name)** to proceed).
5. Copy the **Web app URL**. It looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`
6. Paste this URL into `config.js` as `APPS_SCRIPT_URL`.

> Whenever you edit `Code.gs`, you must create a **new deployment version**
> (Deploy > Manage deployments > Edit > New version) for changes to go live.

## Step 4 — Create a Google OAuth Client ID (for Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or use an existing one).
3. Go to **APIs & Services > OAuth consent screen**. Choose **External**,
   fill in the app name, your email, and publish it (or keep it in Testing
   mode and add your own Google account under Test users).
4. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**.
5. Application type: **Web application**.
6. Under **Authorized JavaScript origins**, add the exact URL(s) where you'll
   host the site, for example:
   - `http://localhost:5500` (for local testing)
   - `https://yourusername.github.io` (if using GitHub Pages)
   - Your custom domain, if any
7. Click **Create**. Copy the **Client ID**.
8. Paste it into `config.js` as `GOOGLE_CLIENT_ID`.

> Google Identity Services checks the origin of the page making the request,
> not a redirect URL, so make sure the origin matches exactly (including
> `https://` and no trailing slash).

## Step 5 — Add your candidates

Open `config.js` and edit the `CANDIDATES` array — one object per candidate,
with a unique `id`, `name`, and `image` URL. The site automatically ranks
them live based on votes, so the order you list them in doesn't matter.

## Step 6 — Host the static files

Any static host works since there's no backend to run. Easiest options:

- **GitHub Pages:** push the folder to a repo, enable Pages in repo settings.
- **Netlify / Vercel:** drag-and-drop the folder in their dashboard.
- **Google Sites / Firebase Hosting (static only)** also work.

Make sure the hosting URL exactly matches an **Authorized JavaScript origin**
you added in Step 4, or Google Sign-In will fail with an origin mismatch error.

## Step 7 — Test end to end

1. Open the hosted `index.html`.
2. Sign in with a Google account.
3. Click **صوّت الآن** (Vote Now) on a candidate.
4. Check the Google Sheet — a new row should appear.
5. Try voting again with the same account — you should see
   "لقد قمت بالتصويت مسبقًا" (You have already voted) and the buttons disabled.
6. Open `admin.html` to see the live totals, ranking table, and charts.

---

## Security notes

- The frontend is never trusted for vote integrity. Every submission is
  re-checked against the sheet inside `Code.gs`, inside a `LockService` lock,
  so two simultaneous requests from the same email can't both slip through.
- `localStorage` on the client only improves the UI (instantly disabling the
  button on the same device/browser) — it is not the source of truth.
- To fully prevent API abuse beyond duplicate-email checking (e.g. rate
  limiting), consider adding a shared secret header check in `doPost`, or
  restricting the deployment further and proxying requests through a small
  Cloudflare Worker if you need stricter throttling.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Google button doesn't render | Wrong or missing `GOOGLE_CLIENT_ID`, or origin not authorized |
| Vote always fails silently | `APPS_SCRIPT_URL` not updated, or deployment not redeployed after edits |
| Results never update | Apps Script deployment access isn't set to "Anyone" |
| "Already Voted" on first try | Sheet already has a row with that email from earlier testing — delete it |
