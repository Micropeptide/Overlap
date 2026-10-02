# Overlap: one small Node process plus a SQLite file. No build step.
FROM node:24-alpine

WORKDIR /app
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY public ./public
COPY scripts ./scripts

RUN mkdir -p /data && chown node:node /data
USER node

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATA_DIR=/data

VOLUME /data
EXPOSE 3000
HEALTHCHECK --interval=60s --timeout=5s CMD wget -qO- http://127.0.0.1:3000/api/config >/dev/null || exit 1
CMD ["node", "server/index.js"]
