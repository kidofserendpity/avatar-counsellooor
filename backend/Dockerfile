FROM node:20-slim

RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*
RUN ln -s /usr/bin/python3 /usr/bin/python

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY requirements.txt ./
RUN pip3 install --break-system-packages -r requirements.txt

COPY . .

RUN mkdir -p public/audio uploads

EXPOSE 5000
CMD ["node", "server.js"]