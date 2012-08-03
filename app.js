#!/usr/bin/env node


var connect = require('connect')
    , sharejs = require('share').server
    , exec    = require('child_process').exec
    , jshint = require('jshint');

var server = connect()
      .use(connect.logger('dev'))
      .use(connect.static(__dirname + '/client'));

var options = {db: {type: 'none'}}; // See docs for options. {type: 'redis'} to enable persistance.

try {
  require('redis');
  options.db = {type: 'redis'};
  exec('redis-server &', function(err, stdout, stderr) {
    console.log('stdout:' + stdout);
    console.log('stderr:' + stderr);
    if (error) {
      console.log('exec error:' + error);
    };
  });
} catch (e) {
}

options.auth = function(agent, action) {
  console.log(agent.sessionId);
  console.log(agent.remote);
  action.accept();
};
  

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(server, options);

server.listen(8001);
console.log('Server running at http://127.0.0.1:8001/');
