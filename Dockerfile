FROM node:22-alpine as build-frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine as build-backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --omit=dev
COPY backend/ ./

FROM node:22-alpine
WORKDIR /app
COPY --from=build-backend /app/backend ./backend
COPY --from=build-frontend /app/frontend/dist ./frontend/dist
WORKDIR /app/backend
EXPOSE 3000
CMD ["node", "server.js"]

