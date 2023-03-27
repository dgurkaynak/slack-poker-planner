FROM node:16.17.0-alpine3.16
MAINTAINER Deniz Gurkaynak <dgurkaynak@gmail.com>

WORKDIR /app
ADD . .

RUN npm ci
RUN npm run build

ENV NODE_ENV production

CMD ["node", "dist/slack-poker-planner.js"]
