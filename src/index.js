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

    let target_index = users.findIndex(
      client => client.hash == data.target_hash
    )

    let source_index = users.findIndex(
      client => client.hash == data.source_hash
    )

    if (target_index != -1) {

      io.to(users[target_index].socketId).emit('alert', data.source_hash + ' sent ' + data.value + ' to you ')
      io.to(users[source_index].socketId).emit('alert', ' You sent ' + data.value + ' to ' + users[target_index].hash)
      
      console.log(data.source_hash + ' sent ' + data.value + ' to ' + users[target_index].hash);
    }
    else{
      io.to(users[source_index].socketId).emit('alert', 'Client not found')
      
      console.log('Client not found');
    }

  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});