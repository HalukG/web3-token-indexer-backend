FROM node:18

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma
COPY . .

RUN yarn generate

CMD ["sh", "-c", "yarn migrate && yarn start"]