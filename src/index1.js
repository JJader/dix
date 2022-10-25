const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const mongoose = require('mongoose');
const Msg = require('./models/messages');
// const io = require('socket.io')(3000)
const mongoDB = 'mongodb+srv://thiagosfig:thiago@cluster0.qyxlss0.mongodb.net/?retryWrites=true&w=majority';

mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log('connected')
}).catch(err => console.log(err))

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


const handler = num => (req,res)=>{
	const { method, url, headers, body } = req;
  res.sendFile(__dirname + '/transaction.html');
}

app.get('*', handler(1)).post('*', handler(1));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/transaction.html');
});

io.on('connection', (socket) => {

  Msg.find().then(result => {
    socket.emit('output-messages', result)
  })

  socket.on('chatmessage', msg => {
    const message = new Msg({ msg });
    message.save().then(() => {
      io.emit('message', msg)
    })

    console.log("deu tudo certo")
  });

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
      io.to(users[source_index].socketId).emit('alert', 'Invalid transaction !!!')

      console.log('Invalid transaction !!!');
      console.log('-------------------------------------------------\n')
    }

  });
});



server.listen(3000, () => {
  console.log('listening on *:3001');
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