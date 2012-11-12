#!/usr/bin/env node

var express = require('express')
  , sharejs = require('share').server
  , exec = require('child_process').exec
  , ProjectProvider = require(__dirname + '/models/projectprovider-mongodb').ProjectProvider
  , chatServer = require('./lib/now-service.js');

var app = express();

app.configure(function() {  
  app.set('views', __dirname + '/views');
  app.set('prject', __dirname + '/views/project');
  app.set('prject', __dirname + '/views/account');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());          
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'osu-hci-collabcoding' }));
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({
    src: __dirname + '/public',
    compress: true
  }));
  app.use(express.static(__dirname + '/public'));
});
   
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

require('./routes/index')(app)

var options = {db: {type: 'none'}}; // See docs for options. {type: 'redis'} to enable persistance.

// try {
//   require('redis');
//   options.db = {type: 'redis'};
//   exec('redis-server &', function(err, stdout, stderr) {
//     console.log('stdout:' + stdout);
//     console.log('stderr:' + stderr);
//     if (error) {
//       console.log('exec error:' + error);
//     }
//   });
// } catch (e) {
//   
// }

  options.db = {type: 'mongo'};
options.auth = function(agent, action) {
  console.log(agent.sessionId);
  console.log(agent.remote);
  action.accept();
};

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(app, options);
var server;
exec('mongod &', function(err, stdout, stderr) {
  server = app.listen(8001);
  console.log('Server running at http://127.0.0.1:8001/');
  chatServer.start(server);
});


