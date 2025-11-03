# 1. Use an official Node.js base image (small Alpine version)
FROM node:18-alpine

# 2. Set working directory inside the container
WORKDIR /usr/src/app

# 3. Copy package files and install dependencies
# (Copy only these first for faster build caching)
COPY package*.json ./
RUN npm install --production

# 4. Copy the rest of your application code
COPY . .

# 5. Expose the port your app listens on
EXPOSE 5060

# 6. Define the command to start your app
CMD ["node", "app.js"]
