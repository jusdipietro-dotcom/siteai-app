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

# Las NEXT_PUBLIC_* se inlinean en el bundle DURANTE el build: definirlas como
# variables de entorno del contenedor en runtime NO tiene ningún efecto. Por eso
# entran como build args. Cambiar cualquiera de estas exige rebuild de la imagen.
# Los defaults replican EXACTAMENTE los fallbacks del código (lib/site-domain.ts,
# lib/email.ts). No dejarlos vacíos: NEXT_PUBLIC_APP_URL se lee con `??`, así que
# un string vacío ganaría sobre el fallback del código y rompería las back_urls
# de MercadoPago.
ARG NEXT_PUBLIC_APP_URL=https://automaticialab.com
ARG NEXT_PUBLIC_SITES_DOMAIN=sites.automaticialab.com
ARG NEXT_PUBLIC_SITES_SUBDOMAIN_BASE=sitios.automaticialab.com
ARG NEXT_PUBLIC_FLASK_URL=https://facturacion.automaticialab.com
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SITES_DOMAIN=$NEXT_PUBLIC_SITES_DOMAIN
ENV NEXT_PUBLIC_SITES_SUBDOMAIN_BASE=$NEXT_PUBLIC_SITES_SUBDOMAIN_BASE
ENV NEXT_PUBLIC_FLASK_URL=$NEXT_PUBLIC_FLASK_URL

# Build de Next.js (no corre migraciones — se hace en runtime).
# BUILD_STANDALONE activa `output: 'standalone'` en next.config.js, que emite
# .next/standalone/server.js con solo las dependencias realmente usadas.
ENV NEXT_TELEMETRY_DISABLED=1
ENV BUILD_STANDALONE=true
RUN npx next build

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# OpenSSL requerido por Prisma en Alpine
RUN apk add --no-cache openssl

# Usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Bundle standalone: server.js + node_modules ya tree-shakeados por Next.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Assets que Next NO incluye en el standalone y hay que copiar a mano.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma: el schema + las migraciones son necesarios para `migrate deploy`,
# y el CLI no viaja en el bundle standalone (Next solo traza el runtime).
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# sharp: optimización de imágenes de Next en producción. Se copia desde el
# builder (misma base alpine) en vez de `npm install` — un install dentro de
# /app borraría como "extraneous" los node_modules trazados del standalone.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Aplica SOLO las migraciones versionadas y arranca el server standalone.
#
# `migrate deploy` (no `db push --accept-data-loss`): nunca dropea columnas ni
# tablas, aplica el historial de prisma/migrations en orden y falla si detecta
# drift. El `&&` es deliberado — si la migración falla el contenedor NO levanta,
# en vez de servir tráfico contra un schema inconsistente.
#
# ⚠️ Una DB que ya tiene registrados los nombres VIEJOS de las migraciones
# renombradas en 46ea8b5 debe reconciliarse ANTES del primer deploy con este
# CMD. Ver docs/deploy/prisma-migration-reconciliation.md
CMD ["sh", "-c", "node_modules/prisma/build/index.js migrate deploy && node server.js"]
