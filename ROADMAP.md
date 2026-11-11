# 🗺️ ROADMAP.md — Hoja de Ruta y Seguimiento de Desarrollo

> **Proyecto:** Paddock Manager  
> **Última actualización:** 11 de Noviembre de 2026  
> **Estado global de avance:** 14 de 19 fases completadas y verificadas (73.7% de avance del roadmap global).  
> **Suite de pruebas backend:** **60 de 60 pruebas superadas al 100% (`BUILD SUCCESS`)**.  
> **Compilación frontend:** **Angular 18 Standalone sin errores (`ng build`)**.

---

## 📊 1. Resumen Ejecutivo de Progreso

| Fase | Hito / Módulo | Estado Real | Backend | Frontend | Tests |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **1** | Análisis y Arquitectura | **COMPLETADA** | ✅ | ✅ | N/A |
| **2** | Base de Datos (PostgreSQL 16) | **COMPLETADA** | ✅ | N/A | ✅ Scripts DDL/Seed |
| **3** | Spring Boot Inicial & Base REST | **COMPLETADA** | ✅ | N/A | ✅ Health & Context |
| **4** | Customer CRUD (Gestión de Clientes) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **5** | Vehicle CRUD (Parque de Vehículos) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **6** | Angular Inicial (Layout y Sistema UI) | **COMPLETADA** | N/A | ✅ | ✅ Compilación |
| **7** | Integración Angular + Spring Boot | **COMPLETADA** | ✅ | ✅ | ✅ End-to-End HTTP |
| **8** | Autenticación + JWT + Spring Security | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **9** | Appointments (Citas & Solapamientos) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **10** | Repair Orders (Órdenes de Trabajo) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **11** | Diagnosis (Diagnósticos Técnicos 1:1) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **12** | Budgets (Presupuestos, IVA e Impresión) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **13** | Inventory (Inventario, Repuestos & Stock) | **COMPLETADA** | ✅ | ✅ | ✅ Integration Tests |
| **14** | Dashboards (Métricas y KPIs del Taller) | **COMPLETADA** | ✅ /api/dashboard | ✅ Conectado | ✅ Integration Tests |
| **15** | Responsive + UX (Modo Oscuro y Móvil) | **PARCIAL** | N/A | ⚠️ Adaptable básico | ⚠️ Visual |
| **16** | Testing (Cobertura Global Backend/Frontend) | **PARCIAL** | ✅ 57 tests green | ❌ Sin tests Karma | ⚠️ 57/57 Backend |
| **17** | Docker (Contenedorización Full Stack) | **PARCIAL** | ❌ Sin Dockerfile | ❌ Sin Dockerfile | ⚠️ Solo PostgreSQL |
| **18** | Deploy (Despliegue y Perfil Producción) | **PENDIENTE** | ❌ Sin prod.yml | ❌ Sin CDN/Nginx | ❌ Pendiente |
| **19** | Documentación y Portfolio Final | **EN DESARROLLO** | ✅ Swagger/Doc | ✅ UI lista | ⚠️ Documentando |

---

## 🎯 2. Desglose Exhaustivo de las 19 Fases

---

### FASE 1: Análisis y Arquitectura
- **Objetivo:** Definir los requisitos funcionales y no funcionales del taller, modelar el ciclo de vida del vehículo y diseñar la arquitectura técnica desacoplada monorepositorio.
- **Funcionalidades necesarias:**
  - Levantamiento del flujo de taller (Recepción ➔ Diagnóstico ➔ Presupuesto ➔ Reparación ➔ Inventario ➔ Facturación).
  - Selección de stack tecnológico (Java 17, Spring Boot 3, PostgreSQL 16, Angular 18 Standalone).
  - Definición de convención de diseño (DDD modular, Stateless JWT, REST API uniforme).
- **Entregables:** Diagramas de flujo de taller, estructura base del repositorio, diseño de base de datos conceptual.
- **Criterios de aceptación:** Arquitectura aprobada sin dependencias circulares y con separación estricta de capas.
- **Verificación:** Revisión de diseño técnico en documentación.
- **Estado actual:** **COMPLETADA** (Arquitectura respetada en todo el código desarrollado).

---

