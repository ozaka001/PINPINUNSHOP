# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Install node-gyp globally
RUN npm install -g node-gyp

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
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Install node-gyp globally
RUN npm install -g node-gyp

# Copy package files and built files
COPY package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Expose port
EXPOSE 5000

# Start the server using Node.js
CMD ["node", "dist/server/server.js"]
