const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let users = []

app.get('/', (req, res) => {
  res.send('<h1>Bem vindo ao sistema dix</h1>');
});

app.get('/registration', (req, res) => {
  res.sendFile(__dirname + '/registration.html');
});

io.on('connection', (socket) => {
  socket.on('registration', (hash) => {

    let client = {
      hash: hash,
      clientIp: socket.handshake.address,
      socketId: socket.id,
      money: 100
    };

    users.push(client)
    console.log(client.hash + ' connected');
    console.log(client.socketId + ' connected');
    console.log(client.clientIp + ' connected');
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

io.on('connection', (socket) => {
  socket.on('send', (data) => {

    let target_client = users.find(
      client => client.hash == data.target_hash
    )

    if (target_client) {
      io.to(target_client.socketId).emit('send', data)
    }

    console.log('message: ' + target_client.hash);

  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});