# ==============================================================================
# Dockerfile Multi-Stage para Frontend Angular 18 (Paddock Manager Web)
# ==============================================================================

# ── Stage 1: Compilación de la aplicación Angular con Node.js 20 ──
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar dependencias utilizando package.json y package-lock.json
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y compilar la versión de producción
COPY . .
RUN npm run build -- --configuration production

# ── Stage 2: Servidor Web Nginx Alpine ──
FROM nginx:alpine

ENV NGINX_ENVSUBST_FILTER="BACKEND_URL"
ENV BACKEND_URL="http://paddock-api:8080"

# Plantilla para sustitución de BACKEND_URL y configuración directa por defecto
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos estáticos compilados
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
