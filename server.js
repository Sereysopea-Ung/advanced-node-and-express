'use strict';
require('dotenv').config();
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session= require('express-session');
const passport = require ('passport');
const myDB = require('./connection');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);


const auth = require('./auth.js');
const routes = require('./routes.js');


fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized:true
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
  io.on('connection', socket => {
    console.log('A user has connected');
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
