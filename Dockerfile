FROM node:26.13.0-alpine

LABEL maintainer="Deniz Gurkaynak <dgurkaynak@gmail.com>"

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production

CMD ["node", "src/slack-poker-planner.ts"]
