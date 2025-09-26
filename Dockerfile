# ---- build stage ----
FROM node:20-alpine AS build

# prevent hanging on some alpine builds
RUN apk add --no-cache python3 make g++ || true

WORKDIR /app

# Copia solo package files para cachear instalación de dependencias
COPY package.json package-lock.json ./

# Si usas npm:
RUN npm ci --production=false

# Si prefieres bun (hay bun.lockb en el repo), reemplaza las dos líneas previas por:
# COPY bun.lockb ./
# RUN curl -fsSL https://bun.sh/install | bash && /root/.bun/bin/bun install

# copia todo y construye
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:stable-alpine

# Elimina configuración default (opcional)
RUN rm -f /etc/nginx/conf.d/default.conf

# Copia configuración nginx (ver más abajo)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos construidos por Vite (output por defecto: /dist)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

STOPSIGNAL SIGTERM
CMD ["nginx", "-g", "daemon off;"]
