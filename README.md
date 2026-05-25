# Apna Healer

Mental wellness platform built with Next.js App Router, NextAuth, Prisma, and PostgreSQL.

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and set the values for:

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Google OAuth should allow:

- Origin: `http://localhost:3000`
- Redirect URI: `http://localhost:3000/api/auth/callback/google`

### 3. Generate Prisma client and run migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 4. (Optional) Seed development data

```bash
npm run prisma:seed
```

This creates an admin (`admin@apnahealer.dev`), two members, a therapist, a listener, sample provider profiles, a couple of applications, and a pending booking with a wallet hold. The seed is idempotent — running it twice does not duplicate rows.

### 5. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

## Auth and platform flow

- Google sign-in is handled by NextAuth.
- Users are persisted through the Prisma adapter.
- A wallet is bootstrapped on first login.
- `/dashboard/*` is for authenticated non-admin users.
- `/admin/*` is restricted to `ADMIN` users.

## API areas currently wired

- `/api/users/me`
- `/api/wallet`
- `/api/wallet/add-money`
- `/api/wallet/withdraw`
- `/api/transactions`
- `/api/bookings`
- `/api/sessions`
- `/api/applications`
- `/api/admin/users`
- `/api/admin/applications/[id]`
- `/api/admin/payouts`

## Notes

- Prisma schema lives in `prisma/schema.prisma`.
- Prisma config lives in `prisma.config.ts`.
- Shared server services live under `src/server/services`.
- React Query is used for the live dashboard/admin data flows.
