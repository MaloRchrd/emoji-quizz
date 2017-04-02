
const express = require('express');
const mongo = require('mongodb');
const io = require('socket.io');
var MongoClient = require('mongodb').MongoClient;
const db = require('./db');
var app = express();
const pug = require('pug');
var  questions = require('./question.js');
var moment = require('moment');

var URL = 'mongodb://localhost:27017/players';

// static folder
app.use(express.static('public'));

//init pug for score page
app.set('view engine', 'pug')
app.set('views',__dirname + '/views');

app.get('/',function(req,res){

     res.sendFile(__dirname + '/index.html');

});

// score dashboard
app.get('/score',function (req,res) {
    db.get().collection('players').find({}).toArray(function(error, data) {
      // console.log(data[0]);
      res.render('dashboard', {data: data}); // render  index using pug
    });
  });


app.get('/logincheck/:username',function(req,res){
  console.log('check username : ',req.params.username);
  db.get().collection('players').find({'user.user.username' : req.params.username  }).toArray(function(error, data) {
    console.log(data);
    res.json(data)
  });


});


// setup global variables
var connections = [];
var users = [];
var round = 0
var NumQuestion = getRandomInt(0, 29);
var server;


// get random question
function getRandomInt(min, max) {
min = Math.ceil(min);
max = Math.floor(max);
return Math.floor(Math.random() * (max - min)) + min;
}

// Mongo connect & server start
db.connect(URL, function(err, db) {
  if (err) {
    return;
  }
  });
  server = app.listen(8888,function(){
    console.log('mongodb Started serveur start port 8888');

});

// start socketio server
var ioServer = io(server);


// socket io started
ioServer.on('connection', function (socket) {


  var user = '';
  connections.push(socket);
  console.log('socket connected :'+ connections.length);


  socket.on('disconnect', function() {
    // console.log(socket);
    users.splice(users.indexOf(user),1);
    updateUser();
    connections.splice(connections.indexOf(socket),1);
    console.log('disconect : ' + connections.length + 'user(s)');
  });

  socket.on('new user', function(data) {
    user = { user : data };
    users.push(user);
    console.log(user.user.username);

    db.get().collection('players').find({'user.user.username' : user.user.username  }).toArray(function(error, data) {
      // console.log(data);
      if (data.length == 0) {
        db.get().collection('players').insertOne( { user : user }, function(err, result) {
        console.log("Inserted"+data+" in utilisateurs collection.");
        });
      }else {
        console.log('already in DB');
    }
  });
    updateUser();
  });


  // start Gameplay

  socket.on('start game', function() {

    socket.emit('new question', { emoji: questions[NumQuestion].emoji })

  });

  // recieve message and check answer
  socket.on('send message', function (data) {
    // console.log(data);
    if (data.message.toLowerCase() == questions[NumQuestion].reponse.toLowerCase()) {
      user.user.score = user.user.score + 1
      users.splice(users.indexOf(user),1);
      // console.log(user);
      users.push(user);
      updateUser();
      // send good reply
      socket.broadcast.emit('good reply',
      {
        message: data.message,
        user: data.user,
        reponse : questions[NumQuestion].reponse
      });
      socket.emit('bravo',
      {
        message: data.message,
        user: data.user,
        reponse : questions[NumQuestion].reponse
      });

    }
    // Envoi d'une réponse fausse dans le chat.
    socket.broadcast.emit('new message', {message: data.message,
    user: data.user });

  });
  // next question in Gameplay
  // 10 questions --> finish game
  socket.on('next question', function() {
    if (round < 10) {
      NumQuestion = getRandomInt(0, 29) ;
        round = round+1;
        // console.log(round);
        ioServer.emit('new question', { emoji: questions[NumQuestion].emoji })
    }else {
      console.log('fin de partie.');
      // save score in Database.
      users.forEach(function(element) {
        // console.log(element.user.username);

        db.get().collection('players').find({'user.user.username' : element.user.username  }).toArray(function(error, data) {
          // console.log(data[0].user.user.score);
          if (data[0].user.user.score < element.user.score) {
            console.log('update best score');
            db.get().collection('players').updateOne(
              {'user.user.username' : element.user.username},
                {$set: {'user.user.score': element.user.score }}
              );

        }

      });
    ioServer.emit('end game', {result : users})
  });
  }
  });

  // restart game reset socres
  socket.on('restart', function() {
    round = 0
    // console.log(users);
    users.forEach(function(element) {
      // console.log('yo ' +element);
      element.user.score = 0
    });
    updateUser();
  });





  // update Users list
  var updateUser = function () {
    ioServer.emit('get users',users);
  };

});
