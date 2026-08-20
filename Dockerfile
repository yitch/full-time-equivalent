# Single image: builds the client and serves it from the game server, so the
# whole thing is one process on one port with no second URL to keep in sync.
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
COPY packages/client/package.json packages/client/
RUN npm ci

COPY . .
RUN npm run build

# ── runtime ────────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/
RUN npm ci --omit=dev --workspace @fte/server --include-workspace-root

COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/packages/server/dist packages/server/dist
COPY --from=build /app/packages/client/dist packages/client/dist

# Profiles live here. Mount a volume to keep progression across deploys.
ENV FTE_DATA_DIR=/data
VOLUME /data

EXPOSE 8787
ENV PORT=8787
CMD ["node", "packages/server/dist/index.js"]
