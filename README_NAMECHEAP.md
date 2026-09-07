# Namecheap Deployment - DGST Grant Management Platform

This is a **pre-built** deployment package: the NestJS API is already compiled
(`dist/`) and the React frontend is already built and copied into `public/`, so
the same single Node.js process serves both the API (`/api/...`) and the web app
(everything else) - the right shape for a shared-hosting plan with one Node.js app
slot (Stellar Plus). You do not need to run any frontend build tools on the server.

## 1. Create the database (cPanel -> MySQL Databases)

1. Create a database (e.g. `<cpaneluser>_dgst_grants`) and a database user with a
   strong password, and add that user to the database with **All Privileges**.
2. Note the full database name, username, and password - cPanel prefixes both the DB
   name and username with your cPanel account name.

## 2. Set up the Node.js App (cPanel -> Setup Node.js App)

1. **Create Application**: Node.js version 20+, Application mode "Production".
2. **Application root**: the folder you upload/clone this repo into.
3. **Application URL**: your domain or subdomain (e.g. `grants.yourdomain.com`).
4. **Application startup file**: `dist/main.js`
5. Save, then open "Edit" on the app you just created to get its "Enter to the virtual
   environment" command, or use the "Run NPM Install" button in the UI.

## 3. Configure `.env`

Edit the `.env` file in the application root (already present with demo/placeholder
values) and set at minimum:

```
DATABASE_URL="mysql://<cpaneluser>_dgst_user:<password>@localhost:3306/<cpaneluser>_dgst_grants"
WEB_ORIGIN="https://yourdomain.com"
PUBLIC_VERIFY_BASE_URL="https://yourdomain.com/verify"
```

Generate real random values for `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` before this
goes anywhere near real applicant data (e.g. `openssl rand -hex 32`, or any random
64-character hex string) - the demo values checked into this repo are **not** secure
and are only here so the app boots out of the box.

## 4. Install dependencies and prepare the database

Via cPanel's "Run NPM Install" button (or a terminal/SSH session if your plan
includes one):

```
npm install
```

`npm install` automatically runs `prisma generate` afterwards (see the `postinstall`
script in `package.json`) - this downloads the Prisma query engine matching your
server's actual OS, so it works regardless of what platform Namecheap runs, no manual
step needed.

Then push the schema to your newly created database (no migration history exists yet,
so `db push` is the right command for this first deployment):

```
npm run db:push
```

Then seed the permission catalog, default roles, applicant categories, and the two
real Directorate programs/report templates (transcribed from `Reports_Format/`):

```
npm run seed
```

The seed output prints the Super Admin login (email + temporary password) - sign in
and change that password immediately once the app is live.

## 5. Start / restart the app

Use the "Restart" button on the Node.js App page in cPanel. Visit your domain - you
should see the DGST login page, and `https://yourdomain.com/api/programs/public`
should return JSON.

## Updating this deployment later

This repo is a **snapshot**, not something you edit directly and expect to match the
main development repo. To ship a new version:

1. In the main `DGST_Reporting` repo: `pnpm build:api`, then
   `VITE_API_BASE_URL=/api pnpm --filter @dgst/web build` (same-origin `/api`, not
   `localhost`).
2. Copy `apps/api/dist/*` over this repo's `dist/`, copy
   `apps/web/dist/*` into this repo's `public/` (sibling to `dist/`, not inside it),
   and copy
   `apps/api/prisma/schema.prisma` / `seed.ts` over if the schema changed.
3. Commit and push - then pull the update on the server (cPanel's Git Version Control
   feature, or re-upload) and hit "Restart" on the Node.js App.
4. If the schema changed, run `npx prisma db push` again before restarting.

## Production hardening once this is more than a demo

- Rotate the JWT secrets and the database password out of git history if the placeholder
  `.env` values above were ever used for anything real.
- Once you have real migration history (`prisma migrate dev` run against a dev
  database in the main repo, with the generated `prisma/migrations/` folder committed),
  switch this deployment to `npx prisma migrate deploy` instead of `db push` - `db push`
  is convenient for demos but doesn't keep a migration history.
- Revoke UPDATE/DELETE on the `audit_logs` table from the app's DB user (see
  `docs/setup-mysql.sql` and `docs/ARCHITECTURE.md` section 6 in the main repo) so the
  hash-chained audit trail can't be rewritten even by a compromised app credential.
