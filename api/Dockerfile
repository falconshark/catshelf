FROM node:22-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./

# ---- dev: nodemon with source mounted from host ----
FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--legacy-watch"]

# ---- prod ----
FROM base AS prod
ENV NODE_ENV=production
RUN npm install --omit=dev
COPY . .
RUN mkdir -p epub && chown -R node:node /app
USER node
EXPOSE 8000
CMD ["node", "index.js"]
