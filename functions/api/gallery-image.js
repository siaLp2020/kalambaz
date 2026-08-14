const ALLOWED_HOSTS = new Set(['upload.wikimedia.org', 'commons.wikimedia.org'])
const CACHE_SECONDS = 60 * 60 * 24 * 7

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url)
  const rawTarget = requestUrl.searchParams.get('url') || ''
  let target
  try {
    target = new URL(rawTarget)
  } catch {
    return new Response('Invalid image URL.', { status: 400 })
  }
  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response('Image host is not allowed.', { status: 400 })
  }

  const cacheKey = new Request(`${requestUrl.origin}/api/gallery-image-cache?url=${encodeURIComponent(target.toString())}`)
  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  let upstream
  try {
    upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'KalamBaz/1.0 educational word game' },
    })
  } catch {
    return new Response('Image is temporarily unavailable.', { status: 502 })
  }
  if (!upstream.ok || !upstream.body) return new Response('Image is temporarily unavailable.', { status: 502 })

  const headers = new Headers(upstream.headers)
  headers.set('Cache-Control', `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`)
  headers.set('Content-Security-Policy', "default-src 'none'; img-src 'self'; sandbox")
  const response = new Response(upstream.body, { status: 200, headers })
  await cache.put(cacheKey, response.clone())
  return response
}
