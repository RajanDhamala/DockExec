FROM node:20-alpine as development

WORKDIR /app
COPY package*.json .
RUN npm install 
RUN npx prisma generate
CMD ["npm","run","dev"] 
EXPOSE 8000

FROM node:20-alpine as production
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npx prisma generate
CMD ["npm","start"] 
EXPOSE 8000



