import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { SignJWT, jwtVerify } from 'jose'
import { neon } from '@neondatabase/serverless'
import type { Context, Next } from 'hono'
import { timingSafeEqual } from 'node:crypto'

export const config = {
  runtime: 'nodejs20.x',
  maxDuration: 15,
}

// ─── DB ──────────────────────────────────────────────────────────────────────

function db() {
  return neon(process.env.DATABASE_URL!)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function safeCompare(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a)
    const bb = Buffer.from(b)
    if (ab.length !== bb.length) {
      // still run comparison to avoid timing leak
      timingSafeEqual(Buffer.alloc(bb.length), bb)
      return false
    }
    return timingSafeEqual(ab, bb)
  } catch {
    return false
  }
}

function jwtSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET!)
}

function getClientIp(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  )
}

function validateOrigin(c: Context): boolean {
  const origin = c.req.header('origin')
  const host = c.req.header('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png']
const MAX_IMAGE_BYTES = 400 * 1024 // 400 KB

function verifyMagicBytes(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  }
  if (mimeType === 'image/png') {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  }
  if (mimeType === 'image/webp') {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    )
  }
  return false
}

function validateInstagramUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.protocol === 'https:' &&
      (u.hostname === 'instagram.com' || u.hostname === 'www.instagram.com')
    )
  } catch {
    return false
  }
}

// ─── Auth middleware ──────────────────────────────────────────────────────────

async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'peak_admin')
  if (!token) return c.json({ error: 'Unauthorized' }, 401)
  try {
    await jwtVerify(token, jwtSecret())
    await next()
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
}

async function mutationGuard(c: Context, next: Next) {
  if (!validateOrigin(c)) return c.json({ error: 'Forbidden' }, 403)
  await next()
}

// ─── App ─────────────────────────────────────────────────────────────────────

const app = new Hono().basePath('/api')

// ── Public: closet ────────────────────────────────────────────────────────────

app.get('/closet', async (c) => {
  const sql = db()
  const rails = await sql`
    SELECT r.id, r.name, r.sort_order,
      json_agg(
        json_build_object(
          'id', p.id,
          'title', p.title,
          'instagram_url', p.instagram_url,
          'image_url', '/api/posts/' || p.id || '/image?v=' || p.image_version,
          'sort_order', p.sort_order
        ) ORDER BY p.sort_order
      ) FILTER (WHERE p.id IS NOT NULL) AS posts
    FROM rails r
    LEFT JOIN posts p ON p.rail_id = r.id AND p.is_visible = true
    GROUP BY r.id
    ORDER BY r.sort_order
  `
  for (const rail of rails) {
    if (!rail.posts) rail.posts = []
  }
  c.header('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60')
  return c.json(rails)
})

// ── Public: post image ────────────────────────────────────────────────────────

app.get('/posts/:id/image', async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  const sql = db()
  const rows = await sql`
    SELECT image_data, image_type FROM posts
    WHERE id = ${id} AND is_visible = true
  `
  if (!rows.length) return c.json({ error: 'Not found' }, 404)
  const row = rows[0]
  c.header('Content-Type', row.image_type as string)
  c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
  // image_data comes from neon as a Buffer / Uint8Array
  return c.body(row.image_data as unknown as ArrayBuffer)
})

// ── Public: contact form ──────────────────────────────────────────────────────

