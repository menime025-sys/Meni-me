# Meni-me Fashion Platform

Better Auth-powered authentication for a Next.js 16 app with Prisma, PostgreSQL, React Hook Form, and shadcn/ui components. Users can sign in with email/password or continue with Google.

## 🔧 Stack

- Next.js 16 (App Router + Turbopack)
- React 19 with React Hook Form + Zod validation
- Better Auth 1.3 with Prisma adapter
- PostgreSQL (tested with Neon)
- Tailwind CSS 4, shadcn/ui primitives

## 🚀 Getting started

1. **Install dependencies**

	```bash
	pnpm install
	```

2. **Configure environment variables**

	Create a `.env.local` file (or export the variables in your shell) using the template below. The Google credentials come from the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and must be configured as an OAuth 2.0 Web application.

	```bash
	DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
	BETTER_AUTH_SECRET="generate-a-long-random-string"
	BETTER_AUTH_URL="http://localhost:3000"
	NEXT_PUBLIC_APP_URL="http://localhost:3000"
	GOOGLE_CLIENT_ID="your-google-oauth-client-id"
	GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
	```

	> **Heads-up:** Managed Postgres providers such as Neon sometimes append `channel_binding=require` to the connection string. Prisma's query engine doesn't support that option yet, so remove the `channel_binding` query parameter if it appears in your URL.

	**Google OAuth tips**

	- Authorized *JavaScript origin*: `http://localhost:3000`
	- Authorized *redirect URI*: `http://localhost:3000/api/auth/callback/google`
	- Repeat the same origins/redirects for staging/production domains.

3. **Run database migrations**

	```bash
	pnpm exec prisma migrate deploy
	```

	For local development you can use `pnpm exec prisma migrate dev --name init` to create and apply migrations automatically.

4. **Start the dev server**

	```bash
	pnpm dev
	```

	Visit [http://localhost:3000](http://localhost:3000) to use the auth flows.

## 🔐 Authentication flows

- **Email & password** – standard Better Auth flow backed by Prisma models.
- **Google OAuth** – "Continue with Google" buttons on the sign-in and sign-up forms start the OAuth redirect. Successful Google sign-ins either create a new account or log the user in.

The Better Auth API is exposed under `/api/auth/*` via the generated handler in `src/app/api/auth/[...betterAuth]/route.ts`.

## 🛠️ Scripts

```bash
pnpm dev     # Start Next.js in dev mode
pnpm build   # Create a production build
pnpm start   # Run the production server
pnpm lint    # Lint the project
```

## ✅ Troubleshooting

- If Google buttons do nothing, verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set on both the server and client (restart the dev server after changes).
- Prisma errors like `P2021` usually mean migrations haven’t been applied to the target database.
- Prisma `P1001` (“Can’t reach database server”) commonly happens with Neon when `channel_binding=require` is present in the URL. Remove that query parameter or use the non-pooled connection string.
- When running locally, ensure `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` both point to the dev server origin so callback URLs resolve correctly.

## 📚 Useful references

- [Better Auth documentation](https://www.better-auth.com/docs)
- [Prisma documentation](https://www.prisma.io/docs)
- [Google Cloud OAuth credentials](https://console.cloud.google.com/apis/credentials)
