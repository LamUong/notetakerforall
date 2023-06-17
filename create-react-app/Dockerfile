# pull official base image
FROM node:13.12.0-alpine

# set working directory
WORKDIR /create-react-app

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent

# add app
COPY . /create-react-app

EXPOSE 3000 

# start app
CMD ["npm", "start"]

