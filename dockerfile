# Use a node image for the frontend
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy the source code
COPY . .

# Build the React application
RUN npm run build

# Expose the port for the React app
EXPOSE 3000

# Start the React application
CMD ["npm", "start"]
