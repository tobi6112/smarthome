FROM node:22-alpine AS build
    WORKDIR /app

    COPY package*.json /app/
    RUN npm ci

    COPY . /app/
    RUN npm run compile

FROM node:22-alpine
    WORKDIR /app
    ENV NODE_ENV=production
    EXPOSE 3000

    ENV TZ 'Europe/Berlin'
    RUN apk add --no-cache tzdata
    RUN ln -s /usr/share/zoneinfo/${TZ} /etc/localtime

    COPY package*.json /app/
    RUN npm ci

    COPY --from=build /app/dist /app/dist

    CMD ["node", "dist/app.js"]