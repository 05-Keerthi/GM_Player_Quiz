# Use Node.js as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application to the container
COPY . .

# Expose the port used by the backend
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
