# --- Frontend Build Stage ---
FROM node:20 AS build-frontend

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Backend Stage ---
FROM node:20-slim

WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm install
COPY server/ ./

# Copy frontend build output into backend "build" directory
COPY --from=build-frontend /app/client/dist ./dist

EXPOSE 3000

CMD ["node", "server.js"]
