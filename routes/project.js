var hat = require("hat");
var mongoose = require("mongoose");
var OpenTok = require("opentok");
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

function contains(value, array) {
    for(var i=0; i < array.length; i++) {
        if(array[i] === value) return i;
    }
    return -1;
}

exports.new = function(req, res) {        
  var project_name = req.body.pname;
  var users = req.body.users; 
  if (users == null) users = [];
  if(contains(req.session.user.user, users) === -1) users.push(req.session.user.user);
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
        creator: req.session.user.user,
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
exports.chat = {};
exports.comment = {};
exports.lockedCode = {};

exports.files.new = function(req, res, next) {
  var project_name = req.params["name"];
  var obj = {};
  obj.paths = req.body.paths;
  obj.name = req.body.name;
  obj.type = req.body.type;
  obj.shareJSId = req.body.sid;
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
    res.send(200, {"path": data.paths});
  });
};

// TODO
exports.files.rename = function(req, res, next) {
  console.log('rename');
  var project_name = req.params["name"];
  var obj = {};
  obj.old_name = req.body.old_name;
  obj.new_name = req.body.new_name;
  res.send(200, {
      "oldName":old_name,
      "newName":new_name
  });
};
       
// TODO
exports.files.share = function(req, res, next) {};

exports.files.getContent = function(req, res, next) {
    contentProvider = ContentProvider.factory();                    
    var sid = req.params["id"];        
    contentProvider.findLatest(sid, req.session.user.user, function(error, result){
       if(error){                  
            res.send(404, {error:error});            
        }
        else{            
            res.send(200,{data:result});
        }      
    });    
}

exports.files.saveXML = function(req, res, next) {
    contentProvider = ContentProvider.factory();
         
    var path = req.body.path.replace(/\*/g,'/');
    var snapshot = req.body.snapshot;
    var content = req.body.content;    
    var owner = req.body.owner;
    var timestamp = req.body.timestamp;
    var pname = req.params["name"];
    var sid = req.body.shareJSId;
    
    var queryData = {"shareJSId": sid, "snapshot": snapshot, "contet": content, "timestamp": timestamp, "owner": owner, "path": path, "project": pname};              
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

exports.files.augmentMe = function(req, res, next) {    
    var path = req.params['path'];    
    
    var retVal = {};
        
    var Comment = mongoose.model('Comment');
    var LockedCode = mongoose.model('LockedCode');
    Comment.find({commentPath: path}, function(err, comments){        
        retVal.comments = comments;
        LockedCode.find({lockedCodePath: path}, function(err, lockedCodes){            
            retVal.lockedCodes = lockedCodes;
            res.send(200, {comments: retVal.comments, lockedCodes: retVal.lockedCodes});
        });                              
    });  
}

var chat_rooms = {};

exports.chat.createRTCSession = function(req, res, next) {
    var api_key = req.body.api_key;
    var api_secret = req.body.api_secret;
    var pname = req.body.pname;    
        
    var opentok = new OpenTok.OpenTokSDK(api_key, api_secret);
    
    if(chat_rooms[pname]) {
        var token = opentok.generateToken({session_id:chat_rooms[pname], connection_data:"project:"+ pname +", user:" + req.session.user.user});
        res.send(200, {sessionId:chat_rooms[pname], token:token});        
    }
    else {    
        var location = "128.193.39.9:8001";
        var sessionId = '';
        opentok.createSession(location, function(result){
            sessionId = result;
            chat_rooms[pname] = sessionId;
            var token = opentok.generateToken({session_id:sessionId, connection_data:"project:"+ pname +", user:" + req.session.user.user});            
            res.send(200, {sessionId:sessionId, token:token});
        });
    }
    
}

exports.comment.updateLineNumber = function(req, res, next) {
    var newLine = req.body.lineNumber;
    var cid = req.params['id'];
    
    //mongoose.connect('mongodb://localhost/collabcoding');
    var Comment = mongoose.model('Comment');
    Comment.findOneAndUpdate({commentId: cid}, {$set:{commentLineNumber: newLine}}, function(){res.send(200);});    
}

exports.lockedCode.updateLineNumber = function(req, res, next) {    
    var newFrom = req.body.from;
    var newTo = req.body.to;
    var lcid = req.params['id'];
    
    //mongoose.connect('mongodb://localhost/collabcoding');
    var LockedCode = mongoose.model('LockedCode');
    LockedCode.findOneAndUpdate({lockedCodeId: lcid}, {$set:{lockedCodeFrom: newFrom, lockedCodeTo: newTo}}, function(){res.send(200);});
}

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
