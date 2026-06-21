FROM node:lts

WORKDIR /app

# Copy package.json and lock file to install dependencies
COPY package*.json ./

RUN npm install

# Note: The code is mounted via volumes in docker-compose for hot-reloading.
# In a production setup, we would COPY . . and run a build step.

EXPOSE 5173