FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies from the lockfile only, so the layer caches across source edits.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time settings baked into the bundle.
#   VITE_BASE_PATH  "/" for standalone nginx, "/it_oprema2026/" when mounted under Frappe.
#   VITE_FRAPPE_URL Backend origin used for "Open in Desk" links. Empty keeps the
#                   legacy "<current-host>:8000" fallback.
ARG VITE_BASE_PATH=/
ARG VITE_FRAPPE_URL=
ENV VITE_BASE_PATH=$VITE_BASE_PATH
ENV VITE_FRAPPE_URL=$VITE_FRAPPE_URL

RUN npm run build

FROM nginx:alpine
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
