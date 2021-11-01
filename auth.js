const passport = require('passport');
const LocalStrategy = require('passport-local');
const ObjectId= require('mongodb').ObjectId;
const bcrypt = require('bcrypt');
const myDB = require('./connection');
const GitHubStrategy = require('passport-github').Strategy;
module.exports = function (app, myDataBase) {
    passport.serializeUser((user,done)=>{
        done(null, user._id);
      });
      
      passport.deserializeUser((id,done)=>{
        myDataBase.findOne({_id: new ObjectId(id)},(err,doc)=>{
          done(null,doc);
        });
      });
    
      
      passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: https://advanced-node-and-express.sereysopea-ung.repl.co/auth/github/callback
      },
        function(accessToken, refreshToken, profile, cb) {
          console.log(profile);
          //Database logic here with callback containing our user object
        }
      ));
    
      passport.use(new LocalStrategy(
        function(username, password, done) {
          myDataBase.findOne({ username: username }, function (err, user) {
            console.log('User '+ username +' attempted to log in.');
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
            if (!bcrypt.compareSync(password, user.password)) { 
              return done(null, false);
            }
            return done(null, user);
          });
        }
      ));
}