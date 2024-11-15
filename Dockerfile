FROM node:18.20.4-alpine3.19
MAINTAINER Deniz Gurkaynak <dgurkaynak@gmail.com>

WORKDIR /app
ADD . .

RUN npm ci
RUN npm run build

ENV NODE_ENV production

CMD ["node", "dist/slack-poker-planner.js"]
