FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Install all deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/extension/package.json apps/extension/
COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/
RUN pnpm install --frozen-lockfile

# Copy source & build frontend
COPY . .
RUN npx turbo run build --filter=@taskflow/shared --filter=@taskflow/web

# ── Production ──
FROM node:20-alpine
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app

# Copy everything needed
COPY --from=base /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api apps/api
COPY --from=base /app/apps/web/dist apps/web/dist
COPY --from=base /app/packages packages

# Install tsx globally for running TS directly
RUN npm i -g tsx

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

WORKDIR /app/apps/api
CMD ["tsx", "src/index.ts"]
