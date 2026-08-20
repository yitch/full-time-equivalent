# Putting it online

The whole game is **one Node process on one port**. The server serves the built
client and hosts the WebSocket on the same origin, so there is no second URL to
configure and no CORS to get wrong.

```bash
npm ci && npm run build
node packages/server/dist/index.js      # http://localhost:8787
```

That is exactly what every option below runs.

---

## Render — easiest, no CLI

The repo contains [`render.yaml`](render.yaml), so Render can deploy it without
being told anything.

1. Go to **[dashboard.render.com](https://dashboard.render.com)** → **New** → **Blueprint**
2. Connect the GitHub repo `yitch/full-time-equivalent`
3. **Apply**. First build takes about three minutes.

You get `https://full-time-equivalent.onrender.com` (or similar) to share.

**Two things to know about the free plan.** The service sleeps after 15 minutes
idle, so the first visitor after a quiet spell waits ~30 seconds for it to wake.
And the filesystem is ephemeral, so player profiles — account level, stash,
unlocked animals — reset on every restart. A single session is unaffected;
long-term progression is not kept. Uncomment the `disk:` block in `render.yaml`
and move to a paid instance to fix that.

## Railway — one command, needs a login

```bash
railway login          # opens a browser; only you can do this
railway init
railway up
railway domain         # prints the public URL
```

[`railway.json`](railway.json) already sets the build and start commands.

## Fly.io

```bash
brew install flyctl
fly launch --no-deploy     # accept the detected Dockerfile
fly volumes create profiles --size 1     # optional, keeps progression
fly deploy
```

## Docker, anywhere

```bash
docker build -t fte .
docker run -p 8787:8787 -v fte-data:/data fte
```

> The [`Dockerfile`](Dockerfile) is written but has **not** been built and run
> here — Docker was not available on the machine this was set up on. The Render
> and plain-Node paths have both been run end to end.

---

## Configuration

| Variable | Default | What it does |
|---|---|---|
| `FTE_PORT` | — | Port to listen on. Wins over `PORT`, so a host that injects `PORT` for something else cannot steal the socket. |
| `PORT` | `8787` | Standard host-supplied port. |
| `FTE_DATA_DIR` | `./.data` | Where `profiles.json` is written. Point at a mounted volume to keep progression. |
| `FTE_CLIENT_DIST` | auto | Override the built client's location. Found automatically in normal layouts. |
| `VITE_SERVER_URL` | same origin | Build-time only. Set if you host the client separately from the server. |

## Checking it worked

```bash
curl https://YOUR-URL/health      # {"ok":true,"rooms":0}
```

Then open the URL, enter a name, and you should get a four-letter room code.
Share the code and the URL and other people join the same floor.
