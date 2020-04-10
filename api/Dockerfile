FROM node:12

WORKDIR /usr/src/app

RUN npm i -g @adonisjs/cli

ADD . .

RUN npm i

EXPOSE 3333

CMD adonis serve --dev
