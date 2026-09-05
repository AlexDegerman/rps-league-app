FROM node:20-alpine

WORKDIR /app

# Include dev dependencies because tsx runs the TypeScript server directly
COPY package*.json ./
RUN npm ci

COPY . .

# Avoid running the application with root privileges
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 5000
CMD ["npx", "tsx", "src/app.ts"]