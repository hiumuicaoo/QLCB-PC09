# Stage 1: Build Phase
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy the entire source code
COPY . .

# Run build to generate dist/ and dist/server.cjs
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine

WORKDIR /app

# Set environment variable defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data

# Copy built artifacts and compiled server from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies to keep the image minimal
RUN npm ci --only=production

# Expose port 3000
EXPOSE 3000

# Start the bundled Express backend
CMD ["node", "dist/server.cjs"]
