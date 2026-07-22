import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { isAdminEmail } from './admin-emails'
import { isAccountAccessBlocked } from './account-deletion'

/**
 * Shown to a user who tries to sign in to an account that asked to be deleted.
 *
 * Says the account is closed and does NOT offer a self-service way back, for
 * the reason spelled out in app/api/account/delete/route.ts: the MercadoPago
 * preapprovals were already cancelled, and un-cancelling them is not an
 * operation MercadoPago has.
 */
export const ACCOUNT_DELETED_MESSAGE =
  'Esta cuenta fue dada de baja y sus datos están programados para eliminarse. ' +
  'Si fue un error, escribinos a automaticialab@gmail.com.'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) {
          throw new Error('Credenciales incorrectas')
        }

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) {
          throw new Error('Credenciales incorrectas')
        }

        // Checked AFTER the password, deliberately: answering "this account was
        // deleted" before verifying credentials would turn the login form into
        // an oracle for which addresses ever had an account here.
        if (isAccountAccessBlocked(user)) {
          throw new Error(ACCOUNT_DELETED_MESSAGE)
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          plan: user.plan,
        }
      },
    }),

    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Upsert user on Google OAuth
      if (account?.provider === 'google' && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        })
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
            },
          })
        } else if (isAccountAccessBlocked(existing)) {
          // Refuses the sign-in AND explains why. Returning `false` here would
          // send the user to a generic AccessDenied with no way to understand
          // what happened to their account.
          //
          // Note this can only match an account still inside its 30-day window:
          // the purge rewrites the email to a `@deleted.invalid` tombstone, so
          // afterwards the address is free again and this branch falls through
          // to `create` above — a person who left really can come back.
          return `/login?error=${encodeURIComponent(ACCOUNT_DELETED_MESSAGE)}`
        }
      }
      return true
    },

    async jwt({ token, user, trigger }) {
      // On sign in, enrich token with DB data
      if (user || trigger === 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.plan = dbUser.plan
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        // ── Deletion gate ───────────────────────────────────────────────────
        // Checked here, on EVERY session read, because this is the only choke
        // point that can revoke an ALREADY-ISSUED session. Sessions are JWTs:
        // nothing is stored server-side to invalidate, and middleware.ts runs
        // on the Edge runtime where Prisma cannot run. Blocking at sign-in
        // alone would leave a user who is currently logged in with a working
        // account for the full lifetime of their token — up to 30 days, i.e.
        // exactly the window in which their data is supposed to be going away.
        //
        // COST: one indexed lookup on a unique column per session read. Paid
        // deliberately. Every route that reads a session goes on to do real
        // database work anyway, and the alternative — a cached flag with a
        // refresh interval — makes "the account is unusable from that moment"
        // false by however long the interval is.
        const account = token.email
          ? await prisma.user.findUnique({
              where: { email: token.email },
              select: { deletionRequestedAt: true, deletedAt: true },
            })
          : null

        // A deleted (or missing) account gets a session with an EMPTY id rather
        // than a thrown error or a null return. Every authenticated route in
        // this codebase gates on `if (!session?.user?.id)`, so an empty string
        // — falsy, and still a `string` for the type system — turns all of them
        // into 401s at once, with no route needing to learn about deletion.
        if (!account || isAccountAccessBlocked(account)) {
          session.user.id = ''
          session.user.plan = 'free'
          session.user.isAdmin = false
          return session
        }

        session.user.id = token.id as string
        session.user.plan = (token.plan as string) ?? 'free'
        // Derived here rather than in the JWT so that changing ADMIN_EMAILS
        // takes effect on the next request instead of the next sign-in.
        //
        // This is a UI hint only — it tells a user whether *they* are an admin
        // so the sidebar can render the Admin entry, and never ships the
        // allowlist itself to the browser. Authorization is always re-derived
        // server-side by requireAdmin(); nothing trusts this flag.
        session.user.isAdmin = isAdminEmail(token.email)
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    newUser: '/wizard',
    error: '/login',
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
