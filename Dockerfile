# Use Node.js base image
FROM node:22-alpine

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install TypeScript globally
RUN npm install -g typescript

# Copy the rest of the project code
COPY . .

# Build TypeScript files
RUN npm run build

# Specify the port the server runs on
EXPOSE 8080

# Start the server
CMD ["npm", "run", "start"]