app.post('/messages', async (c) => {
  const ip = getClientIp(c)
  const sql = db()

  // Per-IP rate limit: 3 messages per hour
  const recentMsgs = await sql`
    SELECT count(*) as cnt FROM messages WHERE created_at > now() - interval '1 hour'
  `
  // We don't have IP stored on messages — use a simple global cap per IP via login_attempts table reuse
  // Actually let's just cap globally at something reasonable; for per-IP we'd need an ip column.
  // Simple approach: allow 5 per IP per day — store in login_attempts with a prefix
  const msgKey = `msg:${ip}`
  const ipMsgs = await sql`
    SELECT count(*) as cnt FROM login_attempts
    WHERE ip = ${msgKey} AND created_at > now() - interval '1 day'
  `
  if (parseInt(ipMsgs[0].cnt as string) >= 5) {
    return c.json({ error: 'Too many messages. Try again tomorrow.' }, 429)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Honeypot
  if (body.website) return c.json({ ok: true }) // silently ignore

  const name = String(body.name || '').trim()
  const contact = String(body.contact || '').trim()
  const message = String(body.message || '').trim()

  if (!name || name.length > 100) return c.json({ error: 'Name is required (max 100 chars)' }, 400)
  if (!contact || contact.length > 200)
    return c.json({ error: 'Contact is required (max 200 chars)' }, 400)
  if (!message || message.length > 2000)
    return c.json({ error: 'Message is required (max 2000 chars)' }, 400)

  await sql`INSERT INTO messages (name, contact, message) VALUES (${name}, ${contact}, ${message})`
  await sql`INSERT INTO login_attempts (ip) VALUES (${msgKey})`

  return c.json({ ok: true })
})

// ── Admin: auth ───────────────────────────────────────────────────────────────

app.post('/admin/login', async (c) => {
  const ip = getClientIp(c)
  const sql = db()

  // Brute force check
  const attempts = await sql`
    SELECT count(*) as cnt FROM login_attempts
    WHERE ip = ${ip} AND created_at > now() - interval '15 minutes'
  `
  if (parseInt(attempts[0].cnt as string) >= 5) {
    return c.json({ error: 'Too many attempts. Try again in 15 minutes.' }, 429)
  }

  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  const username = String(body.username || '')
  const password = String(body.password || '')

  const validUser = safeCompare(username, process.env.ADMIN_USERNAME || '')
  const validPass = safeCompare(password, process.env.ADMIN_PASSWORD || '')

  if (!validUser || !validPass) {
    await sql`INSERT INTO login_attempts (ip) VALUES (${ip})`
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(jwtSecret())

  setCookie(c, 'peak_admin', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/api',
    maxAge: 60 * 60 * 12,
  })

  return c.json({ ok: true })
})

app.post('/admin/logout', (c) => {
  deleteCookie(c, 'peak_admin', { path: '/api' })
  return c.json({ ok: true })
})

app.get('/admin/me', async (c) => {
  const token = getCookie(c, 'peak_admin')
  if (!token) return c.json({ authenticated: false }, 401)
  try {
    await jwtVerify(token, jwtSecret())
    return c.json({ authenticated: true })
  } catch {
    return c.json({ authenticated: false }, 401)
  }
})

// ── Admin: protected routes ───────────────────────────────────────────────────

const admin = new Hono()
admin.use('*', authMiddleware)

// ─── Rails ────────────────────────────────────────────────────────────────────

admin.get('/rails', async (c) => {
  const sql = db()
  const rails = await sql`SELECT * FROM rails ORDER BY sort_order`
  return c.json(rails)
})

admin.post('/rails', mutationGuard, async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const name = String(body.name || '').trim()
  if (!name || name.length > 100) return c.json({ error: 'Name required (max 100)' }, 400)
  const sql = db()
  const maxRow = await sql`SELECT coalesce(max(sort_order), -1) as m FROM rails`
  const sortOrder = parseInt(maxRow[0].m as string) + 1
  const rows = await sql`INSERT INTO rails (name, sort_order) VALUES (${name}, ${sortOrder}) RETURNING *`
  return c.json(rows[0], 201)
})

admin.put('/rails/:id', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const name = String(body.name || '').trim()
  if (!name || name.length > 100) return c.json({ error: 'Name required (max 100)' }, 400)
  const sql = db()
  const rows = await sql`UPDATE rails SET name = ${name} WHERE id = ${id} RETURNING *`
  if (!rows.length) return c.json({ error: 'Not found' }, 404)
  return c.json(rows[0])
})

admin.delete('/rails/:id', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  const sql = db()
  await sql`DELETE FROM rails WHERE id = ${id}`
  return c.json({ ok: true })
})

admin.post('/rails/reorder', mutationGuard, async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const ids = body.ids as number[]
  if (!Array.isArray(ids)) return c.json({ error: 'ids must be an array' }, 400)
  const sql = db()
  for (let i = 0; i < ids.length; i++) {
    await sql`UPDATE rails SET sort_order = ${i} WHERE id = ${ids[i]}`
  }
  return c.json({ ok: true })
})

// ─── Posts (admin) ────────────────────────────────────────────────────────────

