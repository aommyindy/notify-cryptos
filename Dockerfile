FROM node:14-alpine

WORKDIR /app
COPY package*.json ./yarn.lock ./

RUN yarn
COPY . .
RUN yarn build

USER node
CMD ["node", "dist/index.js"]