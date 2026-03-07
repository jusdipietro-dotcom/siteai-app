# ─── Stage 1: Instalar dependencias ──────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Genera el Prisma client para Linux (rhel-openssl-3.0.x ya está en binaryTargets)
RUN npx prisma generate

# Build de Next.js (no corre migraciones — se hace en runtime)
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Solo dependencias de producción
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

# Copiar el Prisma client compilado para Linux desde el builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copiar el build de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Migra la DB y arranca el server
CMD ["sh", "-c", "node_modules/.bin/prisma db push --accept-data-loss && node_modules/.bin/next start -p 3000 -H 0.0.0.0"]