admin.get('/posts', async (c) => {
  const railId = c.req.query('rail_id')
  const sql = db()
  let rows
  if (railId === 'unassigned') {
    rows = await sql`
      SELECT id, rail_id, title, image_type, image_version, instagram_url, sort_order, is_visible, created_at,
             '/api/posts/' || id || '/image?v=' || image_version AS image_url
      FROM posts WHERE rail_id IS NULL ORDER BY created_at DESC`
  } else if (railId) {
    const rid = parseInt(railId)
    rows = await sql`
      SELECT id, rail_id, title, image_type, image_version, instagram_url, sort_order, is_visible, created_at,
             '/api/posts/' || id || '/image?v=' || image_version AS image_url
      FROM posts WHERE rail_id = ${rid} ORDER BY sort_order`
  } else {
    rows = await sql`
      SELECT id, rail_id, title, image_type, image_version, instagram_url, sort_order, is_visible, created_at,
             '/api/posts/' || id || '/image?v=' || image_version AS image_url
      FROM posts ORDER BY created_at DESC`
  }
  return c.json(rows)
})

admin.post('/posts', mutationGuard, async (c) => {
  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json({ error: 'Invalid form data' }, 400)
  }

  const title = String(formData.get('title') || '').trim() || null
  const instagramUrl = String(formData.get('instagram_url') || '').trim()
  const railId = formData.get('rail_id') ? parseInt(String(formData.get('rail_id'))) : null
  const imageFile = formData.get('image') as File | null

  if (!imageFile) return c.json({ error: 'Image is required' }, 400)
  if (!validateInstagramUrl(instagramUrl)) {
    return c.json({ error: 'instagram_url must be an https instagram.com URL' }, 400)
  }
  if (title && title.length > 200) return c.json({ error: 'Title max 200 chars' }, 400)

  const mimeType = imageFile.type
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return c.json({ error: 'Image must be webp, jpeg, or png' }, 400)
  }

  const buffer = await imageFile.arrayBuffer()
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    return c.json({ error: 'Image must be under 400 KB' }, 400)
  }

  const bytes = new Uint8Array(buffer)
  if (!verifyMagicBytes(bytes, mimeType)) {
    return c.json({ error: 'Image file is corrupt or type mismatch' }, 400)
  }

  const sql = db()
  let sortOrder = 0
  if (railId) {
    const maxRow = await sql`SELECT coalesce(max(sort_order), -1) as m FROM posts WHERE rail_id = ${railId}`
    sortOrder = parseInt(maxRow[0].m as string) + 1
  }

  const rows = await sql`
    INSERT INTO posts (rail_id, title, image_data, image_type, instagram_url, sort_order)
    VALUES (${railId}, ${title}, ${Buffer.from(buffer)}, ${mimeType}, ${instagramUrl}, ${sortOrder})
    RETURNING id, rail_id, title, image_type, image_version, instagram_url, sort_order, is_visible, created_at,
              '/api/posts/' || id || '/image?v=' || image_version AS image_url`

  return c.json(rows[0], 201)
})

