var hat = require("hat");
var CM = require('../models/contentprovider-mongodb');

exports.show = function(req, res) {    
  projectProvider = ProjectProvider.factory();
  if (req.url == "/project/list") {
    projectProvider.findAll(req.session.user, function(error, result) {
      res.json(result);
    });
  } else {
    var project_name = req.query.name;
    if (project_name) {
      projectProvider.findByName(project_name, function(error, result) {
        res.json(result);
      });
    } else {
      res.render("project/index");
    }
  }
};

exports.new = function(req, res) {
  var project_name = req.body.pname;
  var users = req.body.users; 
  if (users == null) users = [];
  projectProvider = ProjectProvider.factory();
  projectProvider.findByName(project_name, function(error, project) {
    console.log(project);
    if (project) {
      console.log("error: duplicated");
      res.render("project/index", {
        error: "Duplicated Name"
      });
    } else {
      projectProvider.save({
        name: project_name,
        creator: req.session.user.name,
        users: users,
        root: {
          html: [],
          css: [],
          js: [],
          files: [ {
            name: "index.html",
            type: "file",
            shareJSId: hat(),
            created_on: new Date,
            last_modified_on: new Date
          } ]
        }
      }, function(error, projects) {
        res.render("project/index");
      });
      res.render("project/index");
    }
  });
};

exports.files = {};

exports.files.new = function(req, res, next) {
  var project_name = req.params["name"];
  var obj = {};
  obj.paths = req.body.paths;
  obj.name = req.body.name;
  obj.type = req.body.type;
  obj.shareJSId = hat();
  obj.created_on = new Date;
  obj.last_modified_on = new Date;
  projectProvider.new(project_name, obj, function(error, project) {
    if (error) {
      res.send(404, {
        error: error
      });
    }
    res.send(200);
  });
};

exports.files.delete = function(req, res, next) {
  var project_name = req.params["name"];
  var data =  {};
	data.paths = req.body.paths;
	data.type = req.body.type;
  projectProvider.delete(project_name, data, function(error, project) {
    if (error) {
      res.send(404, {
        error: error
      });
    }
    res.send(200);
  });
};

// TODO
exports.files.rename = function(req, res, next) {
  console.log('rename');
  var project_name = req.params["name"];
  var obj = {};
  obj.old_name = req.body.old_name;
  obj.new_name = req.body.new_name;
};
       
// TODO
exports.files.share = function(req, res, next) {};

exports.files.getContent = function(req, res, next) {
    contentProvider = ContentProvider.factory();            
    var sid = req.body.sid;    
    
    contentProvider.findBySID(sid, function(error, result){
       if(error){                  
            res.send(404, {error:error});            
        }
        else{            
            res.json(result);
        }      
    });    
}

exports.files.saveXML = function(req, res, next) {
    contentProvider = ContentProvider.factory();
         
    var path = req.body.path.replace(/\*/g,'/')
    var snapshot = req.body.snapshot;    
    var owner = req.body.owner;
    var timestamp = req.body.timestamp;
    var pname = req.params["name"];
    var sid = req.body.shareJSId;
    
    var queryData = {"shareJSId": sid, "snapshot": snapshot, "timestamp": timestamp, "owner": owner, "path": path, "project": pname};          
    
    contentProvider.newXML(queryData, function(error, cs){
        if(error){
            res.send(404, {
            error: error
          });            
        }        
        else {
            res.send(200, {
                cs:cs
            });
        }        
    });        
};

// exports.files.findContent = function(req, res, next) {
//   var shareJSId = req.params["id"];
//   CM.findByshareJSId(shareJSId, function(error, result){
//     res.json(result);
//   });
// };
// 
// 
// exports.syncToMongo = function(req, res, next) {
//   var shareJSId = req.body.shareJSId;
//   var content = req.body.content;
//   var timestamp = req.body.timestamp;
//   CM.save({shareJSId: shareJSId, content: content, timestamp: timestamp}, function(e, r){
//     console.log(e, r);
//     next(); 
//   });
// }
