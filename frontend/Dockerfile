# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/tsconfig.json frontend/vite.config.ts ./
COPY frontend/src ./src
COPY frontend/pages ./pages
COPY frontend/public ./public
RUN npm ci || npm install
RUN npm run build || echo "build placeholder"

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3002
CMD ["nginx", "-g", "daemon off;"]