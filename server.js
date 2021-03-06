'use strict';
require('dotenv').config();
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session= require('express-session');
const passport = require ('passport');
const myDB = require('./connection');

const passportSocketIo = require('passport.socketio');
const cookieParser= require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


const auth = require('./auth.js');
const routes = require('./routes.js');
const { emit } = require('process');

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret: process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeSuccess,
    fail: onAuthorizeFail
  })
);



fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized:true,
  cookie: {
    maxAge: 1000*60*60*24
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// passport.serializeUser((user,done)=>{
//   done(null, user._id);
// });

// passport.deserializeUser((id,done)=>{
//   myDB.findOne({_id: new ObjectId(id)},(err,doc)=>{
//     done(null,null);
//   });
// });


app.set('view engine', 'pug');
// app.route('/').get((req, res) => {
//   res.render(process.cwd()+'/views/pug/index',{
//     title: 'Hello',
//     message: 'Please login'
//   });
// });

myDB(async client=>{
  const myDataBase = await client.db('advancednode').collection('users');
  routes(app,myDataBase);
  auth(app,myDataBase);

  let currentUsers = 0;
  io.on('connection', socket => {
    console.log('user ' + socket.request.user.name + ' connected');
    currentUsers ++;
    io.emit('user', {
      name: socket.request.user.name,
      currentUsers,
      connected: true
    });
    console.log('A user has connected');
    socket.on('chat message', message=>{
      io.emit('chat message', {
        name: socket.request.user.name,
        message
      });
    });
    
    socket.on('disconnect', ()=>{
      --currentUsers;
      io.emit('user', {
        name: socket.request.user.name,
        currentUsers,
        connected: false
      });
    })
  });

}).catch(e=>{
  app.route('/').get((req,res)=>{
    res.render(process.cwd()+'/views/pug/index',{
      title:'e',
      message: 'Unable to login'
    });
  });
});





const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
