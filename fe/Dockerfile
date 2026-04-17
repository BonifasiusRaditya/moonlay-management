# ===== Stage 1: Build Vite app =====
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build arguments for environment variables
# Add ARG declarations for each environment variable you need
# Example: ARG VITE_API_URL
# You can add more ARGs as needed for your .env variables
ARG VITE_API_URL
ARG VITE_APP_TITLE
# Add more ARGs here for other environment variables

# Set environment variables from build args
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_TITLE=${VITE_APP_TITLE}
# Add more ENV declarations here matching your ARGs

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ===== Stage 2: Serve using Nginx =====
FROM nginx:1.25-alpine

USER root

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# Create custom temp directory
RUN mkdir -p /tmp/nginx_temp

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]