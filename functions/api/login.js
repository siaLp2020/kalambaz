// Cloudflare Pages Function. Bind a KV namespace named KALAMBAZ_USERS for production.
export async function onRequestPost({ request, env }) {
  const { username: raw } = await request.json()
  const clean = String(raw || '').trim().slice(0, 24)
  if (!clean) return Response.json({ error: 'نام بازیکن را وارد کن.' }, { status: 400 })
  if (!env.KALAMBAZ_USERS) return Response.json({ username: clean, demo: true })
  let username = clean
  while (await env.KALAMBAZ_USERS.get(`user:${username}`)) {
    username = `${clean}${Math.floor(100 + Math.random() * 900)}`
  }
  await env.KALAMBAZ_USERS.put(`user:${username}`, JSON.stringify({ createdAt: Date.now() }))
  return Response.json({ username })
}
