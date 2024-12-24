# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files and install dependencies including tsx
COPY package*.json ./
RUN npm install
RUN npm install -g tsx

# Copy source files and built frontend
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/tsconfig.json ./
COPY --from=build /app/node_modules ./node_modules

# Expose port
EXPOSE 5000

# Start the server using tsx
CMD ["tsx", "src/server/server.ts"]
