FROM node:0.12-slim
MAINTAINER Matt Dobson

ADD     . /
WORKDIR /
RUN     npm install

CMD        ["index"]
ENTRYPOINT ["node"]
