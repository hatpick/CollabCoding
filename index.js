#!/usr/bin/env node

var connect = require('connect'),
    sharejs = require('share').server;

var server = connect(
      connect.logger(),
      connect.static(__dirname + '/client')
    );

var options = {db: {type: 'none'}}; // See docs for options. {type: 'redis'} to enable persistance.

try {
  require('redis');
  options.db = {type: 'redis'};
} catch (e) {}

// Attach the sharejs REST and Socket.io interfaces to the server
sharejs.attach(server, options);

server.listen(8001);
console.log('Server running at http://127.0.0.1:8001/');