const CATEGORY_SUFFIXES = {
  'میوه': 'fruit',
  'رنگ': 'color',
  'سبزی': 'vegetable',
  'وسیله نقلیه': 'vehicle',
  'لباس': 'clothing',
  'عضو بدن': 'human body',
  'خوراکی': 'food',
  'پدیدهٔ طبیعت': 'nature',
  'وسیله': 'object',
}

const CACHE_SECONDS = 60 * 60 * 24 * 7

function isSafeItem(value) {
  return /^[a-z0-9-]{1,64}$/i.test(value)
}

function searchUrl(query) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: '20',
    gsrwhat: 'text',
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '480',
    format: 'json',
    origin: '*',
  })
  return `https://commons.wikimedia.org/w/api.php?${params.toString()}`
}

function imageFiles(payload) {
  const pages = Object.values(payload?.query?.pages || {})
  const seen = new Set()
  return pages
    .sort((left, right) => (left.index || 0) - (right.index || 0))
    .map(page => {
      const info = page.imageinfo?.[0] || {}
      const mime = String(info.mime || '')
      const image = info.thumburl || info.url
      if (!image || !mime.startsWith('image/') || mime === 'image/svg+xml' || seen.has(image)) return null
      seen.add(image)
      return {
        image,
        title: page.title || '',
        pageid: page.pageid || null,
        source: `https://commons.wikimedia.org/?curid=${page.pageid || ''}`,
      }
    })
    .filter(Boolean)
}

export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url)
  const item = String(requestUrl.searchParams.get('item') || '').trim().toLowerCase()
  const prompt = String(requestUrl.searchParams.get('prompt') || '').trim()
  if (!isSafeItem(item)) return Response.json({ error: 'Invalid gallery item.' }, { status: 400 })

  const suffix = CATEGORY_SUFFIXES[prompt] || 'object'
  const cacheKey = new Request(`${requestUrl.origin}/api/gallery-cache/${encodeURIComponent(prompt)}/${item}`)
  const cache = caches.default
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  const queries = [...new Set([`${item} ${suffix}`, item])]
  let files = []
  for (const query of queries) {
    try {
      const response = await fetch(searchUrl(query), {
        headers: { 'User-Agent': 'KalamBaz/1.0 educational word game' },
      })
      if (!response.ok) continue
      files = imageFiles(await response.json())
      if (files.length >= 4) break
    } catch {
      // Try the shorter query before returning an error to the client.
    }
  }

  if (files.length < 4) {
    return Response.json({ error: 'Four photos were not found yet.' }, { status: 404 })
  }

  const payload = JSON.stringify({
    images: files.slice(0, 4).map(file => `/api/gallery-image?url=${encodeURIComponent(file.image)}`),
    sources: files.slice(0, 4).map(({ title, pageid, source }) => ({ title, pageid, source })),
  })
  const response = new Response(payload, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}`,
    },
  })
  await cache.put(cacheKey, response.clone())
  return response
}
