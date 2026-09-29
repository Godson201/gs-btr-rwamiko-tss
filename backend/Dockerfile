FROM node:24-alpine AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
# The current mailer dependency graph is not reproducible with `npm ci`
# across npm versions, so resolve it from the committed manifest during build.
RUN npm install --no-audit --no-fund

FROM dependencies AS build
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
RUN mkdir -p uploads
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && npm run seed && node dist/main.js"]
