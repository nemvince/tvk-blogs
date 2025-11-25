FROM oven/bun:alpine

# Install git as it is required for the webhook handler
RUN apk add --no-cache git

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build:client

EXPOSE 3000

USER bun

CMD ["bun", "src/index.tsx"]
