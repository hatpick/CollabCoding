#!/usr/bin/env node

var express = require('express')
  , routes = require('./routes')  
  , sharejs = require('share').server
  , http = require('http')
  , path = require('path')
  , exec = require('child_process').exec;

var app = express();

app.configure(function() {  
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');     
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});
           

app.get('/', routes.index);   
app.get('/login', routes.login);

var options = {db: {type: 'none'}}; // See docs for options. {type: 'redis'} to enable persistance.

try {
  require('redis');
  options.db = {type: 'redis'};
  exec('redis-server &', function(err, stdout, stderr) {
    console.log('stdout:' + stdout);
    console.log('stderr:' + stderr);
    if (error) {
      console.log('exec error:' + error);
    }
  });
} catch (e) {
}

options.auth = function(agent, action) {
  console.log(agent.sessionId);
  console.log(agent.remote);
  action.accept();
};
  

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(app, options);

app.listen(8001);
console.log('Server running at http://127.0.0.1:8001/');
