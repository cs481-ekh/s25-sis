FROM node:18-alpine

RUN mkdir -p /app

COPY eis-tracker/package*.json ./
RUN ls -l /app/

RUN npm install --prefix /app

# Copy the rest of the application
COPY eis-tracker/app /app/

# Expose the Next.js default port
EXPOSE 3000

CMD ["npm", "run", "dev"]