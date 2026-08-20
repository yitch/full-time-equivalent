import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, resolve } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Serves the built client from the same process as the game server.
 *
 * One process, one port, one thing to deploy — which matters because the
 * alternative is a static host for the client plus a separate host for the
 * WebSocket, two URLs to keep in sync, and a CORS problem. Hand-rolled rather
 * than pulling in Express: it is forty lines and the server has one dependency.
 */

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
}

export function findClientDist(): string | null {
  const candidates = [
    process.env.FTE_CLIENT_DIST,
    resolve(process.cwd(), 'packages/client/dist'),
    resolve(process.cwd(), '../client/dist'),
    resolve(process.cwd(), 'client'),
  ].filter((c): c is string => !!c)

  for (const dir of candidates) {
    if (existsSync(join(dir, 'index.html'))) return dir
  }
  return null
}

export function serveStatic(dir: string, req: IncomingMessage, res: ServerResponse): boolean {
  const url = (req.url ?? '/').split('?')[0] ?? '/'

  // Resolve inside the dist directory only: a request for ../../etc/passwd
  // must not escape, however unlikely it is on a tower defence about expenses.
  const requested = normalize(join(dir, decodeURIComponent(url)))
  if (!requested.startsWith(dir)) {
    res.writeHead(403).end()
    return true
  }

  let file = requested
  if (!existsSync(file) || statSync(file).isDirectory()) {
    // Single-page app: unknown paths are routes, not missing files.
    file = join(dir, 'index.html')
    if (!existsSync(file)) return false
  }

  const type = TYPES[extname(file)] ?? 'application/octet-stream'
  const immutable = file.includes('/assets/')
  res.writeHead(200, {
    'content-type': type,
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  createReadStream(file).pipe(res)
  return true
}
