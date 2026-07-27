FROM node:24-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends \
      g++ \
      make \
      python3 \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

RUN mkdir -p data \
    && chown node:node data

USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "const http = require('node:http'); const port = process.env.PORT || 3000; const request = http.get({ host: '127.0.0.1', port, path: '/health' }, (response) => process.exit(response.statusCode === 200 ? 0 : 1)); request.on('error', () => process.exit(1)); request.setTimeout(2000, () => { request.destroy(); process.exit(1); });"]

CMD ["node", "src/server.js"]
