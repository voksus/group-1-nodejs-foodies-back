FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

RUN mkdir -p uploads

EXPOSE 3000

CMD ["npm", "start"]