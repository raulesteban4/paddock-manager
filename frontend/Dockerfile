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

# Reemplazar configuración por defecto con el proxy inverso y soporte SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos estáticos compilados
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

# Healthcheck de disponibilidad del servidor web
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
