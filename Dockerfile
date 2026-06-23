# ── Stage 1: Build React frontend ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --prefer-offline
COPY frontend/ ./
# No VITE_API_URL — API calls use relative URLs (same origin as the backend)
RUN npm run build

# ── Stage 2: Build Spring Boot backend ────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q
COPY backend/src ./src
# Embed the React dist into Spring Boot's static resources
COPY --from=frontend-build /app/frontend/dist ./src/main/resources/static
RUN mvn package -DskipTests -q

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", \
  "case \"${DATABASE_URL}\" in jdbc:*) ;; *) export DATABASE_URL=\"jdbc:${DATABASE_URL}\" ;; esac; \
   exec java -jar app.jar"]
