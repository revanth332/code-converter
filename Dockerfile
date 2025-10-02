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
COPY package.json package-lock.json ./
RUN npm install
COPY . ./ 
RUN rm -rf ./client

# Copy frontend build output into backend "build" directory
COPY --from=build-frontend /app/client/public ./public

EXPOSE 8080

CMD ["node", "server.js"]
