import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      plan: string
      /**
       * UI hint for rendering admin-only navigation. Never an authorization
       * decision — server code must call requireAdmin() instead.
       */
      isAdmin?: boolean
    }
  }

  interface User {
    plan?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    plan?: string
  }
}
