import { next } from '@vercel/edge'

// Gate the whole deployment behind HTTP Basic Auth so only people with the
// shared password can view the site. Credentials are read from the Vercel
// environment variables SITE_USER and SITE_PASSWORD (set in the dashboard,
// never committed). Basic Auth is fine here because Vercel serves over HTTPS
// and this only needs to keep casual visitors out for the assignment demo.
export const config = {
  // Protect every path, including static assets — the point is that nothing
  // is visible without the password.
  matcher: '/(.*)',
}

export default function middleware(request) {
  const expectedUser = process.env.SITE_USER
  const expectedPassword = process.env.SITE_PASSWORD

  // Fail closed if the env vars aren't configured yet.
  if (!expectedUser || !expectedPassword) {
    return unauthorized()
  }

  const header = request.headers.get('authorization')
  if (header) {
    const [scheme, encoded] = header.split(' ')
    if (scheme === 'Basic' && encoded) {
      // Split on the first ":" only, so a password containing ":" still works.
      const decoded = atob(encoded)
      const separator = decoded.indexOf(':')
      const user = decoded.slice(0, separator)
      const password = decoded.slice(separator + 1)

      if (user === expectedUser && password === expectedPassword) {
        return next()
      }
    }
  }

  return unauthorized()
}

function unauthorized() {
  return new Response('Authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Curbi", charset="UTF-8"',
    },
  })
}
