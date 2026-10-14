# Build context: projects/silverbridge-backend (the CDK stack sets this).
# Local:  docker build -f reference-impl/Dockerfile -t sb-proof .   (run from projects/silverbridge-backend)
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /certs \
    && curl -fsSL https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem -o /certs/rds.pem
WORKDIR /app
COPY design-package/02_SQL ./design-package/02_SQL
COPY reference-impl/package.json reference-impl/package-lock.json ./reference-impl/
WORKDIR /app/reference-impl
RUN npm ci --no-audit --no-fund
COPY reference-impl/ ./
# Loads the unchanged design schema + hardening migration into a SCRATCH database, then runs the tests.
CMD ["bash", "-c", "npm run db:setup && npm test"]
