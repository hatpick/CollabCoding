var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;
var  projectProvider = undefined;       

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

ProjectProvider.prototype.findAll = function(callback) {
    this.getCollection(function(error, project_collection) {
      if( error ) callback(error)
      else {
        project_collection.find().toArray(function(error, results) {
          if( error ) callback(error)
          else callback(null, results)
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
         if (!Array.isArray(data.paths)) data.paths = [data.paths];
         for ( var i=0; i < data.paths.length; i++ ) {
           leaf = leaf[data.paths[i]];
         }
         for ( var i=0; i < leaf.length; i++ ) {
          if (leaf[i].name == data.name && leaf[i].type == data.type) {
            callback('duplicated file'); 
            return;
          }
         }  
         var obj = {};
         if (data.type == 'file') {
           obj.name = data.name;
           obj.type = data.type;
           obj.shareJSId = data.shareJSId;
           obj.createOn = new Date();
           obj.last_modified_data = new Date();
         } else {
           // TODO folder
         }     
         leaf.push(obj);
         project_collection.save(result);
      });
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
 * @config {string} last_modified_data The new date
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
          project.created_at = new Date();
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