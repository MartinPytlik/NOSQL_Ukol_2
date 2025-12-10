# Dockerfile pro backend (Node.js/Express)

# Použijeme Node.js 20 Alpine pro menší velikost image
FROM node:20-alpine

# Nastavení pracovního adresáře
WORKDIR /app

# Kopírování package.json a package-lock.json
COPY package*.json ./

# Instalace závislostí
RUN npm install --omit=dev

# Kopírování zdrojového kódu
COPY src/ ./src/

# Exponování portu
EXPOSE 3001

# Spuštění aplikace
CMD ["npm", "start"]

