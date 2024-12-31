# Use a node image for the backend
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose the port for the Node.js app
EXPOSE 5000

# Start the backend server
CMD ["node", "app.js"]