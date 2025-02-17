FROM node:18-alpine

WORKDIR /app

COPY eis-tracker/package*.json ./

RUN npm install

# Copy the rest of the application
COPY eis-tracker .

# Expose the Next.js default port
EXPOSE 3000

CMD ["npm", "run", "dev"]