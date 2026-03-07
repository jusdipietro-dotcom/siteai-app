export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/projects/:path*',
    '/wizard',
    '/templates',
    '/media',
    '/settings',
    '/help',
  ],
}
