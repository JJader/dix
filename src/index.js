const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let users = []


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('registration', (hash) => {
    
    let client = {
      hash:hash,
      clientIp:socket.handshake.address,
      socketId:socket.id
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
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});