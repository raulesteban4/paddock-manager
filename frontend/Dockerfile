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

# ── Stage 2: Servidor Web Nginx Alpine con soporte de plantillas ──
FROM nginx:alpine

# Render inyecta PORT dinámicamente; nginx:alpine ejecuta automáticamente
# envsubst sobre /etc/nginx/templates/*.template al arrancar el contenedor
# Las variables sustituidas son únicamente las declaradas en NGINX_ENVSUBST_TEMPLATE_VARS
ENV NGINX_ENVSUBST_TEMPLATE_VARS="PORT BACKEND_URL"
ENV PORT=10000
ENV BACKEND_URL="https://paddock-api-n1mp.onrender.com"

# Colocar la plantilla en el directorio que nginx:alpine procesa automáticamente
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copiar artefactos estáticos compilados
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 10000

CMD ["nginx", "-g", "daemon off;"]
