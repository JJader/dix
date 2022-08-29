const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const crypto = require('crypto');

hash = crypto.getHashes();
let users = []

app.get('/', (req, res) => {
  res.send('<h1>Bem vindo ao sistema dix</h1>');
});

app.get('/registration', (req, res) => {
  res.sendFile(__dirname + '/registration.html');
});

io.on('connection', (socket) => {
  socket.on('registration', (hash) => {

    // hash = hash + Math.random().toString(5).substring(1)
    // let hashPwd = crypto.createHash('sha1').update(hash).digest('hex');

    let client = {
      hash: hash,
      clientIp: socket.handshake.address,
      socketId: socket.id,
      money: 100
    };

    // io.to(client.socketId).emit('update_hash', client.hash)

    users.push(client)
    console.log(client.hash + ' connected');
    console.log(client.socketId + ' connected');
    console.log(client.clientIp + ' connected');
  });

  socket.on('disconnect', () => {
    let index = users.findIndex(
      client => client.socketId == socket.id
    )

    users.splice(index, 1)

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

      users[target_index].money = users[target_index].money + data.value
      users[source_index].money = users[source_index].money - data.value

      io.to(users[target_index].socketId).emit('alert', data.source_hash + ' sent ' + data.value + ' to you ')
      io.to(users[source_index].socketId).emit('alert', ' You sent ' + data.value + ' to ' + users[target_index].hash)

      io.to(users[target_index].socketId).emit('update_value', users[target_index].money)
      io.to(users[source_index].socketId).emit('update_value', users[source_index].money)

      console.log(data.source_hash + ' sent ' + data.value + ' to ' + users[target_index].hash);
      console.log('target money ' + users[target_index].money);
      console.log('source money ' + users[source_index].money);
    }
    else {
      io.to(users[source_index].socketId).emit('alert', 'Client not found')

      console.log('Client not found');
    }

  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

/*

[x] Tratar o disconnect
[] Cada par deve ter um id gerado por uma hash
[] cada hash deve ser atualizada a cada período
[] Tem que ser hash -> ip 
[] Transação registrada em log


*/