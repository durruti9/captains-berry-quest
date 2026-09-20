# El Diario del Capitán — imagen lista para VPS / Easypanel
FROM oven/bun:1.2-alpine AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .
ENV SELF_HOST=1
ENV NODE_ENV=production
RUN bun run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV CAPTAIN_DATA_DIR=/data

COPY --from=build /app/.output ./.output

EXPOSE 3000
VOLUME ["/data"]
# Sin HEALTHCHECK: Easypanel ya vigila el servicio por su puerto y una comprobación
# interna lenta en el primer arranque provocaba reinicios en bucle.
CMD ["node", ".output/server/index.mjs"]
