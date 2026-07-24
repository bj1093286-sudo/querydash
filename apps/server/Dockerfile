FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages ./packages
COPY apps/server ./apps/server
RUN pnpm install --frozen-lockfile

FROM deps AS build
RUN pnpm --filter @querydash/types build \
 && pnpm --filter @querydash/query-engine build \
 && pnpm --filter @querydash/server build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/server
EXPOSE 8000
CMD ["node", "dist/index.js"]
