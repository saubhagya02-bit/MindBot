FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

RUN mkdir -p data

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD wget -q0- http://localhost:5000/api/health || exit 1

# Start server
CMD ["node", "index.js"]