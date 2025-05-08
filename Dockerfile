FROM node:18-alpine

# Create a working directory for the whole project
# WORKDIR /eis-tracker

# Copy the whole project into the container
COPY eis-tracker/ ./

RUN mkdir -p public/photos && chmod -R 777 public

# Install dependencies and build the Next.js app
RUN npm install

RUN npm rebuild better-sqlite3

EXPOSE 3000

CMD ["npm", "run", "dev"]