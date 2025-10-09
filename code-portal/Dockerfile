FROM node:20-alpine AS development

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
COPY .env .env
CMD [ "npm","run","dev" ]
EXPOSE 5173


FROM node:20-alpine as build
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
COPY .env .env
RUN npm run build
RUN rm -rf .env


FROM nginx:alpine AS production

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD [ "nginx","-g","daemon off;" ]