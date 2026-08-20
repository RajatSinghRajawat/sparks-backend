# ─── Dockerfile for EduSpark Backend API ───
FROM node:20-alpine AS base

# Create app directory
WORKDIR /app

# Install dependencies first (for layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Set default environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start server
CMD ["npm", "start"]
