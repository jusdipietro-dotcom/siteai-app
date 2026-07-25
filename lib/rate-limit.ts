/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach per IP address.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in seconds */
  windowSeconds: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given identifier (usually IP + route).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSeconds * 1000
  const entry = store.get(identifier)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(req: Request): string {
  // X-Real-IP is set by our own Traefik and is not client-controllable — prefer
  // it. X-Forwarded-For is client-APPENDABLE at the first position (Traefik adds
  // the real IP AFTER the caller's value), so taking split(',')[0] let anyone
  // forge their rate-limit key with a random XFF and empty every bucket. If we
  // ever fall back to XFF, use the LAST hop — the one our proxy added.
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    const hops = forwarded.split(',').map((s) => s.trim()).filter(Boolean)
    return hops[hops.length - 1] || 'unknown'
  }
  return 'unknown'
}
