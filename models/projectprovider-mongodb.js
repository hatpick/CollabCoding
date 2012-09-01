var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var projectProvider = undefined;       

ProjectProvider = function(host, port) { 
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

ProjectProvider.prototype.getCollection= function(callback) {
  this.db.collection('projects', function(error, project_collection) {
    if( error ) callback(error);
    else callback(null, project_collection);
  });
};

ProjectProvider.prototype.findAll = function(user, callback) {
    this.getCollection(function(error, project_collection) {
      if( error ) callback(error)
      else {
        project_collection.find().toArray(function(error, results) {
          if( error ) callback(error) 
          else {             
            var _results = [];
            for(var i = 0 ; i < results.length ; i++) {
               var r = results[i];  
               console.log(r);                         
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

ProjectProvider.prototype.findById = function(id, callback) {
    this.getCollection(function(error, project_collection) {
      if( error ) callback(error)
      else {
        project_collection.findOne({_id: project_collection.db.bson_serializer.ObjectID.createFromHexString(id)}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};
        
ProjectProvider.prototype.findByName = function(name, callback) {
    this.getCollection(function(error, project_collection) {
      if( error ) callback(error)
      else {
        project_collection.findOne({name: name}, function(error, result) {
          if( error ) callback(error)
          else callback(null, result)
        });
      }
    });
};
    
ProjectProvider.prototype.new = function(name, data, callback) {
  this.getCollection(function(error, project_collection) {
    if (error) callback(error);
    else {                               
      project_collection.findOne({name: name}, function(error, result) {
        if (error) callback(error);
         var leaf = result.root;
         var obj = {};
         obj.name = data.name;
         obj.type = data.type;
         obj.created_on = new Date();
         obj.last_modified_on = new Date();
         if (data.paths.length > 1) {
           var i = 0;
           data.paths.shift();   
           leaf = leaf[data.paths[i]];
           i++;
           if (data.paths.length > 1) {
             for (var j=0; j < leaf.length; j++ ) { 
               if (leaf[j].name == data.paths[i] && leaf[j].type == 'folder') {
                 leaf = leaf[j].children;
                 j = 0;
                 i++;
               }
             }
           }  
           for ( var i=0; i < leaf.length; i++ ) {
            if (leaf[i].name == data.name && leaf[i].type == data.type) {
              callback('duplicated file'); 
              return;
            }
           }
           if (data.type == 'file') {
             obj.shareJSId = data.shareJSId
           } else {
             obj.children = [];
           } 
           leaf.push(obj);
         }   else {   
           if (data.type == 'file') {
             obj.shareJSId = data.shareJSId
             leaf.files.push(obj); 
           } else {
             leaf[obj.name] = [];
           } 
         }
         project_collection.save(result);
      });
    }
  });
};                           
                  
ProjectProvider.prototype.delete = function(name, data, callback) {
  console.log('Delete File:')
  this.getCollection(function(err, project_collection) {
    if (err) callback(err)
    else {
      project_collection.findOne({name: name}, function(error, result) {
        if (error) callback(error)
        else {
          // TODO: find the parent arrary and delete by index
          // var leaf = result.root; 
          // while (data.paths.length > 1) {
          //   leaf = leaf[data.paths[0]];
          //   data.paths.shift();  
          // } 
          // if (leaf[0].name == data[0] && leaf[0].type == data[0].type) {
          //     delete leaf[0];
          // }
        }
        project_collection.save(result);
      })
    }
  });
};                  
                                           
/**
 * Update project information
 * @public
 * @param {String} name project name as a key for query
 * @param {Object} data
 * @config {Array} paths The file|folder paths
 * @config {string} cur_name The new file|folder name
 * @config {string} new_name The new file|folder name
 * @config {string} last_modified_on The new date
 * @param {function} [callback] The customized function to handle error
 */

ProjectProvider.prototype.update = function(name, data, callback) {
   // db.projects.update({name: 'test', 'root.html.name': 'index.html'}, {$set:{'root.html.$.name': 'test.html'}})
  this.getCollection(function(error, project_collection) {
     if (error) callback(error);
     else {
       project_collection.findOne({name: name}, function(error, result) {
         var leaf = result.root; 
         var target;
         for ( var i=0; i < data.paths.length; i++ ) { 
           leaf = leaf[data.paths[i]];
         }
         for ( var i=0; i < leaf.length; i++ ) {
           if (leaf[i].name == data.old_name && leaf[i].type == data.type) {
              target = leaf[i];
              break;
           }
         }
         target.name = data.new_name;
         project_collection.save(result);
       });       
     }
  });
};

ProjectProvider.prototype.save = function(projects, callback) {
    this.getCollection(function(error, project_collection) {
      if( error ) callback(error);
      else {
        if( typeof(projects.length)=="undefined")
          projects = [projects];

        for( var i =0;i< projects.length;i++ ) {
          project = projects[i]; 
          if (!project.name || !project.creator || typeof(project.users)=="undefined") { 
            callback(error);
          }
          project.created_on = new Date();
          project.last_modified_on = new Date();
        }

        project_collection.insert(projects, function() {
          callback(null, projects);
        });
      }
    });
};

ProjectProvider.factory = function(){
  if (!projectProvider) {
    projectProvider = new ProjectProvider('localhost', 27017);  
  }
   return projectProvider;  
};

exports.ProjectProvider = ProjectProvider;