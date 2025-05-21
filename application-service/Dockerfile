FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4040

ENTRYPOINT ["sh", "-c", "npx prisma migrate dev --name initial  && npm run swagger:watch"]