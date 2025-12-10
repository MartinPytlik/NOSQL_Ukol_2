# Dockerfile pro frontend (React)
# Multi-stage build pro optimalizovaný production image

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Kopírování package.json a instalace závislostí
COPY package*.json ./
RUN npm install

# Kopírování zdrojového kódu a build
COPY . .
RUN npm run build

# Stage 2: Production s nginx
FROM nginx:alpine

# Kopírování nginx konfigurace
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Kopírování buildnuté aplikace
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponování portu
EXPOSE 80

# Spuštění nginx
CMD ["nginx", "-g", "daemon off;"]

