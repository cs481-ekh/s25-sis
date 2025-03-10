FROM node:20-alpine

# Create a working directory for the whole project
WORKDIR /eis-tracker

# Copy package.json and package-lock.json
COPY eis-tracker/package*.json ./

# Copy the Next.js app into the container
COPY eis-tracker/app ./app
COPY eis-tracker/public ./public
COPY eis-tracker/database ./database

# Install dependencies and build the Next.js app
RUN npm install
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev"]