FROM node:18-alpine3.20

LABEL maintainer="Deniz Gurkaynak <dgurkaynak@gmail.com>"

WORKDIR /app
ADD . .

RUN npm ci
RUN npm run build

ENV NODE_ENV=production

CMD ["node", "dist/slack-poker-planner.js"]
