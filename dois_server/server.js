const express = require('express');
const app1 = express();
const app2 = express();

// Handler method
const handler = num => (req,res)=>{
	const { method, url, headers, body } = req;
	res.sendFile(__dirname + '/client' + num + '.html');
	// res.send("Você está conectado no servidor " + num)
}

// Only handle GET and POST requests
// Receive request and pass to handler method
app1.get('*', handler(1)).post('*', handler(1));
app1.use(express.static(__dirname));
app2.get('*', handler(2)).post('*', handler(2));
app2.use(express.static(__dirname));
// Start server on PORT 3000
app1.listen(3000, err =>{
	err ?
	console.log("Failed to listen on PORT 3000"):
	console.log("Application Server listening on PORT 3000");
});

// Start server on PORT 3001
app2.listen(3001, err =>{
	err ?
	console.log("Failed to listen on PORT 3001"):
	console.log("Application Server listening on PORT 3001");
});
