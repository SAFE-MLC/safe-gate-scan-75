# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
 
# Dependencias
COPY package.json package-lock.json ./
RUN npm ci --production=false
 
# Vite lee variables prefijadas VITE_ en build
ARG VITE_API_BASE
ENV VITE_API_BASE=${VITE_API_BASE}
 
# Código y build
COPY . .
RUN npm run build
 
# ---- runtime stage ----
FROM nginx:stable-alpine
 
# Config SPA (fallback a /index.html)
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
# Estáticos de Vite
COPY --from=build /app/dist /usr/share/nginx/html
 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]