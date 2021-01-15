FROM mhart/alpine-node:12.18.1

MAINTAINER Deniz Gurkaynak <dgurkaynak@gmail.com>

WORKDIR /app
ADD . .

RUN npm i && \
  npm run build && \
  rm -rf node_modules && \
  npm i --production

ENV NODE_ENV production

CMD ["npm", "start"]