### FASE 2: Base de Datos
- **Objetivo:** Diseñar y construir el esquema relacional en PostgreSQL 16 con normalización estricta, claves foráneas, restricciones de integridad e índices de alto rendimiento.
- **Funcionalidades necesarias:**
  - Creación de 13 tablas relacionales (`roles`, `users`, `customers`, `vehicles`, `appointments`, `repair_orders`, `diagnoses`, `budgets`, `budget_items`, `parts`, `repair_order_parts`, `work_logs`, `status_history`).
  - Restricciones `CHECK` para combustibles, estados de órdenes, prioridades y valores no negativos.
  - Población de datos semilla con roles, usuarios cifrados con BCrypt (`password123`), clientes, vehículos, inventario y orden de ejemplo.
- **Entregables:** [`database/init/01-schema.sql`](file:///c:/Users/rauly/Desktop/Paddock%20Manager/database/init/01-schema.sql) y [`database/init/02-seed-data.sql`](file:///c:/Users/rauly/Desktop/Paddock%20Manager/database/init/02-seed-data.sql).
- **Criterios de aceptación:** Inicialización correcta de la base de datos al levantar el contenedor de Docker sin errores de sintaxis ni de integridad referencial.
- **Verificación:** Ejecución en contenedor `paddock-postgres` y verificación de consultas de esquema.
- **Estado actual:** **COMPLETADA** (DDL y datos semilla activos y operacionales).

---

### FASE 3: Spring Boot Inicial
- **Objetivo:** Inicializar la aplicación backend Spring Boot 3.3.4 con Java 17, configurando perfiles de ejecución, documentación OpenAPI y manejo global de excepciones.
- **Funcionalidades necesarias:**
  - Configuración multientorno: [`application.yml`](file:///c:/Users/rauly/Desktop/Paddock%20Manager/backend/src/main/resources/application.yml), `application-dev.yml` (PostgreSQL) y `application-test.yml` (H2).
  - Documentación interactiva Swagger UI / OpenAPI 2.6.0 en `/swagger-ui.html`.
  - Envoltorio de respuestas uniforme [`ApiResponse<T>`](file:///c:/Users/rauly/Desktop/Paddock%20Manager/backend/src/main/java/com/paddock/manager/common/response/ApiResponse.java) y [`GlobalExceptionHandler`](file:///c:/Users/rauly/Desktop/Paddock%20Manager/backend/src/main/java/com/paddock/manager/common/exception/GlobalExceptionHandler.java).
  - Endpoint de salud pública `/api/health`.
- **Entregables:** Estructura Maven, `PaddockManagerApplication.java`, paquetes `common/` y `config/`.
- **Criterios de aceptación:** Respuesta 200 OK en `/api/health` y `/swagger-ui.html`, formato de error JSON consistente.
- **Verificación:** `HealthControllerTest.java` pasando con éxito.
- **Estado actual:** **COMPLETADA**.

---

### FASE 4: Customer CRUD
- **Objetivo:** Proporcionar la gestión integral de clientes del taller (particulares y empresas) con validaciones de documento de identidad y contacto.
- **Funcionalidades necesarias:**
  - Entidad `Customer` con campos `dniCif`, `firstName`, `lastName`, `email`, `phone`, `address`, `city`.
  - Validación de formato y unicidad de `dniCif` y `email`.
  - Búsqueda en tiempo real paginada por nombre, apellidos, DNI o teléfono.
  - Endpoints REST en `/api/customers` con control de roles (`ROLE_ADMIN`, `ROLE_RECEPTIONIST`).
  - Interfaz gráfica en Angular con modal de creación/edición y alertas.
- **Entregables:** Módulo backend `modules/customer/` y componente frontend `features/customers/`.
- **Criterios de aceptación:** CRUD completo verificado, paginación operativa y rechazo de duplicados.
- **Verificación:** `CustomerControllerTest.java` (7 pruebas pasando).
- **Estado actual:** **COMPLETADA**.

---

### FASE 5: Vehicle CRUD
- **Objetivo:** Gestionar el parque de vehículos asociados a los clientes, con validación de bastidor (VIN) y control de kilometraje.
- **Funcionalidades necesarias:**
  - Entidad `Vehicle` vinculada con `Customer` (ManyToOne).
  - Validación estricta de formato VIN (17 caracteres alfanuméricos) y unicidad de matrícula.
  - Clasificación de combustibles: `GASOLINE`, `DIESEL`, `ELECTRIC`, `HYBRID`, `LPG`.
  - Filtrado de vehículos por cliente, matrícula o texto libre.
  - Interfaz Angular con listado, badges de matrículas y formulario modal.
- **Entregables:** Módulo backend `modules/vehicle/` y vista `features/vehicles/`.
- **Criterios de aceptación:** No permitir registrar un vehículo sin cliente existente o con VIN duplicado.
- **Verificación:** `VehicleControllerTest.java` (9 pruebas pasando).
- **Estado actual:** **COMPLETADA**.

---

### FASE 6: Angular Inicial
- **Objetivo:** Construir la base de la interfaz de usuario en Angular 18 utilizando Standalone Components, Signals y diseño modular.
- **Funcionalidades necesarias:**
  - Layout empresarial con `HeaderComponent` y `SidebarComponent` reactivo y colapsable.
  - Sistema de rutas en `app.routes.ts` con protección mediante Guards.
  - Paleta de diseño corporativa automotriz (Paddock Racing Red `#dc2626`, Slate Dark, tarjetas y tablas responsivas) en `styles.scss`.
- **Entregables:** `app.component.*`, `shared/components/`, `app.config.ts`, `app.routes.ts`.
- **Criterios de aceptación:** Navegación fluida entre módulos sin recarga de página y diseño coherente.
- **Verificación:** Compilación con `ng build` sin errores.
- **Estado actual:** **COMPLETADA**.

---

### FASE 7: Integración Angular + Spring
- **Objetivo:** Conectar el frontend con el backend mediante servicios HTTP tipados, interceptores y gestión de entornos.
- **Funcionalidades necesarias:**
  - Configuración de `environment.ts` con `apiUrl: 'http://localhost:8080/api'`.
  - Configuración de CORS en backend (`CorsConfig.java`) para permitir orígenes cruzados en local.
  - Creación de modelos TypeScript en `core/models/` reflejando exactamente los DTOs de Spring Boot.
  - Servicios HTTP tipados utilizando `HttpClient` y `Observable<ApiResponse<T>>`.
- **Entregables:** Modelos en `core/models/`, servicios en `core/services/`, configuración CORS.
- **Criterios de aceptación:** Comunicación bidireccional limpia y tipada entre Angular y Spring Boot.
- **Verificación:** Pruebas de consumo HTTP en todos los componentes desarrollados.
- **Estado actual:** **COMPLETADA**.

---

### FASE 8: Autenticación + JWT
- **Objetivo:** Implementar seguridad basada en tokens JWT con control de acceso por roles (RBAC) en backend y frontend.
- **Funcionalidades necesarias:**
  - Spring Security 6 stateless con `JwtAuthenticationFilter`, `JwtService` y `CustomUserDetailsService`.
  - Encriptación de contraseñas con `BCryptPasswordEncoder`.
  - Endpoint `/api/auth/login` emitiendo JWT con expiración de 24 horas y claims (`role`, `fullName`, `userId`).
  - Frontend: `AuthService` reactivo con Signals, `authInterceptor` para inyectar `Bearer <token>` y redirigir en 401, y `authGuard` / `guestGuard`.
  - Pantalla de inicio de sesión (`login.component.ts`) con credenciales rápidas de demostración.
- **Entregables:** `modules/auth/`, `security/`, `features/auth/login/`, guards e interceptores.
- **Criterios de aceptación:** Rechazo de peticiones no autenticadas (HTTP 401/403) y persistencia segura de sesión.
- **Verificación:** `AuthControllerTest.java` (6 pruebas pasando) e inicio de sesión funcional en navegador.
- **Estado actual:** **COMPLETADA**.

---

### FASE 9: Appointments (Citas)
- **Objetivo:** Gestionar la agenda de citas del taller evitando conflictos de horario y vinculando clientes con vehículos.
- **Funcionalidades necesarias:**
  - Entidad `Appointment` con fecha/hora, motivo, observaciones y estados (`PROGRAMADA`, `CONFIRMADA`, `EN_TALLER`, `COMPLETADA`, `CANCELADA`).
  - **Algoritmo de prevención de solapamientos:** Detección de colisiones de horario en franjas estimadas.
  - Endpoints REST en `/api/appointments` con filtros por fecha, cliente o vehículo.
  - Componente Angular con selector de fecha, modal de cita y panel de estado.
- **Entregables:** Módulo backend `modules/appointment/` y componente `features/appointments/`.
- **Criterios de aceptación:** Validación que impida agendar dos vehículos a la misma hora en la misma franja.
- **Verificación:** `AppointmentControllerTest.java` (6 pruebas pasando).
- **Estado actual:** **COMPLETADA**.

---

### FASE 10: Repair Orders (Órdenes de Trabajo)
- **Objetivo:** Implementar el núcleo operativo del taller: órdenes de reparación con secuencia anual, máquina de estados y auditoría inmutable.
- **Funcionalidades necesarias:**
  - Generador de secuencia única anual `ORD-YYYY-XXXX` (ej. `ORD-2026-0001`).
  - Máquina de estados: `RECEIVED` ➔ `DIAGNOSIS` ➔ `QUOTE_PENDING` ➔ `APPROVED` ➔ `IN_REPAIR` ➔ `WAITING_FOR_PARTS` ➔ `COMPLETED` ➔ `DELIVERED` (o `CANCELLED`).
  - Tabla de auditoría `status_history` con usuario responsable, marca de tiempo y notas del cambio.
  - Actualización automática del kilometraje del vehículo a la recepción.
  - Componente Angular con timeline de estados, asignación de mecánico y filtros.
- **Entregables:** Módulo backend `modules/repairorder/` y componente `features/repair-orders/`.
- **Criterios de aceptación:** Transiciones de estado auditadas e imposibilidad de saltos ilegales en la máquina de estados.
- **Verificación:** `RepairOrderControllerTest.java` (9 pruebas pasando).
- **Estado actual:** **COMPLETADA**.

---

### FASE 11: Diagnosis (Diagnósticos)
- **Objetivo:** Permitir al mecánico registrar los hallazgos técnicos, averías observadas y recomendaciones de seguridad de una orden.
- **Funcionalidades necesarias:**
  - Entidad `Diagnosis` vinculada 1:1 con `RepairOrder`.
  - Registro de síntomas, diagnóstico técnico y recomendaciones.
  - Bloqueo de edición si la orden ha sido completada o entregada.
  - Interfaz Angular con buscador por orden/matrícula y formulario técnico.
- **Entregables:** Módulo backend `modules/diagnosis/` y vista `features/diagnoses/`.
- **Criterios de aceptación:** Solo una diagnosis por orden y restricción de modificación a mecánicos/admins.
- **Verificación:** `DiagnosisControllerTest.java` (6 pruebas pasando).
- **Estado actual:** **COMPLETADA**.

---

### FASE 12: Budgets (Presupuestos)
- **Objetivo:** Elaborar presupuestos detallados por partidas, calcular impuestos (IVA 21%) y sincronizar el estado de la orden según la decisión del cliente.
- **Funcionalidades necesarias:**
  - Entidades `Budget` y `BudgetItem` (tipos: `LABOR`, `PART`, `DIAGNOSIS`, `OTHER`).
  - Cálculo reactivo automático de subtotal, IVA y total general.
  - **Sincronización bidireccional:** Al crear presupuesto, la orden pasa a `QUOTE_PENDING`. Al aprobarse, avanza a `APPROVED` y queda bloqueada su edición.
  - Vista imprimible / formato factura para entregar al cliente.
- **Entregables:** Módulo backend `modules/budget/` y componente `features/budgets/`.
- **Criterios de aceptación:** Cálculos monetarios exactos con dos decimales y sincronización automática de orden.
- **Verificación:** `BudgetControllerTest.java` (6 pruebas pasando) y verificación en vivo contra PostgreSQL.
- **Estado actual:** **COMPLETADA**.

---

### FASE 13: Inventory (Inventario y Repuestos)
- **Objetivo:** Controlar las existencias del almacén de recambios, alertar de stock crítico y calcular la valoración económica del inventario.
- **Funcionalidades necesarias:**
  - Entidad `Part` con código de referencia único, fabricante, proveedor, stock actual, stock mínimo, precio de coste y precio de venta.
  - **Ajustes rápidos de stock (`PATCH /{id}/stock`):** Entradas y salidas de almacén con registro de motivo y **bloqueo estricto contra stock negativo**.
  - Alerta inmediata de stock bajo (`stock <= minStock`).
  - Métricas de almacén (`/stats`): Total referencias, piezas críticas, valoración a coste (€) y a venta (€).
  - Vista Angular con 4 KPIs interactivos, cálculo dinámico de margen comercial y modal de ajuste rápido.
- **Entregables:** Módulo backend `modules/part/`, tests `PartControllerTest.java`, modelos y componente `features/inventory/`.
- **Criterios de aceptación:** Imposibilidad de reducir stock por debajo de 0 y cálculo en tiempo real de valoraciones.
- **Verificación:** `PartControllerTest.java` (8 pruebas pasando), `ng build` exitoso.
- **Estado actual:** **COMPLETADA**.

---

### FASE 14: Dashboards (Métricas y KPIs del Taller)
- **Objetivo:** Proporcionar al jefe de taller y administrador un panel de control con métricas en tiempo real de vehículos, órdenes activas, citas del día, stock crítico y facturación.
- **Funcionalidades necesarias:**
  - Backend: Controlador y servicio de estadísticas agregadas (`DashboardStatsDto`):
    - Conteo de vehículos en taller (`vehiclesInWorkshop`) excluyendo estados finalizados.
    - Órdenes desglosadas por estado operativo (`IN_REPAIR`, `DIAGNOSIS`, `QUOTE_PENDING`, `WAITING_FOR_PARTS`, `APPROVED`, etc.).
    - Citas programadas para la jornada de hoy (`todayAppointments`).
    - Recambios con existencias bajo el umbral mínimo (`lowStockParts`).
    - Facturación total acumulada de presupuestos aprobados (`totalApprovedRevenue`).
    - Listado en vivo de las órdenes de trabajo activas más recientes (`recentOrders`).
  - Frontend: `DashboardService` y `DashboardComponent` 100% reactivos con Signals enlazados a la API.
- **Entregables:** Módulo backend `modules/dashboard/`, tests `DashboardControllerTest.java`, modelo `dashboard.model.ts`, servicio `dashboard.service.ts` y componente `features/dashboard/dashboard.component.ts`.
- **Criterios de aceptación:** El panel refleja en tiempo real las cifras reales de la base de datos sin datos hardcodeados y actualiza automáticamente los contadores.
- **Verificación:** `DashboardControllerTest.java` (3 pruebas pasando con éxito), compilación `ng build` sin errores.
- **Estado actual:** **COMPLETADA**.

---

### FASE 15: Responsive + UX (Modo Oscuro y Móvil)
- **Objetivo:** Pulir la experiencia de usuario multidispositivo, optimizar navegación en tablets y smartphones de taller, e incorporar selector de tema (Modo Oscuro).
- **Funcionalidades necesarias:**
  - Menú lateral (Sidebar) colapsable en drawer para pantallas móviles (`< 768px`).
  - Tablas con scroll horizontal optimizado o visualización en tarjetas compactas en móvil.
  - Soporte de tema visual (Dark Theme / Light Theme) mediante variables CSS.
  - Accesibilidad de teclado y contraste de color accesible (WCAG AA).
- **Entregables:** Hoja de estilos `theme-dark.scss`, directiva de cambio de tema, adaptaciones en modales.
- **Criterios de aceptación:** Usabilidad táctil en tablets utilizadas por mecánicos a pie de elevador.
- **Verificación:** Pruebas con emulador responsive de Chrome DevTools en diversas resoluciones.
- **Estado actual:** **PARCIAL** (El diseño actual cuenta con media queries y diseño limpio, pero carece de modo oscuro y menú móvil colapsable).

---

### FASE 16: Testing (Cobertura Global)
- **Objetivo:** Consolidar una suite de pruebas exhaustiva que cubra tanto el backend como el frontend, asegurando 0 regresiones ante futuros cambios.
- **Funcionalidades necesarias:**
  - Backend: Mantener el 100% de éxito en los tests de integración actuales (57 tests JUnit 5) y añadir tests unitarios con Mockito para servicios complejos.
  - Frontend: Configurar y ejecutar pruebas unitarias con Jasmine/Karma para componentes, servicios con Signals e interceptores.
  - Pruebas E2E (opcional): Cypress o Playwright para flujos críticos (Login ➔ Crear Orden ➔ Presupuesto ➔ Aprobación).
- **Entregables:** Informes de cobertura Surefire y Karma coverage (`lcov`).
- **Criterios de aceptación:** Cobertura de backend superior al 80% en servicios y 0 tests fallidos.
- **Verificación:** Ejecución de `mvn test` y `npm test`.
- **Estado actual:** **PARCIAL** (Backend: 57 tests de integración pasando al 100%; Frontend: sin tests unitarios activos en Karma).

---

### FASE 17: Docker (Contenedorización Full Stack)
- **Objetivo:** Contenedorizar toda la solución mediante Docker Compose para levantar en un solo comando el backend, el frontend y la base de datos.
- **Funcionalidades necesarias:**
  - `backend/Dockerfile`: Multi-stage build con Maven y Eclipse Temurin 17 JRE Alpine.
  - `frontend/Dockerfile`: Multi-stage build con Node.js 20 para compilar Angular y Nginx Alpine para servir la SPA y proxy inverso hacia el backend.
  - `docker-compose.yml`: Orquestación de servicios `paddock-postgres`, `paddock-api` y `paddock-web`, con variables de entorno, redes internas y healthchecks.
- **Entregables:** Dockerfiles, configuración Nginx, `docker-compose.prod.yml`.
- **Criterios de aceptación:** `docker compose up --build` levanta todo el sistema en local sin necesidad de instalar Java, Node ni PostgreSQL en la máquina anfitriona.
- **Verificación:** Ejecución limpia en entorno Docker limpio.
- **Estado actual:** **PARCIAL** (Actualmente `docker-compose.yml` solo orquesta PostgreSQL `paddock-postgres`).

---

### FASE 18: Deploy (Producción)
- **Objetivo:** Preparar la aplicación para su despliegue continuo en entornos de nube (VPS, Railway, Render, AWS o GCP).
- **Funcionalidades necesarias:**
  - Perfil `application-prod.yml` con configuración segura (sin credenciales por defecto, pool HikariCP dimensionado, logs formateados).
  - Configuración de certificados SSL/TLS y cabeceras de seguridad HTTP (HSTS, CSP).
  - Pipeline de CI/CD mediante GitHub Actions (build, test, push de imágenes Docker a registro).
- **Entregables:** Workflow `.github/workflows/ci.yml`, perfil `application-prod.yml`.
- **Criterios de aceptación:** Despliegue automático ante push a `main` y acceso HTTPS seguro.
- **Verificación:** Despliegue de prueba en servidor en la nube.
- **Estado actual:** **PENDIENTE**.

---

### FASE 19: Documentación y Portfolio Final
- **Objetivo:** Finalizar la documentación técnica, manual de usuario y presentación profesional del proyecto para portfolio.
- **Funcionalidades necesarias:**
  - Documentos de contexto completos: `AGENTS.md`, `ROADMAP.md` y `ARCHITECTURE.md`.
  - Manual de instalación y guía de uso para roles de taller.
  - Capturas de pantalla profesionales y diagramas de flujo para el `README.md`.
  - Licencia de código abierto y atribución de autor.
- **Entregables:** Documentación en raíz del repositorio y manuales complementarios.
- **Criterios de aceptación:** Cualquier desarrollador o reclutador puede clonar, entender, ejecutar y evaluar el proyecto en menos de 10 minutos.
- **Verificación:** Revisión integral de documentación y enlaces.
- **Estado actual:** **EN DESARROLLO / PARCIAL** (`README.md` exhaustivo creado; `AGENTS.md`, `ROADMAP.md` y `ARCHITECTURE.md` en elaboración).

---

## 🚀 3. Próximo Paso Inmediato

El siguiente hito obligatorio en el desarrollo de Paddock Manager es la **FASE 15: Responsive + UX (Modo Oscuro y Móvil)**, que comprende:
1. Optimizar el menú lateral (`SidebarComponent`) con soporte para drawer colapsable en dispositivos móviles (`< 768px`).
2. Implementar selector de tema (Modo Oscuro / Modo Claro) persistente mediante CSS custom properties y `localStorage`.
3. Mejorar la visualización responsiva de tablas de datos complejas en pantallas reducidas.
4. Pulir la accesibilidad de contrastes de color según los estándares WCAG AA.
