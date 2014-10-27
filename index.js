/* port declaration */
var port= 5000;

var express = require('express');
var app = express();

/* changed.Server to .createServer */
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var redis = require('redis');
    client = redis.createClient();

    /* Listen to port */
console.log("listening on port " + port);
server.listen(port);


client.on("error", function (err) {
    console.log("Error " + err);
});

client.set("app name", "simple chat", redis.print);

/* looks for request and response from the html (added _dirname because of multiple users) */
app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

/* looks for the style sheet */
app.use("/style.css", express.static(__dirname + '/style.css'));

//this is where is gets interesting

var usernames = {};
 
io.sockets.on('connection', function (socket) {
    client.get('app name', function(err, reply) {
        console.log('app name is', reply);
    });
    //last chat is taken from below and logged to console. it emits message to client
    client.get('last chat', function(err, reply){
        console.log('last chat', reply);
        socket.emit('history', reply);
    });
    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.emit('updatechat', socket.username, data);
        //chat data is set in redis database as last chat
        client.set('last chat', data);
    });
 
    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username){
        // we store the username in the socket session for this client
        socket.username = username;
        // add the client's username to the global list
        usernames[username] = username;
        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'You have entered the chat room!');
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('updatechat', 'SERVER', username + ' has entered the chat room!');
        // update the list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
    });
 
    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has left the chat room!');
    });
});



