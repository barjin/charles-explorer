FROM node:20-alpine

COPY . /app
WORKDIR /app

RUN yarn --immutable
RUN npm run build --workspace="./packages/webapp/"
WORKDIR /app

CMD ["npm", "run", "start", "--workspace=./packages/webapp/"]