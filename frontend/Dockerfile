# Stage 1: Build Angular app
FROM node:20-alpine AS build

ARG BACKEND_API_URL=https://your-backend.up.railway.app/api

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Substitute the placeholder with the actual URL
RUN sed -i "s|BACKEND_API_URL_PLACEHOLDER|${BACKEND_API_URL}|g" src/environments/environment.prod.ts

RUN npm run build -- --configuration=production

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
