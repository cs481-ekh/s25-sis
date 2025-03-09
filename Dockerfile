# Use an official lightweight Node.js image
FROM node:20-alpine

# Create a working directory for the whole project
WORKDIR /eis-tracker

# Copy package.json and package-lock.json first for caching dependencies
COPY eis-tracker/package*.json ./

# Copy the Next.js app into the container (it will end up at /eis-tracker/app)
COPY eis-tracker/app ./app

# Copy the database directory so that relative paths (from the app) remain valid
COPY eis-tracker/database ./database

# Change working directory to the app folder
# WORKDIR /eis-tracker/app

# Install dependencies and build the Next.js app
RUN npm install
RUN npm run build

# Expose the port your Next.js app uses (typically 3000)
EXPOSE 3000

CMD ["npm", "run", "dev"]