var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var logger = require('../modules/logger');
var contentProvider = undefined;       

logger.debugLevel = 'info';

ContentProvider = function(host, port) { 
  if (process.env.MONGOHQ_URL) { // connect to mongoHQ
    this.db = Db.connect(process.env.MONGOHQ_URL, {db: {auto_reconnect: true}, noOpen: true, uri_decode_auth: true});
    this.db.open(function(err, db) {
      if (err == null) {
        var regex = new RegExp("^mongo(?:db)?://(?:|([^@/]*)@)([^@/]*)(?:|/([^?]*)(?:|\\?([^?]*)))$");
        var match = process.env.MONGOHQ_URL.match(regex);
        var auth = match[1].split(':', 2);
        auth[0] = decodeURIComponent(auth[0]);
        auth[1] = decodeURIComponent(auth[1]);
        db.authenticate(auth[0], auth[1], function(err, success) {
          if (err) {
            console.error(err);
          } else {
            // worked >:O
          }
        });
      } else {
        console.error(err);
      }
    });
  } else {
    this.db= new Db('collabcoding', new Server(host, port, {auto_reconnect: true}, {}));
    this.db.open(function(){});     
  }
};        

ContentProvider.prototype.getCollection= function(callback) {
  this.db.collection('contents', function(error, project_collection) {
    if( error ) callback(error);
    else callback(null, project_collection);
  });
};

ContentProvider.prototype.findAll = function(user, callback) {
    this.getCollection(function(error, content_collection) {
      if( error ) callback(error)
      else {
        content_collection.find().toArray(function(error, results) {
          if( error ) callback(error) 
          else {             
            var _results = [];
            for(var i = 0 ; i < results.length ; i++) {
               var r = results[i];                                       
               if (r.creator == user.user) {
                 _results.push(r);
               } else {
                 for(var j = 0; j < r.users.length; j++){
                    var  u = r.users[j];
                    if (u == user.user) {
                      _results.push(r);                      
                      break;
                    }
                 }
               }
            }
            callback(null, _results)
          }
        });
      }
    });
};

ContentProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, content_collection) {
      if( error ) callback(error)
      else {
        content_collection.findOne({_id: content_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};
        
ContentProvider.prototype.findBySID = function(sid, callback) {    
    this.getCollection(function(error, content_collection) {        
      if(error) callback(error)
      else {             
        content_collection.findOne({"shareJSId": sid}, function(error, result) {                    
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};
    
ContentProvider.prototype.new = function(name, data, callback) {
  this.getCollection(function(error, content_collection) {
    if (error) callback(error);
    else {                               
      content_collection.findOne({name: name}, function(error, result) {
        
         content_collection.save(result);
      });
    }
  });
};                           
                  
ContentProvider.prototype.delete = function(name, data, callback) {
  this.getCollection(function(err, content_collection) {
    if (err) callback(err)
    else {      
    }
  });
};   

ContentProvider.prototype.newXML = function(data, callback) {
    this.getCollection(function(error, content_collection) {        
        if (error) callback(error);
        else {             
            var content ={}, contents = [];           
            content.shareJSId = data.shareJSId;
            content.snapshot = data.snapshot;            
            content.timestamp = data.timestamp;
            content.owner = data.owner;
            content.path = data.path;
            content.project = data.project;                                 
            
            contents.push(content);         
            content_collection.save(contents, function(error, cs){
                if(error){
                    callback(error, null);                    
                }                
                else {                    
                    callback(null, "ok");
                }
            });               
        }        
   });            
}                                                          

ContentProvider.prototype.save = function(contents, callback) {
    this.getCollection(function(error, content_collection){
        if( error ) callback(error)          
        else {
            console.log("save");
            if ( typeof (contents.length) == "undefined")
                contents = [contents];        
            for (var i = 0; i < contents.length; i++) {
                content = contents[i];
                if (!content.timestamp || !content.shareJSId || !content.snapshot || !content.project || !content.owner || !content.path) {
                    console.log("here"); 
                    callback("error");
                }               
            }        
            content_collection.insert(contents, function() {                                
                callback(null, contents);
            });
        }              
    });        
};

ContentProvider.factory = function(){
  if (!contentProvider) {
    contentProvider = new ContentProvider('localhost', 27017);  
  }
   return contentProvider;  
};

exports.ContentProvider = ContentProvider;