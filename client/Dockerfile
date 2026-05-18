# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

# Install all dependencies
RUN npm install

# Copy source
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/ngonx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]