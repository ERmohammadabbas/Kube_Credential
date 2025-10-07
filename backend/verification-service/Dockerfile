FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create logs and data directories
RUN mkdir -p logs data

# Expose port
EXPOSE 3002

# Start the service
CMD ["npm", "start"]
