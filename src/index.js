const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const crypto = require('crypto');

let users = []

function update_hash() {
  users.forEach((client, index) => {

    let hashPwd = crypto.createHash('sha1').update(client.hash).digest('hex');
    users[index].hash = hashPwd
    io.to(client.socketId).emit('update_hash', hashPwd)

  })
}

setInterval(update_hash, 60000);

function get_server_hora() {
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    return time;
}

setInterval(get_server_hora, 1000);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/login.html');
});

app.get('/user', (req, res) => {
  res.sendFile(__dirname + '/transaction.html');
});

io.on('connection', (socket) => {
  socket.on('registration', (hash) => {

    let hashPwd = crypto.createHash('sha1').update(hash).digest('hex');

    let client = {
      hash: hashPwd,
      clientIp: socket.handshake.address,
      socketId: socket.id,
      money: 100
    };

    io.to(client.socketId).emit('update_hash', client.hash)

    users.push(client)
    console.log(hash + ' connected in the DIX system');
    console.log('-------------------------------------------------\n')
  });

  socket.on('disconnect', () => {

    let index = users.findIndex(
      client => client.socketId == socket.id
    )

    if (index != -1) {
      console.log("User disconnect " + users[index].hash)
      console.log('-------------------------------------------------\n')
      users.splice(index, 1)
    }

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

    if (
      target_index != -1 &&
      source_index != -1 &&
      target_index != source_index &&
      data.value > 0 &&
      data.value <= users[source_index].money
    ) {

      let server_time = Date.now()

      io.to(users[source_index].socketId).emit('update_hora', server_time)
      io.to(users[target_index].socketId).emit('update_hora', server_time)

      // console.log("Server time: " + get_server_hora())
      // console.log("Client time: " + data.client_time)

      users[target_index].money = users[target_index].money + data.value
      users[source_index].money = users[source_index].money - data.value

      io.to(users[target_index].socketId).emit('alert', data.source_hash + ' sent ' + data.value + ' to you ')
      io.to(users[source_index].socketId).emit('alert', ' You sent ' + data.value + ' to ' + users[target_index].hash)

      io.to(users[target_index].socketId).emit('update_value', users[target_index].money)
      io.to(users[source_index].socketId).emit('update_value', users[source_index].money)

      console.log(data.source_hash + ' sent ' + data.value + ' to ' + users[target_index].hash);
      console.log('-------------------------------------------------\n')
    }
    else {
      console.log('Invalid transaction !!!');
      io.to(users[source_index].socketId).emit('alert', 'Invalid transaction !!!')
      console.log('-------------------------------------------------\n')
    }

  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});

/*

[x] Tratar o disconnect
[x] Cada par deve ter um id gerado por uma hash
[x] cada hash deve ser atualizada a cada período
[x] Tem que ser hash -> ip 
[x] Transação registrada em log
[x] Melhorar log de transação inválida
[x] Melhorar a interface
[x] Tela de login

*/