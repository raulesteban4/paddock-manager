# 🚀 DEPLOY.md — Manual de Despliegue en Producción

> **Proyecto:** Paddock Manager — Sistema de Gestión Integral de Talleres Mecánicos  
> **Versión:** 1.0.0  
> **Target:** Entornos Cloud PaaS (Railway, Render) y Servidores VPS (Ubuntu / Debian / Docker Compose)

---

## 1. Visión General de la Infraestructura de Producción

Paddock Manager está concebido bajo una arquitectura desacoplada basada en contenedores Docker estándar:

```
[ Cliente Web / Móvil ]
           │ HTTPS (Puerto 443 / SSL)
           ▼
  [ Nginx Proxy Inverso ] (paddock-web)
           │
     ┌─────┴────────────────────────┐
     │ / (Estáticos SPA)             │ /api/* (API REST)
     ▼                               ▼
[ Angular 18 Bundle ]      [ Spring Boot 3 API ] (paddock-api)
                                     │ JDBC (Pool HikariCP)
                                     ▼
                          [ PostgreSQL 16 DB ] (paddock-postgres)
```

---

## 2. Variables de Entorno de Producción

Crea un archivo `.env` seguro en el servidor o configura estas variables en el panel del proveedor de nube:

| Variable | Descripción | Valor Recomendado / Ejemplo |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | Perfil activo de Spring Boot | `prod` |
| `POSTGRES_DB` | Nombre de la base de datos | `paddock_prod_db` |
| `POSTGRES_USER` | Usuario de PostgreSQL | `paddock_admin` |
| `POSTGRES_PASSWORD` | Contraseña robusta generada | *(Cadena aleatoria de 32+ caracteres)* |
| `POSTGRES_HOST` | Host o nombre del servicio | `postgres` o host gestionado |
| `POSTGRES_PORT` | Puerto de PostgreSQL | `5432` |
| `DATABASE_URL` | *(Opcional)* URL completa JDBC para PaaS | `jdbc:postgresql://host:5432/db` |
| `JWT_SECRET` | Clave secreta HMAC-SHA512 para tokens | *(Cadena hexadecimal de 64+ caracteres)* |
| `JWT_EXPIRATION_MS` | Tiempo de expiración del token JWT | `86400000` (24 horas) |
| `SWAGGER_ENABLED` | Habilitar Swagger UI en producción | `false` |
| `BACKEND_PORT` | Puerto expuesto del backend | `8080` |
| `FRONTEND_PORT` | Puerto expuesto del frontend web | `80` (o `443` con SSL) |

---

## 3. Opción A: Despliegue en VPS (Ubuntu con Docker Compose)

Esta opción es ideal para un taller físico o red privada en servidores dedicados o VPS (Hetzner, DigitalOcean, Linode, AWS EC2, GCP Compute Engine).

### Paso 1: Instalar Docker y Docker Compose en el servidor
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Instalar Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

### Paso 2: Clonar el repositorio y configurar variables
```bash
git clone https://github.com/raulesteban4/paddock-manager.git
cd paddock-manager

# Configurar variables de entorno seguras
cp .env.example .env
nano .env
```

### Paso 3: Arrancar con Docker Compose en modo Producción
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### Paso 4: Configurar SSL Gratuito con Let's Encrypt y Certbot (Host Nginx)
Para publicar bajo un dominio propio (`taller.tudominio.com`):

```bash
sudo apt install -y certbot python3-certbot-nginx

# Solicitar certificado SSL automático
sudo certbot --nginx -d taller.tudominio.com
```

---

## 4. Opción B: Despliegue en Cloud PaaS (Render / Railway)

### 4.1 Despliegue Automatizado con 1 Clic en Render (Vía `render.yaml`)
El repositorio incluye el blueprint [`render.yaml`](file:///render.yaml) preconfigurado como infraestructura como código (IaC).

**Pasos para desplegar gratis en Render:**
1. Ve a [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints) y pulsa en **"New Blueprint Instance"**.
2. Conecta tu repositorio de GitHub `raulesteban4/paddock-manager`.
3. Render detectará automáticamente el archivo `render.yaml` y provisionará los 3 servicios en Frankfurt (Europa):
   - **`paddock-db`:** PostgreSQL 16 gestionado en la nube (Plan Free).
   - **`paddock-api`:** Backend Spring Boot 3 compilado desde Dockerfile con conexión JDBC automática desacoplada (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`), pool HikariCP optimizado para RAM de 512MB y generación de `JWT_SECRET`.
   - **`paddock-web`:** Frontend Angular 18 con Nginx compilado desde Dockerfile con proxy dinámico hacia `paddock-api` y certificado SSL HTTPS automático.
4. Pulsa en **"Apply"**. En aproximadamente 3-5 minutos tendrás tu aplicación disponible con URLs públicas `https://paddock-web.onrender.com` y `https://paddock-api.onrender.com`.

### 4.2 Despliegue Manual en Railway:
1. Crea un nuevo proyecto en [Railway.app](https://railway.app).
2. Añade un servicio **PostgreSQL**: Railway generará automáticamente la variable `DATABASE_URL`.
3. Añade el repositorio de GitHub:
   - **Servicio Backend:** Root directory `/backend`, Dockerfile path `Dockerfile`. Agrega las variables `SPRING_PROFILES_ACTIVE=prod`, `DATABASE_URL` y `JWT_SECRET`.
   - **Servicio Frontend:** Root directory `/frontend`, Dockerfile path `Dockerfile`.
4. Asocia tu dominio personalizado o dominio generado `*.up.railway.app` al servicio frontend.

---

## 5. Estrategia de Backups y Respaldo de Base de Datos

### Copia de seguridad manual:
```bash
docker exec -t paddock-postgres-prod pg_dump -U paddock_admin paddock_prod_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restauración de respaldo:
```bash
cat backup_20261124.sql | docker exec -i paddock-postgres-prod psql -U paddock_admin -d paddock_prod_db
```

### Automatización diaria vía Crontab:
```bash
0 3 * * * docker exec -t paddock-postgres-prod pg_dump -U paddock_admin paddock_prod_db | gzip > /backups/paddock_$(date +\%Y\%m\%d).sql.gz
```

---

## 6. Integración Continua (CI/CD)

El repositorio incluye un flujo automatizado de GitHub Actions en [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml):

- **Backend CI:** Ejecuta los 86 tests JUnit 5 y empaqueta el JAR.
- **Frontend CI:** Ejecuta los 34 tests Karma en ChromeHeadless y genera el bundle Angular optimizado.
- **Docker Verification:** Valida la sintaxis de Docker Compose y compila ambas imágenes Docker multi-stage.
