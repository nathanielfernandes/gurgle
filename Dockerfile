FROM node:16

# Create app directory
WORKDIR /app

COPY . .
RUN npm i

# If you are building your code for production
RUN npm ci --only=production

EXPOSE 80
CMD [ "node","server.js" ]