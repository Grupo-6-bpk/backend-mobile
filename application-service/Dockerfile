FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4040

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "swagger:watch"]