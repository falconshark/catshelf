FROM node:22-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./

# ---- dev: next dev with source mounted from host ----
FROM base AS dev
RUN yarn install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["yarn", "dev", "-H", "0.0.0.0"]

# ---- build ----
FROM base AS build
RUN yarn install --frozen-lockfile
COPY . .
# NEXT_PUBLIC_* is inlined into the browser bundle at build time
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN yarn build

# ---- prod ----
FROM base AS prod
ENV NODE_ENV=production
RUN yarn install --frozen-lockfile --production && yarn cache clean
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.ts ./
USER node
EXPOSE 3000
CMD ["yarn", "start"]
