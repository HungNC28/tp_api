FROM node:18-slim
RUN npm i -g typescript
WORKDIR /app
COPY . /app
RUN npm i
RUN npm run build
CMD ["node", "./dist"]