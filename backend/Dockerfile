# ==============================================================================
# Dockerfile Multi-Stage para Backend Spring Boot 3 (Paddock Manager API)
# ==============================================================================

# ── Stage 1: Compilación con Maven y OpenJDK 17 ──
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Pre-descarga de dependencias para acelerar futuras compilaciones (Docker cache)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiado de código fuente y empaquetado del JAR ejecutable
COPY src ./src
RUN mvn clean package -DskipTests -B

# ── Stage 2: Imagen de Ejecución Ligera con JRE 17 Alpine ──
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Crear usuario y grupo de sistema sin privilegios de root para mayor seguridad
RUN addgroup -S paddock && adduser -S paddock -G paddock

# Copiar el archivo JAR generado desde la etapa de compilación
COPY --from=builder /build/target/paddock-manager-api-*.jar app.jar

# Asignar propiedad de los archivos al usuario no root
RUN chown -R paddock:paddock /app

USER paddock

EXPOSE 8080

ENTRYPOINT ["java", "-Xmx384m", "-Xms128m", "-XX:+UseContainerSupport", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
