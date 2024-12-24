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

# Build both frontend and backend
RUN npm run build
RUN npx tsc

# Production stage
FROM node:18-alpine as production

WORKDIR /app

# Install production dependencies
RUN apk add --no-cache python3 make g++

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5000

# Start the server using Node.js
CMD ["node", "dist/server/server.js"]
