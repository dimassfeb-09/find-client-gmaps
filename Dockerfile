# Stage 1: Build React client
FROM node:22-slim AS build-client
WORKDIR /app/client
COPY client/package.json ./
RUN npm install
COPY client/ .
RUN npm run build

# Stage 2: Express server with Chromium
FROM node:22-slim

# Install Chromium for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# Install server dependencies
COPY package.json ./
RUN npm install --omit=dev

# Copy server-side code
COPY server/ ./server/
COPY database/ ./database/
COPY scraper/ ./scraper/

# Copy built client from stage 1
COPY --from=build-client /app/client/dist ./client/dist

# Data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "server/index.js"]
