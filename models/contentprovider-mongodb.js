var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var config = require('../config');

var CM = {};

CM.db = new Db(config.dbName, new Server(config.dbHost, config.dbPort, {auto_reconnect: true}, {}));
CM.db.open(function(e, d){
  if (e) {
    console.log(e);
  } else{
    console.log('connected to database :: ' + config.dbName);
  }
});
CM.content = CM.db.collection('contents');

module.exports = CM;

CM.findByshareJSId = function(shareJSId, callback) {
  CM.content.findOne({shareJSId: shareJSId}, function(error, result) {
    if( error ) callback(error)
    else callback(null, result)
  });
};


CM.save = function(data, callback) {
  CM.content.findOne({shareJSId: data.shareJSId}, function(e, r){
    if (r) {
      callback('shareJSId-taken');
    } else {
      CM.content.insert({shareJSId: data.shareJSId, content: data.content, timestamp: data.timestamp}, callback(null));
    }
  });
};