admin.put('/posts/:id', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)

  let formData: FormData
  try {
    formData = await c.req.formData()
  } catch {
    return c.json({ error: 'Invalid form data' }, 400)
  }

  const sql = db()
  const existing = await sql`SELECT * FROM posts WHERE id = ${id}`
  if (!existing.length) return c.json({ error: 'Not found' }, 404)

  const title = formData.has('title') ? String(formData.get('title') || '').trim() || null : existing[0].title
  const instagramUrl = String(formData.get('instagram_url') || existing[0].instagram_url).trim()
  const railId = formData.has('rail_id')
    ? formData.get('rail_id')
      ? parseInt(String(formData.get('rail_id')))
      : null
    : existing[0].rail_id

  if (!validateInstagramUrl(instagramUrl)) {
    return c.json({ error: 'instagram_url must be an https instagram.com URL' }, 400)
  }
  if (title && title.length > 200) return c.json({ error: 'Title max 200 chars' }, 400)

  const imageFile = formData.get('image') as File | null
  let imageVersion = existing[0].image_version as number

  let imageData: Buffer | null = null
  let imageMime = existing[0].image_type as string

  if (imageFile && imageFile.size > 0) {
    const mimeType = imageFile.type
    if (!ALLOWED_TYPES.includes(mimeType)) return c.json({ error: 'Image must be webp, jpeg, or png' }, 400)
    const buffer = await imageFile.arrayBuffer()
    if (buffer.byteLength > MAX_IMAGE_BYTES) return c.json({ error: 'Image must be under 400 KB' }, 400)
    if (!verifyMagicBytes(new Uint8Array(buffer), mimeType)) return c.json({ error: 'Image file corrupt' }, 400)
    imageData = Buffer.from(buffer)
    imageMime = mimeType
    imageVersion += 1
  }

  let rows
  if (imageData) {
    rows = await sql`
      UPDATE posts SET title=${title}, instagram_url=${instagramUrl}, rail_id=${railId},
        image_data=${imageData}, image_type=${imageMime}, image_version=${imageVersion}
      WHERE id=${id}
      RETURNING id, rail_id, title, image_type, image_version, instagram_url, sort_order, is_visible, created_at,
                '/api/posts/' || id || '/image?v=' || image_version AS image_url`
  } else {
    rows = await sql`
      UPDATE posts SET title=${title}, instagram_url=${instagramUrl}, rail_id=${railId}
      WHERE id=${id}
      RETURNING id, rail_id, title, image_type, image_version, instagram_url, sort_order, is_visible, created_at,
                '/api/posts/' || id || '/image?v=' || image_version AS image_url`
  }

  return c.json(rows[0])
})

admin.delete('/posts/:id', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  const sql = db()
  await sql`DELETE FROM posts WHERE id = ${id}`
  return c.json({ ok: true })
})

admin.patch('/posts/:id/visibility', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const isVisible = Boolean(body.is_visible)
  const sql = db()
  const rows = await sql`UPDATE posts SET is_visible=${isVisible} WHERE id=${id} RETURNING id, is_visible`
  if (!rows.length) return c.json({ error: 'Not found' }, 404)
  return c.json(rows[0])
})

admin.patch('/posts/:id/rail', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const railId = body.rail_id != null ? parseInt(String(body.rail_id)) : null
  const sql = db()
  const rows = await sql`UPDATE posts SET rail_id=${railId} WHERE id=${id} RETURNING id, rail_id`
  if (!rows.length) return c.json({ error: 'Not found' }, 404)
  return c.json(rows[0])
})

admin.post('/posts/reorder', mutationGuard, async (c) => {
  let body: Record<string, unknown>
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }
  const ids = body.ids as number[]
  if (!Array.isArray(ids)) return c.json({ error: 'ids must be an array' }, 400)
  const sql = db()
  for (let i = 0; i < ids.length; i++) {
    await sql`UPDATE posts SET sort_order = ${i} WHERE id = ${ids[i]}`
  }
  return c.json({ ok: true })
})

// ─── Admin image endpoint (all posts, including hidden) ───────────────────────

admin.get('/posts/:id/image', async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  const sql = db()
  const rows = await sql`SELECT image_data, image_type FROM posts WHERE id = ${id}`
  if (!rows.length) return c.json({ error: 'Not found' }, 404)
  c.header('Content-Type', rows[0].image_type as string)
  c.header('Cache-Control', 'private, max-age=3600')
  return c.body(rows[0].image_data as unknown as ArrayBuffer)
})

// ─── Messages ─────────────────────────────────────────────────────────────────

admin.get('/messages', async (c) => {
  const sql = db()
  const rows = await sql`SELECT * FROM messages ORDER BY created_at DESC`
  return c.json(rows)
})

admin.patch('/messages/:id/read', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  const sql = db()
  const rows = await sql`UPDATE messages SET is_read=true WHERE id=${id} RETURNING id, is_read`
  if (!rows.length) return c.json({ error: 'Not found' }, 404)
  return c.json(rows[0])
})

admin.delete('/messages/:id', mutationGuard, async (c) => {
  const id = parseInt(c.req.param('id')!)
  if (isNaN(id)) return c.json({ error: 'Not found' }, 404)
  const sql = db()
  await sql`DELETE FROM messages WHERE id = ${id}`
  return c.json({ ok: true })
})

// Mount admin sub-app
app.route('/admin', admin)

export default handle(app)
